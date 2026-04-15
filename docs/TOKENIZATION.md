# Transaction Auto-Categorisation — Architecture

## The Real-World Problem

Most Nigerian bank narrations look like this:

```
NIP/KUDA/SAMUEL OLAMIDE/TRANSFER 1
UBA 000132 NIP TRANSFER
AIRTIME PURCHASE 08012345678
DSTV PAYMENT REF 991234
```

Users rarely write meaningful descriptions. Mono's `category` enum covers
~85–90 % of transactions, but for the rest — especially peer transfers tagged
`unknown` — the narration is the only signal and it's almost always noise.

Pure token scoring against category names works well when Mono classifies
correctly. It breaks when Mono says `unknown` and the narration contains a
bank name, a sender's name, or an opaque reference code.

The solution is a **layered pipeline** that progressively enriches the signal
before giving up and calling AI.

---

## Pipeline Overview

```
Transaction (narration + Mono category)
          │
          ▼
┌─────────────────────────────────┐
│  Layer 1 — Merchant DB Scan     │  Narration tokens looked up in
│  (per job: in-memory map)       │  NigerianMerchant table → hint tokens
└─────────────────┬───────────────┘
                  │ merchantHintTokens[]
                  ▼
┌─────────────────────────────────┐
│  Layer 2 — Token Scoring        │  Score each category using 3 signals:
│  (pure CPU, no DB)              │  Mono(×2) + MerchantHint(×2) + Narration(×1)
│                                 │  Category token set = name + slug + tags
└─────────────────┬───────────────┘
                  │
          score > 0? ──YES──► resolved category
                  │NO
                  ▼
┌─────────────────────────────────┐
│  Layer 3 — AI Classification    │  Batch call for all score=0 transactions
│  (selective, one call per job)  │  Model picks from user's actual categories
└─────────────────┬───────────────┘
                  │
          still no match? ──► dynamic fallback (misc/general/other)
```

Each layer only activates for what the previous layer could not resolve.

---

## Layer 0 — Category Tags

### What they are

Tags are a list of explicit hint tokens attached to a category. They extend
the token set used during scoring without requiring the hint words to appear
in the category name.

```
Category: Food & Dining
  name tokens:  [food, dining]
  tags:         [kfc, shoprite, restaurant, burger, pizza, chicken, eat, cafe]
  ────────────────────────────────────────────────────────────────────────────
  full token set: {food, dining, kfc, shoprite, restaurant, burger, pizza,
                   chicken, eat, cafe}
```

Without tags, "KFC IKEJA" with `Mono=unknown` would score 0 and fall through
to AI. With tags, "kfc" hits the token set directly and resolves instantly.

### Prisma schema

```prisma
model Category {
  id       String   @id @default(cuid())
  name     String
  slug     String
  isSystem Boolean  @default(false)
  userId   String?
  tags     String[] @default([])   // ← new field
  // ...existing relations
}
```

Tags are stored as a plain string array on the category — no join table
needed. PostgreSQL GIN-indexes `String[]` efficiently.

### System category seed tags

| Category              | Tags                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Food & Dining         | kfc, shoprite, restaurant, burger, pizza, chicken, eat, cafe, bar, canteen, eatery, spar, dine           |
| Groceries             | shoprite, spar, market, supermarket, store, supply, provisions                                           |
| Transport             | uber, bolt, taxify, okada, ride, fare, fuel, petrol, toll, park, bus, train                              |
| Utilities             | mtn, airtel, glo, mobile, nepa, phcn, ikedc, ekedc, aedc, dstv, gotv, electricity, water, bill, recharge |
| Healthcare            | pharmacy, hospital, clinic, lab, doctor, medic, health, drug                                             |
| Savings & Investments | piggybank, cowrywise, stash, risevest, bamboo, invest, savings, fixed, deposit                           |
| Entertainment         | netflix, showmax, spotify, apple, amazon, cinema, event, ticket, stream                                  |
| Education             | school, tuition, course, exam, waec, jamb, fees, lesson                                                  |
| Transfers             | nip, transfer, send, received, payment, remit                                                            |
| Miscellaneous         | — (catch-all, no tags needed)                                                                            |

### User-defined tags

When a user creates a custom category (e.g., "Side Business"), they can
optionally supply tags:

```json
{ "name": "Side Business", "tags": ["invoice", "client", "freelance", "paystack"] }
```

The form makes this optional with a helper prompt: _"Add keywords that
describe transactions in this category (e.g. merchant names, payment types)"._

### Pipeline snapshot — tags enriching the token set

```
buildCategoryTokenSets(categories)
  │
  for each category:
  │   name tokens   = tokenize(c.name)   → ["food", "dining"]
  │   tag tokens    = c.tags             → ["kfc", "shoprite", ...]
  │   ──────────────────────────────────────────────────────────
  │   Set<string>   = union of both  → {food, dining, kfc, shoprite, ...}
  │
  returns CategoryTokenSet[]   (built once per job)
```

---

## Layer 1 — Nigerian Merchant DB Scan

### What it is

A table of known Nigerian merchants and bank identifiers, each mapped to a
list of category hint tokens. The processor loads this table once per job
into a `Map<string, string[]>` keyed by merchant name (uppercase), covering
all aliases.

When a narration is processed, each of its tokens is looked up in this map.
Every hit injects the merchant's hint tokens into the scoring pipeline at the
same weight as Mono's own category signal (×2 — curated knowledge).

### Prisma schema

```prisma
model NigerianMerchant {
  id           String   @id @default(cuid())
  name         String   @unique        // canonical name, uppercase — "KFC"
  aliases      String[]                // alternate narration fragments — ["KENTUCKY", "K F C"]
  categoryHint String                  // space-separated hint tokens — "food restaurant fast"
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([name])
}
```

### Seed data (initial Nigerian merchant list)

| name             | aliases          | categoryHint                         |
| ---------------- | ---------------- | ------------------------------------ |
| KFC              | KENTUCKY         | food restaurant fast dining          |
| SHOPRITE         | SHOP RITE        | groceries supermarket food shopping  |
| SPAR             | —                | groceries supermarket food shopping  |
| CHICKEN REPUBLIC | CHICKEN REP      | food restaurant fast dining          |
| TANTALIZERS      | TANTALISERS      | food restaurant dining               |
| DOMINOS          | DOMINO           | food restaurant pizza dining         |
| COLDSTONE        | COLD STONE       | food restaurant dessert dining       |
| UBER             | UBER TRIP        | transport ride                       |
| BOLT             | TAXIFY           | transport ride                       |
| KUDA             | KUDA BANK        | transfer bank finance                |
| OPAY             | O PAY            | transfer bank finance payment        |
| PALMPAY          | PALM PAY         | transfer bank finance payment        |
| GTB              | GTBANK, GUARANTY | transfer bank finance                |
| UBA              | —                | transfer bank finance                |
| ZENITH           | ZENITH BANK      | transfer bank finance                |
| ACCESS           | ACCESS BANK      | transfer bank finance                |
| FIRSTBANK        | FIRST BANK       | transfer bank finance                |
| FCMB             | —                | transfer bank finance                |
| STANBIC          | STANBIC IBTC     | transfer bank finance                |
| MTN              | —                | utilities airtime data telecom       |
| AIRTEL           | —                | utilities airtime data telecom       |
| GLO              | GLOBACOM         | utilities airtime data telecom       |
| 9MOBILE          | ETISALAT         | utilities airtime data telecom       |
| DSTV             | —                | utilities entertainment subscription |
| GOTV             | GOtv             | utilities entertainment subscription |
| SHOWMAX          | —                | utilities entertainment subscription |
| NETFLIX          | —                | utilities entertainment subscription |
| IKEDC            | IKEJA ELECTRIC   | utilities electricity bills          |
| EKEDC            | EKO ELECTRIC     | utilities electricity bills          |
| AEDC             | ABUJA ELECTRIC   | utilities electricity bills          |
| PHCN             | NEPA             | utilities electricity bills          |
| LAWMA            | —                | utilities bills                      |
| PAYSTACK         | —                | payment finance                      |
| FLUTTERWAVE      | FLUTTER          | payment finance                      |
| NIP              | —                | transfer payment                     |

### How narration tokens are matched

Narration: `"NIP/KUDA/SAMUEL OLAMIDE/TRANSFER 1"`

```
Step 1 — split on /, -, space          → ["NIP", "KUDA", "SAMUEL", "OLAMIDE", "TRANSFER", "1"]
Step 2 — uppercase each token
Step 3 — look up each in merchantMap
          "NIP"     → hit → ["transfer", "payment"]
          "KUDA"    → hit → ["transfer", "bank", "finance"]
          "SAMUEL"  → miss
          "OLAMIDE" → miss
          "TRANSFER"→ miss (not in table; generic word)
          "1"       → miss
Step 4 — union all hits → merchantHintTokens = ["transfer", "payment", "bank", "finance"]
```

These tokens enter scoring at ×2 weight, same as Mono's own classification.

### Loading the merchant map (once per job)

```
handleSyncAccount()
  │
  ├─ prisma.category.findMany(...)       → categories[]
  ├─ prisma.nigerianMerchant.findMany()  → merchants[]
  │
  ├─ buildCategoryTokenSets(categories)  → CategoryTokenSet[]
  ├─ buildMerchantMap(merchants)         → Map<string, string[]>
  │    for each merchant:
  │      merchantMap.set(m.name, tokens)
  │      for alias of m.aliases:
  │        merchantMap.set(alias, tokens)   // all aliases share same hints
  │
  └─ process each transaction...
```

---

## Layer 2 — Token Scoring

### Inputs per transaction

| Signal               | Source                                      | Weight |
| -------------------- | ------------------------------------------- | ------ |
| Mono tokens          | `tx.category` enum (e.g. `food_and_drinks`) | **×2** |
| Merchant hint tokens | NigerianMerchant lookup on narration        | **×2** |
| Narration tokens     | `tx.narration` free-text                    | **×1** |

### Category token set

Built once per job from: `name tokens ∪ tag tokens`

### Matching rule

A token `t` matches a category's token set if:

1. **Exact** — `t` is in the set
2. **Substring** — one is contained in the other, with minimum 4-char length
   (guards against "the" matching "therapy")

### Scoring loop

```
for each transaction tx:
  monoTokens    = tokenize(tx.category)              // [] if "unknown"
  narTokens     = tokenize(tx.narration)
  merchantHints = lookupMerchantHints(tx.narration)  // [] if no match

  for each category C in catTokenSets:
    score = 0
    for t in monoTokens:    if match(t, C.tokens): score += 2
    for t in merchantHints: if match(t, C.tokens): score += 2
    for t in narTokens:     if match(t, C.tokens): score += 1

  winner = category with highest score
  if winner.score == 0 → add to unresolved[]
```

### Full walk-through: NIP/KUDA transfer

```
tx.category  = "unknown"
tx.narration = "NIP/KUDA/SAMUEL OLAMIDE/TRANSFER 1"

Mono tokens:     []
Merchant hits:   ["transfer", "payment", "bank", "finance"]
Narration tokens: ["nip", "kuda", "samuel", "olamide", "transfer"]

Category scoring:
  Transfers   {nip, transfer, send, ...}
    merchant: "transfer" exact ×2 → 2
    merchant: "payment"  miss → 0
    merchant: "bank"     miss → 0
    narration: "nip"     exact ×1 → 1
    narration: "transfer" exact ×1 → 1
    Total: 4  ✓ WINNER

  Food & Dining   {food, dining, kfc, ...}
    merchant: "bank"    miss → 0
    Total: 0

Result: Transfers (score 4)
```

### Walk-through: Mono provides clear signal

```
tx.category  = "food_and_drinks"
tx.narration = "KFC IKEJA"

Mono tokens:     ["food", "drinks"]
Merchant hits:   ["food", "restaurant", "fast", "dining"]   ← "KFC" matched
Narration tokens: ["kfc", "ikeja"]

Category scoring:
  Food & Dining  {food, dining, kfc, shoprite, restaurant, ...}
    mono:     "food"       exact ×2 → 2
    merchant: "food"       exact ×2 → 2
    merchant: "restaurant" exact ×2 → 2
    merchant: "dining"     exact ×2 → 2
    narration: "kfc"       exact ×1 → 1
    Total: 9  ✓ WINNER (very high confidence)
```

### Walk-through: Only narration saves it

```
tx.category  = "unknown"
tx.narration = "TRANSPORT FARE PAYMENT"

Mono tokens:     []
Merchant hits:   []
Narration tokens: ["transport", "fare", "payment"]

Category scoring:
  Transport  {transport, uber, bolt, ride, fare, fuel, ...}
    narration: "transport" exact ×1 → 1
    narration: "fare"      exact ×1 → 1
    Total: 2  ✓ WINNER
```

### Walk-through: Airtime purchase

```
tx.category  = "unknown"
tx.narration = "AIRTIME PURCHASE 08012345678"

Mono tokens:     []
Merchant hits:   []   ("AIRTIME", "PURCHASE" not in merchant table — generic words)
Narration tokens: ["airtime", "purchase"]

Category scoring (assuming "airtime" is a tag on Utilities):
  Utilities  {mtn, airtel, glo, nepa, bill, recharge, airtime, ...}
    narration: "airtime" exact ×1 → 1
    Total: 1  ✓ WINNER
```

> This is why tags matter: "airtime" would never appear in a category name
> ("Utilities") or slug ("cat-utilities"), but it belongs in the token set.

---

## Layer 3 — AI Classification (Selective Fallback)

### When it activates

Only for transactions where all previous layers returned score = 0.
In practice this is a small subset — opaque reference numbers, employer
payroll codes, or obscure merchant names not yet in the merchant table.

### How it works

All unresolved transactions are collected **after** token scoring finishes,
then sent to the `ai_service` as a **single batched gRPC call**. The model
receives the full list of the user's categories (name + slug) in the prompt
and returns a JSON map of `{ transactionId → categorySlug }`. No hardcoded
slugs — the model picks from whatever categories actually exist.

```
Token scoring → 47 resolved, 8 unresolved (score = 0)
                                   │
                    ai_service.ClassifyTransactions({
                      transactions: [{ id, narration, monoCategory }, ...],
                      categories:   [{ name, slug }, ...]
                    })
                                   │
                    returns: { "tx_abc" → "cat-misc", "tx_def" → "cat-food", ... }
                                   │
All 55 transactions now have categoryId → batch create
```

### Cost model

| Layer            | Covers                                            | Latency                | Cost                    |
| ---------------- | ------------------------------------------------- | ---------------------- | ----------------------- |
| Merchant DB      | ~10–15 % extra (NIP/bank transfers, known brands) | ~0 ms (in-memory)      | Free                    |
| Token scoring    | ~80–90 % of transactions                          | ~0 ms (CPU only)       | Free                    |
| AI batch         | Remaining ~5–10 %                                 | ~500 ms–2 s (one call) | ~$0.001–0.005 per batch |
| Dynamic fallback | Last resort                                       | ~0 ms                  | Free                    |

AI is the final safety net, not the primary path.

---

## Tokenize Function

```
tokenize(text: string): string[]

Rules (applied in order):
  1. Lowercase
  2. Replace separators (_, -, &, /, \) with space
  3. Split on whitespace
  4. Strip non-alpha chars from each token
  5. Drop tokens shorter than 3 chars
  6. Drop STOPWORDS
```

**STOPWORDS:** `and the for with from into or of to a an in on at by cat per ltd plc nig nigeria`

**Examples:**

```
"food_and_drinks"              → ["food", "drinks"]
"NIP/KUDA/SAMUEL OLAMIDE"      → ["nip", "kuda", "samuel", "olamide"]
"AIRTIME PURCHASE 08012345678" → ["airtime", "purchase"]
"Food & Dining"                → ["food", "dining"]
"Savings & Investments"        → ["savings", "investments"]
```

---

## Prisma Schema Summary

Two additions to the existing schema:

```prisma
// On existing Category model — add one field:
tags  String[]  @default([])

// New table:
model NigerianMerchant {
  id           String   @id @default(cuid())
  name         String   @unique        // canonical uppercase key
  aliases      String[]                // alternate narration fragments
  categoryHint String                  // space-separated hint tokens
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([name])
}
```

---

## Self-Learning Loop (Future)

Every time a user manually re-categorises a bank transaction, the correction
can write back into the merchant table automatically:

```
User moves "KFC IKEJA" from Miscellaneous → Food & Dining
  │
  extract narration candidate: "KFC"
  │
  upsert NigerianMerchant { name: "KFC", categoryHint: "food restaurant dining" }
```

Over time the merchant table grows organically from real user corrections,
covering Nigerian merchants that are not in the initial seed — without any
manual curation effort.

---

## Processor Execution Order (per sync job)

```
handleSyncAccount()
  │
  1. prisma.category.findMany()          → categories[]
  2. prisma.nigerianMerchant.findMany()  → merchants[]
  3. buildCategoryTokenSets(categories)  → CategoryTokenSet[]   (name+tags)
  4. buildMerchantMap(merchants)         → Map<string, string[]>
  │
  5. fetch all Mono transaction pages    → MonoTransaction[]
  │
  6. for each tx:
  │    merchantHints  = lookupMerchantHints(tx.narration, merchantMap)
  │    categoryId     = resolveCategory(tx, catTokenSets, merchantHints, fallbackId)
  │    collect resolved and unresolved
  │
  7. if unresolved.length > 0:
  │    ai_service.ClassifyTransactions(unresolved, categories)
  │    apply AI results
  │
  8. transactionService.batchCreateMonoTransactions(userId, allTransactions)
  │    → single gRPC call, skipDuplicates handles idempotency
  │
  9. accountService.updateMonoBankAccount(account, id)
  10. fcmService.sendToUser(...)          → push notification
```
