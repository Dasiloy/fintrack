# Transaction Auto-Categorisation — Token Scoring

## The Problem

Mono returns a `category` field on each transaction (`food_and_drinks`, `transport`, `unknown`, etc.) and a free-text `narration` ("SHOPRITE SUPERMARKET", "UBA 000132 NIP TRANSFER").

We need to map each transaction to one of the user's categories in our DB — but we can't hardcode slugs or names because:
- Users can create their own custom categories with any name/slug
- System category names could change
- A static map would silently break the moment a category is renamed or deleted

---

## The Approach — Token Scoring

Instead of a lookup table, we **tokenise both sides** and score them against each other.

```
Transaction signals     →   tokenise   →   score against   →   Category tokens
─────────────────────────────────────────────────────────────────────────────────
Mono category enum      →   tokens     →       ×2          →   name + slug tokens
Narration string        →   tokens     →       ×1          →   name + slug tokens
```

The category with the highest total score wins.

---

## Step 1 — Tokenise

`tokenize(text: string): string[]`

Converts any text into a cleaned, filtered list of meaningful words.

**Rules applied in order:**

| Step | Input | Output |
|------|-------|--------|
| Lowercase | `"Food & Dining"` | `"food & dining"` |
| Replace separators (`_`, `-`, `&`, `/`) with space | `"food_and_drinks"` | `"food and drinks"` |
| Strip non-alpha characters | `"9mobile"` | `"mobile"` |
| Remove tokens shorter than 3 chars | `["of", "at", "a"]` | `[]` |
| Remove stopwords | `["and", "the", "for", "cat", "nig"]` | `[]` |

**Examples:**

```
"Food & Dining"      →  ["food", "dining"]
"food_and_drinks"    →  ["food", "drinks"]
"cat-food-dining"    →  ["food", "dining"]       ← slug, "cat" is a stopword
"Transport"          →  ["transport"]
"SHOPRITE SUPERMARKET" → ["shoprite", "supermarket"]
"UBA 000132 NIP TRANSFER" → ["uba", "nip", "transfer"]
"Savings & Investments"   → ["savings", "investments"]
```

**Stopwords removed:**
`and, the, for, with, from, into, or, of, to, a, an, in, on, at, by, cat, per, ltd, plc, nig, nigeria`

---

## Step 2 — Build Category Token Sets (once per job)

Before processing any transactions, each DB category is tokenised from its `name` + `slug` and stored in a `Set<string>`.

```
DB Category             name tokens      slug tokens       combined Set
──────────────────────────────────────────────────────────────────────
Food & Dining           [food, dining]   [food, dining]    {food, dining}
Groceries               [groceries]      [groceries]       {groceries}
Transport               [transport]      [transport]       {transport}
Healthcare              [healthcare]     [healthcare]      {healthcare}
Savings & Investments   [savings,        [savings]         {savings, investments}
                         investments]
Miscellaneous           [miscellaneous]  [misc]            {miscellaneous, misc}
Income                  [income]         [income]          {income}
```

This happens **once per sync job** — not once per transaction.

---

## Step 3 — Score Each Transaction

For each transaction, two token lists are produced:

| Signal | Source | Weight |
|--------|--------|--------|
| Mono tokens | `tx.category` enum value | **×2** |
| Narration tokens | `tx.narration` string | **×1** |

Mono tokens are weighted higher because they are a curated signal from Mono's own ML classification. Narration is free text and noisier.

**Matching rule (`tokenMatches`):**

A token matches a category's token set if:
1. **Exact match** — token is in the set (`"food"` in `{"food", "dining"}`)
2. **Substring match** — one is contained in the other, with a minimum length of 4 chars to avoid noise
   - `"grocer"` matches `"groceries"` ✓
   - `"drink"` matches `"drinks"` ✓
   - `"the"` does NOT match `"therapy"` ✗ (too short, filtered earlier anyway)

---

## Step 4 — Walk-through Examples

### Example 1 — Clear Mono signal

```
tx.category  = "food_and_drinks"
tx.narration = "KFC IKEJA"

Mono tokens:      ["food", "drinks"]
Narration tokens: ["kfc", "ikeja"]

Category scoring:
  Food & Dining     {food, dining}          "food" exact match ×2 → score 2  ✓ WINNER
  Groceries         {groceries}             no match → score 0
  Transport         {transport}             no match → score 0
  ...
```

### Example 2 — Narration saves the day (Mono says unknown)

```
tx.category  = "unknown"
tx.narration = "SHOPRITE SUPERMARKET"

Mono tokens:      []   (unknown → skipped)
Narration tokens: ["shoprite", "supermarket"]

Category scoring:
  Food & Dining     {food, dining}     no match → 0
  Groceries         {groceries}        "supermarket" contains "super"? no.
                                       "groceries" contains "shoprite"? no.
                                       → score 0
  Miscellaneous     {misc, ...}        no match → 0
  ...

Result: fallback → Miscellaneous
```

> "SHOPRITE" alone won't match "Groceries" since neither is a substring of the other.
> This is the natural limit of token scoring without a merchant database.
> Mono usually provides `groceries` or `food_and_drinks` for Shoprite transactions
> so the Mono signal handles most real cases.

### Example 3 — Narration matches category directly

```
tx.category  = "unknown"
tx.narration = "TRANSPORT FARE PAYMENT"

Mono tokens:      []
Narration tokens: ["transport", "fare", "payment"]

Category scoring:
  Transport  {transport}   "transport" exact match ×1 → score 1  ✓ WINNER
```

### Example 4 — Both signals align (high confidence)

```
tx.category  = "transport"
tx.narration = "UBER TRIP PAYMENT"

Mono tokens:      ["transport"]
Narration tokens: ["uber", "trip", "payment"]

Category scoring:
  Transport  {transport}   "transport" ×2 → score 2  ✓ WINNER
```

### Example 5 — Substring match

```
tx.category  = "savings"
tx.narration = "FIXED DEPOSIT SAVINGS"

Mono tokens:      ["savings"]
Narration tokens: ["fixed", "deposit", "savings"]

Category scoring:
  Savings & Investments  {savings, investments}
    Mono:      "savings" exact match ×2 → 2
    Narration: "savings" exact match ×1 → 1
    Total: 3  ✓ WINNER
```

---

## Step 5 — Fallback

If no category scores above 0, the fallback is found **dynamically**:

```ts
categories.find(c =>
  /misc|general|other/i.test(c.name) || /misc|general|other/.test(c.slug)
)
```

This finds the right catch-all category regardless of what it's named — "Miscellaneous", "General", "Other Expenses", "misc-stuff" — without hardcoding any slug.

If even that finds nothing, the first category in the loaded list is used.

---

## Why Not a Static Map?

| Approach | Problem |
|----------|---------|
| `MONO_CATEGORY_NAME_MAP` (hardcoded `food_and_drinks → "Food & Dining"`) | Breaks if user renames the category |
| `NARRATION_KEYWORD_RULES` (hardcoded `["shoprite"] → "cat-food"`) | Hardcodes slugs; breaks if category is deleted; doesn't scale to user categories |
| Token scoring | Works against whatever categories exist in DB at job time |

---

## Limitations

Token scoring is effective when:
- Mono provides a non-`unknown` category (covers ~85–90% of transactions)
- The narration contains words that appear in a category name/slug

It falls short when:
- Mono says `unknown` AND the narration is pure merchant names ("KFC IKEJA", "SHOPRITE VI")
- In those cases the transaction is assigned to the fallback (Miscellaneous), which the user can re-categorise manually

A future improvement would be a merchant enrichment lookup (MCC code database or an AI classification call to the existing `ai_service`) for the `unknown` + opaque-narration cases.
