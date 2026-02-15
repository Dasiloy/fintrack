# Case Study: Fintrack Engineering Blueprint (ELI5 Edition)

Fintrack is like a **Magic Notebook** that never lets you use an eraser. Once you write something down, it stays there forever. This makes sure no one can "cheat" the math when lots of people are using it at the same time.

---

## 💎 Why Fintrack Matters

Fintrack is built to be **Super Safe** and **Private**.

- **The Secret:** We use a "Double-Check" system so your money is always counted right.
- **The Privacy:** Your private info (like your name or address) stays on your phone. We wear a "mask" before we talk to the cloud.

---

## 🧠 How the Brain Works (Simple Scenarios)

### Scenario A: The "Big Dinner" (Sharing the Bill)

**The Problem**: 5 friends go out for pizza. Friend A pays $500. Everyone owes $100. It’s hard to track who paid who back.
**The Solution**: Fintrack uses a **Magic Debt-Eraser** (Min-Cash-Flow Algorithm).

> [!NOTE]
> **ELI5**: Instead of Friend B giving money to C, and C giving it to A, Fintrack just says: "Hey B, just give it straight to A." It cuts out the middle-man.

| Step            | Who Does It?   | What Happens?                                                |
| :-------------- | :------------- | :----------------------------------------------------------- |
| **1. The Map**  | Social Service | Draws a map of who owes who.                                 |
| **2. The Scan** | AI Service     | Reads the receipt to see if anyone didn't eat the pepperoni! |
| **3. The Log**  | Trans Service  | Writes down exactly who owes what in the magic notebook.     |

---

### Scenario B: The "Magic Notebook" (Never Lose Data)

**The Problem**: If you are writing down an expense and your phone dies halfway through, traditional apps might get "confused" and show the wrong balance.
**The Solution**: Use a **Double-Entry Rule** (The "Two-Sided" Notebook).

> [!TIP]
> **ELI5**: Every time you spend $10, we write it in two places: "Money Out" and "Food Spent." They must always match perfectly. If they don't, we throw the page away and start over so the math is never wrong.

```sql
-- THE LOW-LEVEL MATH --
-- We treat every transaction as a bridge between two accounts.
TABLE transactions (
  id UUID PRIMARY KEY,
  from_account UUID, -- Where the money left
  to_account UUID,   -- Where the money went
  amount DECIMAL(12,2)
);
```

**The "All-or-Nothing" Promise**:
We use a **Prisma Transaction**. It's like a Pinky Promise: "Either we finish the whole job, or we undo everything." We never leave things halfway done.

---

### Scenario C: The "Privacy Mask" (Hiding Secrets)

**The Problem**: You want to use a smart AI to help you save, but you don't want the AI to know your home address or full name.
**The Solution**: **On-Device Masking** (Edge-AI).

> [!IMPORTANT]
> **ELI5**: Before your data leaves your phone, we use a "Black Marker" (Transformers.js) to cross out your private info. By the time it reaches the "Cloud AI," it just sees "User bought groceries," not "User [Your Name] bought milk at [Your Address]."

```text
[ YOUR PHONE ]                [ THE INTERNET ]               [ THE CLOUD AI ]
      │                             │                               │
┌─────────────┐               ┌─────────────┐                 ┌─────────────┐
│ RAW DATA    │──▶ [MASK] ▶── │ HIDDEN DATA │──────▶ [SAFE] ──▶│ GET INSIGHT │
└─────────────┘               └─────────────┘                 └─────────────┘
```

---

## � How We Stay Fast (The "Fast Lane")

| Part           | How it works    | Why?                                                               |
| :------------- | :-------------- | :----------------------------------------------------------------- |
| **Talking**    | gRPC (Binary)   | It's like a secret language that's 10x faster than normal typing.  |
| **Scaling**    | Docker Clusters | If 10,000 people use the app, we just "clone" our servers to help. |
| **Guardrails** | Idempotency     | If you accidentally tap "Pay" twice, we only count it once.        |

---

## �️ The Rules (For Developers)

1. **Speak the Same Language**: Use the shared `@fintrack/types` so the Website and Mobile app never get confused.
2. **Double-Check Everything**: Every money change must pass the "Double-Entry" test.
3. **Privacy First**: If it can be done on the user's phone, do it there. Don't send it to the cloud unless you have to.
