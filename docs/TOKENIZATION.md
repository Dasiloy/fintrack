# Transaction Classification Pipeline

## Where this runs

This pipeline lives entirely inside `finance_service`, executed by `account.processor.ts` every time a Mono bank account is synced. The AI call in Layer 3 is the only part that crosses a service boundary — it's a single gRPC call to `ai_service`. See [AI-SERVICE.md](./AI-SERVICE.md) for how that service handles the request.

---

## The Real-World Problem

Most Nigerian bank narrations look like this:

```
NIP/KUDA/SAMUEL OLAMIDE/TRANSFER 1
UBA 000132 NIP TRANSFER
AIRTIME PURCHASE 08012345678
DSTV PAYMENT REF 991234
```

Users rarely write meaningful descriptions. Mono's `category` enum covers ~85–90% of transactions, but for the rest — especially peer transfers tagged `unknown` — the narration is the only signal and it's almost always noise.

Pure token scoring against category names works well when Mono classifies correctly. It breaks when Mono says `unknown` and the narration contains a bank name, a sender's name, or an opaque reference code.

The solution is a **layered pipeline** that progressively enriches the signal before calling AI.

---

## The Two Transaction Fields

Before the pipeline, two fields on `Transaction` must be understood:

| Field | Type | Source | Mutable? |
|-------|------|--------|----------|
| `narration` | `String?` | Set once at Mono sync from the raw bank narration. This is the AI's source of truth. | Never — not user-editable |
| `bankCategory` | `String?` | Set once at Mono sync from Mono's raw category enum (e.g. `food_and_drinks`). | Never |
| `description` | `String` | Defaults to the narration at sync, but the user can rename it freely in the UI. | Yes — user-editable |

`narration` and `bankCategory` are both null for manually-created transactions (they have no Mono origin). Token scoring and AI classification always read `narration` and `bankCategory` — never `description`, which may have been changed by the user.

---

## Pipeline Overview

```
Transaction (narration + bankCategory)
          │
          ▼
┌─────────────────────────────────┐
│  Layer 0 — Category Tags        │  Token set for each category =
│  (built once per job)           │  name tokens ∪ tag tokens (from DB)
└─────────────────┬───────────────┘
                  │ CategoryTokenSet[]
                  ▼
┌─────────────────────────────────┐
│  Layer 1 — Merchant DB Scan     │  Narration tokens looked up in
│  (per job: in-memory map)       │  NigerianMerchant table → hint tokens
└─────────────────┬───────────────┘
                  │ merchantHintTokens[]
                  ▼
┌─────────────────────────────────┐
│  Layer 2 — Token Scoring        │  Score each category using 3 signals:
│  (pure CPU, no DB)              │  bankCategory(×2) + merchantHint(×2) + narration(×1)
└─────────────────┬───────────────┘
                  │
          score > 0? ──YES──► resolved category
                  │NO
                  ▼
┌─────────────────────────────────┐
│  Layer 3 — AI Classification    │  Single batched gRPC call to ai_service
│  (selective, one call per job)  │  for all score=0 transactions
└─────────────────┬───────────────┘
                  │
          still no match? ──► Miscellaneous (cat-misc)
```

Each layer only activates for what the previous layer could not resolve.

---

## Layer 0 — Category Tags

### What they are

Tags are explicit hint tokens stored on each category. They extend the token set used during scoring without requiring the hint words to appear in the category name or slug.

```
Category: Bills & Utilities  (slug: cat-bills-utilities)
  name tokens:  [bills, utilities]
  tags:         [airtime, data, mtn, dstv, electricity, ikedc, ...]
  ──────────────────────────────────────────────────────────────────
  full token set: {bills, utilities, airtime, data, mtn, dstv, electricity, ...}
```

Without tags, `"AIRTIME PURCHASE 08012345678"` with `bankCategory=unknown` would score 0 and fall through to AI. With tags, `"airtime"` hits the set directly and resolves instantly.

### Prisma schema

```prisma
model Category {
  id       String   @id @default(cuid())
  name     String
  slug     String
  isSystem Boolean  @default(false)
  userId   String?
  tags     String[] @default([])
  // ...other fields
}
```

Tags are a plain `String[]` on each category — no join table. PostgreSQL GIN-indexes `String[]` efficiently.

### System category seed tags

These are the 10 system categories and their tags. The full seed is in [seed.ts](../packages/database/prisma/seed.ts).

| Category | Slug | Representative tags |
|----------|------|---------------------|
| Food & Groceries | `cat-food` | food, dining, restaurant, delivery, groceries, supermarket, kfc, shoprite, spar, bukka, chowdeck, pizza, burger |
| Income | `cat-income` | income, salary, credit, refund, cashback, received, inflow, settlement, payout, allowance, stipend |
| Transport | `cat-transport` | transport, uber, bolt, taxify, fuel, petrol, fare, keke, okada, logistics, flight, travel, dispatch |
| Bills & Utilities | `cat-bills-utilities` | bills, electricity, nepa, ikedc, ekedc, airtime, data, mtn, dstv, gotv, internet, wifi, spectranet, token |
| Shopping & Retail | `cat-shopping` | shopping, retail, clothing, electronics, jumia, konga, jiji, slot, mall, ecommerce, gadgets |
| Healthcare | `cat-healthcare` | healthcare, hospital, pharmacy, drugs, doctor, clinic, medplus, healthplus, lab, wellness, salon, spa |
| Entertainment | `cat-entertainment` | entertainment, netflix, spotify, showmax, cinema, betting, bet9ja, sportybet, streaming, concert, ticket |
| Education | `cat-education` | education, school, tuition, fees, waec, jamb, coursera, udemy, course, training, exam, scholarship |
| Savings & Investments | `cat-savings` | savings, investment, piggyvest, cowrywise, risevest, stocks, pension, crypto, insurance, mortgage, deposit |
| Miscellaneous | `cat-misc` | misc, charges, bank charge, tax, atm, withdrawal, cash, stamp duty, vat, processing fee, maintenance |

### User-defined tags

When a user creates a custom category (e.g., "Side Business"), they can optionally supply tags:

```json
{ "name": "Side Business", "tags": ["invoice", "client", "freelance", "paystack"] }
```

### How tags are built into the token set (once per job)

```typescript
interface CategoryTokenSet {
  id: string;
  slug: string;
  tokens: Set<string>;   // name tokens ∪ tag tokens
}

function buildCategoryTokenSets(categories: Category[]): CategoryTokenSet[] {
  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    tokens: new Set([...tokenize(c.name), ...c.tags.map((t) => t.toLowerCase())]),
  }));
}
```

Built once per sync job, reused for every transaction in that job.

---

## Layer 1 — Nigerian Merchant DB Scan

### What it is

A table of known Nigerian merchants and bank identifiers. Each row has a canonical name, a list of narration aliases (alternate spellings as they appear in bank text), and a `categoryHint` — a space-separated string of category-relevant tokens.

The processor loads the full table once per sync job into a `Map<string, string[]>` keyed by each name and alias (uppercase). When a narration token hits the map, its hint tokens are injected into scoring at the same weight as Mono's own signal (×2 — curated knowledge).

### Prisma schema

```prisma
model NigerianMerchant {
  id           String   @id @default(cuid())
  name         String   @unique   // canonical, uppercase — "KFC"
  aliases      String[]           // alternate narration fragments — ["KENTUCKY", "KENTUCKY FRIED CHICKEN"]
  categoryHint String             // space-separated hint tokens — "food dining restaurant fast"
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([name])
}
```

### Seed data

The seed in [seed.ts](../packages/database/prisma/seed.ts) ships 69 Nigerian merchants across 9 groups: food & dining, groceries, transport/fuel, telecom, cable TV, electricity DISCOs, ISPs, shopping, healthcare, entertainment/betting, fintech, and savings platforms.

Representative entries:

| name | aliases | categoryHint |
|------|---------|--------------|
| KFC | KENTUCKY, KENTUCKY FRIED CHICKEN | food dining restaurant fast chicken |
| SHOPRITE | SHOPRITE NIGERIA, SHOPRITE CHECKERS | groceries supermarket retail food |
| UBER | UBER TRIP, UBER BV | transport ride |
| BOLT | BOLT NIGERIA, TAXIFY | transport ride |
| MTN | MTN NIGERIA | bills utilities airtime data phone |
| DSTV | DSTV NIGERIA, MULTICHOICE | bills utilities entertainment cable tv |
| IKEDC | IKEJA ELECTRIC, IKEJA DISCO | bills utilities electricity nepa phcn |
| PIGGYVEST | PIGGYBANK, PIGGYVEST LTD | savings investment |
| KUDA | KUDA BANK, KUDA MFB | transfer payment fintech savings |
| BET9JA | BET 9JA, BET9JA.COM | entertainment betting gambling sport |

### How narration tokens are matched

Narration: `"CHOWDECK DELIVERY PAYMENT REF 88291"`

```
Step 1 — split on /, -, space        → ["CHOWDECK", "DELIVERY", "PAYMENT", "REF", "88291"]
Step 2 — uppercase each token
Step 3 — look up each in merchantMap
          "CHOWDECK" → hit → ["food", "delivery", "dining"]
          "DELIVERY" → miss (generic word, not in table)
          "PAYMENT"  → miss
          "REF"      → miss (too short after tokenize: dropped)
          "88291"    → miss (non-alpha stripped)
Step 4 — union all hits → merchantHintTokens = ["food", "delivery", "dining"]
```

### Loading the merchant map (once per job)

```typescript
async function handleSyncAccount(userId: string, accountId: string) {
  const [categories, merchants] = await Promise.all([
    prisma.category.findMany({ where: { OR: [{ isSystem: true }, { userId }] } }),
    prisma.nigerianMerchant.findMany(),
  ]);

  const catTokenSets = buildCategoryTokenSets(categories);
  const merchantMap  = buildMerchantMap(merchants);
  //    merchantMap: Map<string, string[]>
  //    built by: merchantMap.set(m.name, tokens); aliases.forEach(a => merchantMap.set(a, tokens))

  // ...process each transaction
}
```

---

## Layer 2 — Token Scoring

### Inputs per transaction

| Signal | Source | Weight |
|--------|--------|--------|
| bankCategory tokens | `tx.bankCategory` — Mono enum e.g. `food_and_drinks` → `["food", "drinks"]` | **×2** |
| Merchant hint tokens | NigerianMerchant lookup on `tx.narration` | **×2** |
| Narration tokens | `tx.narration` free-text tokenized | **×1** |

Mono gets ×2 because it's curated bank data. Merchant hints get ×2 for the same reason. Raw narration text gets ×1 as a weaker, unverified signal.

### Matching rule

A token `t` matches a category's token set if:

1. **Exact** — `t` is in the set, or
2. **Substring** — one contains the other, with minimum 4-char length (guards against short tokens like `"the"` matching `"therapy"`)

### Scoring loop

```typescript
for (const tx of transactions) {
  const monoTokens    = tokenize(tx.bankCategory ?? '');      // [] if null/unknown
  const narTokens     = tokenize(tx.narration ?? '');
  const merchantHints = lookupMerchantHints(tx.narration, merchantMap);

  let winner: CategoryTokenSet | null = null;
  let topScore = 0;

  for (const cat of catTokenSets) {
    let score = 0;
    for (const t of monoTokens)    if (matches(t, cat.tokens)) score += 2;
    for (const t of merchantHints) if (matches(t, cat.tokens)) score += 2;
    for (const t of narTokens)     if (matches(t, cat.tokens)) score += 1;
    if (score > topScore) { topScore = score; winner = cat; }
  }

  if (topScore === 0) unresolved.push(tx);
  else resolved.push({ ...tx, categorySlug: winner!.slug });
}
```

### Walk-through: Strong Mono signal + merchant match

```
tx.bankCategory = "food_and_drinks"
tx.narration    = "KFC IKEJA LEKKI"

bankCategory tokens: ["food", "drinks"]
merchantHintTokens:  ["food", "dining", "restaurant", "fast", "chicken"]  ← "KFC" matched
narration tokens:    ["kfc", "ikeja", "lekki"]

Scoring against Food & Groceries  {food, dining, restaurant, groceries, ...}:
  bankCategory: "food"       exact ×2 → 2
  merchant:     "food"       exact ×2 → 2
  merchant:     "dining"     exact ×2 → 2
  merchant:     "restaurant" exact ×2 → 2
  narration:    "kfc"        exact ×1 → 1
  Total: 9  ✓ WINNER (very high confidence)
```

### Walk-through: Only narration saves it

```
tx.bankCategory = null
tx.narration    = "TRANSPORT FARE PAYMENT"

bankCategory tokens: []
merchantHintTokens:  []
narration tokens:    ["transport", "fare", "payment"]

Scoring against Transport  {transport, uber, bolt, ride, fare, fuel, ...}:
  narration: "transport" exact ×1 → 1
  narration: "fare"      exact ×1 → 1
  Total: 2  ✓ WINNER
```

### Walk-through: Tags matter — airtime

```
tx.bankCategory = "unknown"
tx.narration    = "AIRTIME PURCHASE 08012345678"

bankCategory tokens: []        ("unknown" produces no scoring tokens after tokenize)
merchantHintTokens:  []        ("AIRTIME", "PURCHASE" not in merchant table — generic words)
narration tokens:    ["airtime", "purchase"]

Scoring against Bills & Utilities  {bills, utilities, airtime, data, mtn, ...}:
  narration: "airtime" exact ×1 → 1
  Total: 1  ✓ WINNER
```

> This is why tags matter: `"airtime"` would never appear in the category name `"Bills & Utilities"`
> or slug `"cat-bills-utilities"`, but it's in the tag list — so it scores.

### Walk-through: Opaque narration — score = 0 → AI

```
tx.bankCategory = "unknown"
tx.narration    = "PMT REF 991247/ACC SWEEP 003"

bankCategory tokens: []
merchantHintTokens:  []
narration tokens:    ["pmt", "ref", "acc", "sweep"]  ← all < 4 chars or stopwords → []
                    (actually all get dropped — "pmt" 3 chars, "ref" 3 chars, "acc" 3 chars, "sweep" passes)
narration tokens after filter: ["sweep"]

Scoring:
  No category has "sweep" in its token set.
  All scores = 0 → tx added to unresolved[]
```

This transaction goes to Layer 3.

---

## Layer 3 — AI Classification (Selective Fallback)

### When it activates

Only for transactions where every previous layer returned score = 0. In practice a small subset — opaque reference codes, unknown merchant names, employer payroll codes not yet in the merchant table.

### gRPC call to ai_service

All unresolved transactions from the job are collected after token scoring finishes, then sent as **one batched call**:

```typescript
// finance_service → ai_service (one call per sync job)
const response = await this.aiClient.classifyTransactions({
  userId,
  transactions: unresolved.map((tx) => ({
    id:           tx.id,
    narration:    tx.narration,      // Transaction.narration — raw Mono text
    bankCategory: tx.bankCategory,  // Transaction.bankCategory — Mono enum hint
  })),
  categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
});

// response.classifications: Record<transactionId, categorySlug>
for (const [txId, slug] of Object.entries(response.classifications)) {
  const cat = categories.find((c) => c.slug === slug);
  applyCategory(txId, cat?.id ?? fallbackId);
}
```

The proto contract:

```protobuf
rpc ClassifyTransactions(ClassifyTransactionsReq) returns (ClassifyTransactionsRes) {}

message ClassifyTransactionsReq {
  string userId = 1;
  repeated TransactionInput transactions = 2;
  repeated CategoryInput categories = 3;
}
message TransactionInput {
  string id = 1;
  string narration = 2;
  string bankCategory = 3;
}
message ClassifyTransactionsRes {
  map<string, string> classifications = 1;  // transactionId → categorySlug
}
```

Inside `ai_service`, `ClassificationService` receives this, builds a prompt listing the user's actual categories, calls the LLM, and returns the map. The model picks only from slugs that exist in `categories` — no hardcoded slugs anywhere.

See [AI-SERVICE.md → Domain 1 — Transaction Classification](./AI-SERVICE.md) for the full `ClassificationService` implementation including the prompt template, structured output schema, and few-shot injection.

### Cost model

| Layer | Covers | Latency | Cost |
|-------|--------|---------|------|
| Category tags (Layer 0) | Built once, used per-tx | ~0 ms | Free |
| Merchant DB scan (Layer 1) | ~10–15% extra coverage | ~0 ms (in-memory) | Free |
| Token scoring (Layer 2) | ~80–90% of transactions | ~0 ms (CPU only) | Free |
| AI batch (Layer 3) | Remaining ~5–10% | ~500 ms–2 s (one call) | ~$0.001–0.005 per batch |
| Fallback to Miscellaneous | Last resort | ~0 ms | Free |

AI is the final safety net, not the primary path.

---

## Tokenize Function

All three scoring signals pass through `tokenize` before matching:

```typescript
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[_\-&/\\]/g, ' ')   // separators → spaces
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z]/g, ''))  // strip non-alpha
    .filter((t) => t.length >= 3)          // drop very short tokens
    .filter((t) => !STOPWORDS.has(t));
}

const STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'into', 'or', 'of',
  'to', 'a', 'an', 'in', 'on', 'at', 'by', 'cat', 'per',
  'ltd', 'plc', 'nig', 'nigeria',
]);
```

**Examples:**

```
"food_and_drinks"              → ["food", "drinks"]
"NIP/KUDA/SAMUEL OLAMIDE"      → ["nip", "kuda", "samuel", "olamide"]
"AIRTIME PURCHASE 08012345678" → ["airtime", "purchase"]
"Food & Groceries"             → ["food", "groceries"]
"Savings & Investments"        → ["savings", "investments"]
"unknown"                      → ["unknown"]  ← scores 0 against all categories; Mono signal absent
```

> `"unknown"` stays as a single token — it doesn't match any category tag set,
> so transactions with `bankCategory = "unknown"` effectively get no Mono boost.

---

## Feedback Loop — Learning from User Corrections

When a user corrects the AI-assigned category of a Mono transaction, the correction is not a dead end. It's stored as a pgvector embedding in `classification_corrections` and retrieved as few-shot examples for the **next** classification call for the same user.

This means the model learns the user's personal categorisation preferences over time without any fine-tuning — purely through prompt augmentation at inference time.

The full implementation lives in [AI-SERVICE.md → Feedback Loop — Learning from User Corrections](./AI-SERVICE.md):

- **Write path**: `finance_service` publishes a `CategoryCorrected` event → `ai_service` embeds the narration → stored in `classification_corrections`
- **Read path**: Before each `ClassifyTransactions` call, `ClassificationService.fetchFewShotExamples()` does a cosine search against the user's stored corrections → top-5 results injected as few-shot examples into the prompt

This covers merchant names not yet in the `NigerianMerchant` table and opaque narrations that recur for the same user — over time, those transactions resolve before reaching Layer 3.

---

## Prisma Schema Summary

```prisma
// On the existing Transaction model:
narration    String?   // raw Mono bank narration — immutable, source for AI and embeddings
bankCategory String?   // raw Mono category enum (e.g. "food_and_drinks") — persisted for AI hint

// On the existing Category model:
tags  String[]  @default([])   // hint tokens that extend the scoring token set

// Merchant lookup table:
model NigerianMerchant {
  id           String   @id @default(cuid())
  name         String   @unique
  aliases      String[]
  categoryHint String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([name])
}

// Feedback loop (AI-SERVICE.md for detail):
model ClassificationCorrection {
  id            String                      @id @default(cuid())
  narration     String
  correctedSlug String
  embedding     Unsupported("vector(1536)")?
  userId        String
  user          User                        @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime                    @default(now())
  @@index([userId])
  @@map("classification_corrections")
}
```

---

## Processor Execution Order (per sync job)

```typescript
async function handleSyncAccount(userId: string, accountId: string) {
  // 1. Load reference data (two parallel DB reads)
  const [categories, merchants] = await Promise.all([
    prisma.category.findMany({ where: { OR: [{ isSystem: true }, { userId }] } }),
    prisma.nigerianMerchant.findMany(),
  ]);

  // 2. Build in-memory structures (CPU only — no more DB reads until step 6)
  const catTokenSets = buildCategoryTokenSets(categories);  // name tokens ∪ tags
  const merchantMap  = buildMerchantMap(merchants);         // name+aliases → hint tokens

  // 3. Fetch fallback category
  const fallbackId = categories.find((c) => c.slug === 'cat-misc')!.id;

  // 4. Fetch all Mono transaction pages
  const monoTxs = await monoClient.fetchAllTransactions(accountId);

  // 5. Score every transaction (Layers 1–2)
  const resolved:   ResolvedTx[] = [];
  const unresolved: MonoTx[]     = [];

  for (const tx of monoTxs) {
    const merchantHints = lookupMerchantHints(tx.narration, merchantMap);
    const result        = scoreTransaction(tx, catTokenSets, merchantHints);
    result ? resolved.push(result) : unresolved.push(tx);
  }

  // 6. Layer 3 — AI batch for score=0 transactions
  if (unresolved.length > 0) {
    const aiResult = await aiClient.classifyTransactions({
      userId,
      transactions: unresolved.map((tx) => ({
        id: tx.id, narration: tx.narration, bankCategory: tx.bankCategory,
      })),
      categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
    });
    for (const [txId, slug] of Object.entries(aiResult.classifications)) {
      const cat = categories.find((c) => c.slug === slug);
      resolved.push({ id: txId, categoryId: cat?.id ?? fallbackId });
    }
  }

  // 7. Persist all transactions in one batch (skipDuplicates = idempotent)
  await transactionService.batchCreateMonoTransactions(userId, resolved);

  // 8. Update account metadata + notify user
  await accountService.updateMonoBankAccount(account, id);
  await fcmService.sendToUser(userId, { title: 'Sync complete', ... });
}
```
