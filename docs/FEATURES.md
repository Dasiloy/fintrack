# FinTrack - Features & DSA Mapping

## 📋 All Features

1. ✅ Authentication
2. ✅ Track Money (Transactions)
3. ✅ Know Where Money Goes (Search & Analytics)
4. ✅ Set Spending Limits (Budgets)
5. ✅ See Pretty Charts (Analytics)
6. ✅ Remember Bills (Recurring Transactions)
7. ✅ Split Bills With Friends
8. ✅ Save For Goals
9. ✅ PDF Reports (Monthly Spending & Budget)
10. ✅ Premium Subscription (Stripe)

---

## 1. Authentication 🔐

### **What It Does**

- Users sign up with email/password (web + mobile)
- Login to access their data (web + mobile)
- Reset forgotten passwords (web + mobile)
- Biometric login (mobile only - fingerprint/face)
- Biometric setup flow (mobile only)

### **How It Works**

```
1. User enters email/password
2. Backend hashes password
3. Creates JWT token
4. Stores token in secure storage
5. All future requests include token
```

### **DSA Used**

| Algorithm            | Where                | Why                        |
| -------------------- | -------------------- | -------------------------- |
| **Hash Maps**        | User lookup by email | O(1) fast user retrieval   |
| **Hashing (bcrypt)** | Password storage     | Secure password encryption |
| **JWT encoding**     | Token generation     | Stateless authentication   |

**Why These DSA:**

- Hash Maps: Instant user lookup among millions of users
- Cryptographic Hashing: Can't reverse to get password
- JWT: No database lookups on every request

### **External Services**

- ✅ **MailTrap/Resend** - Password reset emails
- ✅ **NextAuth.js** - Auth framework
- ✅ **Local Auth** (Expo) - Biometric on mobile

### **In Build Journey?**

✅ **Week 1, Days 1-7** - Fully covered

---

## 2. Track Money (Transactions) 💸

### **What It Does**

- Add income/expenses
- View all transactions
- Edit/delete transactions
- Attach receipts
- Categorize automatically

### **How It Works**

```
1. User clicks "Add Transaction"
2. Enters: $25, "Lunch", Food category
3. Optionally uploads receipt photo
4. Backend saves to database
5. Balance updates instantly
6. Shows in transaction list
```

### **DSA Used**

| Algorithm               | Where                    | Why                            |
| ----------------------- | ------------------------ | ------------------------------ |
| **Hash Maps**           | Transaction lookup by ID | O(1) retrieval                 |
| **Sorting (MergeSort)** | Transaction list by date | O(n log n) efficient sorting   |
| **Binary Search**       | Find transaction by date | O(log n) search in sorted list |
| **Trie**                | Merchant autocomplete    | Fast prefix matching           |
| **String Matching**     | Receipt OCR parsing      | Extract merchant names         |

**Why These DSA:**

- Hash Maps: Instant access to any transaction
- Sorting: Show recent first, or oldest first
- Binary Search: "Show me transactions from March 5"
- Trie: Type "Star..." suggests "Starbucks"
- String Matching: Read receipt, auto-fill details

### **External Services**

- ✅ **Cloudinary/S3** - Store receipt images
- ❌ **OCR API** (optional) - Read receipt text

### **In Build Journey?**

✅ **Week 3, Days 15-21** - Fully covered

---

## 3. Know Where Money Goes (Search & Filter) 🔍

### **What It Does**

- Search transactions by merchant
- Filter by category
- Filter by date range
- Filter by amount range
- Sort by various criteria

### **How It Works**

```
1. User types "Coffee" in search
2. System searches all transaction descriptions
3. Shows: Starbucks, Coffee Bean, Cafe Latte
4. User adds filter: Category = Food
5. Shows only coffee purchases in Food category
```

### **DSA Used**

| Algorithm             | Where                    | Why                     |
| --------------------- | ------------------------ | ----------------------- |
| **Inverted Index**    | Full-text search         | Fast keyword search     |
| **Hash Maps**         | Category filter          | Instant category lookup |
| **Binary Search**     | Amount range filter      | Search sorted amounts   |
| **Multi-key Sorting** | Sort by multiple columns | Complex sorting         |
| **Debouncing**        | Search input             | Reduce API calls        |

**Why These DSA:**

- Inverted Index: Search "coffee" finds all coffee purchases instantly
- Hash Maps: Filter by category without scanning all records
- Binary Search: "Show transactions between $10-$50"
- Multi-key Sort: Sort by date, then amount

### **External Services**

- ❌ None - All local/backend

### **In Build Journey?**

✅ **Week 4, Days 22-28** - Fully covered

---

## 4. Set Spending Limits (Budgets) 🎯

### **What It Does**

- Set monthly budget per category
- Track spending vs. budget
- Show progress bars
- Warn when approaching limit
- Alert when overspending

### **How It Works**

```
1. User sets: "Food budget = $600/month"
2. Throughout month, app tracks Food expenses
3. Spent $450, shows: "75% used, $150 left"
4. At 80% ($480), warn: "Close to limit!"
5. Over $600, alert: "Over budget by $50!"
```

### **DSA Used**

| Algorithm                  | Where                        | Why                         |
| -------------------------- | ---------------------------- | --------------------------- |
| **Hash Maps**              | Category total lookup        | O(1) get total per category |
| **Aggregation**            | Sum transactions by category | Calculate totals            |
| **Sorting**                | Rank categories by % used    | Show worst offenders first  |
| **Percentage Calculation** | Progress bars                | Visual progress             |

**Why These DSA:**

- Hash Maps: Instantly know "How much spent on Food?"
- Aggregation: Sum all Food transactions this month
- Sorting: Show categories most over budget first

### **External Services**

- ❌ None - All backend calculations

### **In Build Journey?**

✅ **Week 5, Days 29-35** - Fully covered

---

## 5. See Pretty Charts (Analytics) 📊

### **What It Does**

- Line chart: Spending over time
- Bar chart: Category comparison
- Pie chart: Expense distribution
- Key metrics: Average daily spend, largest expense
- Custom date ranges

### **How It Works**

```
1. User opens Analytics
2. Backend aggregates last 6 months data
3. Groups by month: Jan $2500, Feb $2800, etc.
4. Sends to frontend
5. Recharts/fl_chart renders visual charts
```

### **DSA Used**

| Algorithm       | Where                        | Why                    |
| --------------- | ---------------------------- | ---------------------- |
| **Hash Maps**   | Group by month/category      | O(1) bucket assignment |
| **Sorting**     | Order months chronologically | Display in order       |
| **Aggregation** | Sum/average calculations     | Statistical metrics    |
| **Percentages** | Pie chart slices             | Show distribution      |
| **Time-series** | Line chart data points       | Trend analysis         |

**Why These DSA:**

- Hash Maps: Group all January transactions together
- Sorting: Show Jan, Feb, Mar in order
- Aggregation: Calculate average daily spending
- Percentages: "Food is 35% of total spending"

### **External Services**

- ❌ None - All backend + client-side charting

### **In Build Journey?**

✅ **Week 6, Days 36-42** - Fully covered

---

## 6. Remember Bills (Recurring Transactions) 🔄

### **What It Does**

- Mark transactions as recurring (monthly, weekly)
- Auto-create future transactions
- Remind before bill due
- Track subscriptions
- Show upcoming bills

### **How It Works**

```
1. User adds: "Netflix $15, monthly, every 5th"
2. System creates template
3. On March 5th, auto-creates transaction
4. On March 2nd (3 days before), sends reminder
5. Repeats every month
```

### **DSA Used**

| Algorithm                     | Where                     | Why                           |
| ----------------------------- | ------------------------- | ----------------------------- |
| **Priority Queue (Min Heap)** | Upcoming bills            | Get next due bill in O(log n) |
| **Date Algorithms**           | Calculate next occurrence | Add 1 month to date           |
| **Cron Jobs**                 | Scheduled task execution  | Auto-run daily                |
| **Hash Maps**                 | Subscription lookup       | Fast retrieval                |

**Why These DSA:**

- Priority Queue: Always know "What's my next bill?"
- Date Algorithms: "Next month same day" calculation
- Cron Jobs: Run at midnight, create today's recurring transactions
- Hash Maps: "Show me all my subscriptions"

### **External Services**

- ✅ **Cron service** (Vercel Cron or self-hosted) - Auto-create transactions
- ✅ **Push notifications** (Firebase) - Bill reminders (mobile)
- ✅ **Email notifications** - Fallback for web users

### **In Build Journey?**

✅ **Week 7, Days 43-49** - Fully covered

---

## 7. Split Bills With Friends 🤝

### **What It Does**

- Split expense among friends
- Track who owes what
- Simplify debt (minimize transactions)
- Mark as paid
- Send payment reminders

### **How It Works**

```
1. Dinner bill: $120
2. Split 4 ways: You, Alice, Bob, Carol
3. You paid $120
4. Each owes you $30
5. MinCashFlow: If Alice owes Bob $10 too, simplify
6. Track settlements
```

### **DSA Used**

| Algorithm                  | Where               | Why                    |
| -------------------------- | ------------------- | ---------------------- |
| **Graph (Adjacency List)** | Debt network        | Model who-owes-whom    |
| **MinCashFlow (Greedy)**   | Debt simplification | Minimize transactions  |
| **DFS/BFS**                | Debt traversal      | Find debt chains       |
| **Hash Maps**              | User balance lookup | O(1) balance retrieval |
| **Topological Sort**       | Settlement order    | Pay in optimal order   |

**Why These DSA (MOST IMPORTANT!):**

- **Graph**: Represent complex debt relationships
- **MinCashFlow**: Instead of 10 payments, make 3 optimized ones
- **DFS/BFS**: Find all people involved in debt chain
- **Hash Maps**: Instantly know "How much does Alice owe?"

**Example MinCashFlow:**

```
Before:
- Alice owes Bob $20
- Alice owes Carol $30
- Bob owes Carol $10

After MinCashFlow:
- Alice pays Carol $40 (simplified!)
```

### **External Services**

- ❌ None - All backend graph algorithms

### **In Build Journey?**

✅ **Week 8, Days 50-56** - Fully covered
⚠️ **Day 53 is KEY** - MinCashFlow algorithm implementation

---

## 8. Save For Goals 💰

### **What It Does**

- Create savings goals (e.g., "Laptop $1,500")
- Set target date
- Track progress
- Add contributions
- Show if on track or behind

### **How It Works**

```
1. Create goal: "Laptop, $1,500, 6 months"
2. App calculates: Need $250/month
3. User adds $300 in Month 1
4. Progress: 20% complete, ahead of schedule
5. Visual milestone celebrations
```

### **DSA Used**

| Algorithm             | Where                    | Why                        |
| --------------------- | ------------------------ | -------------------------- |
| **Linear Regression** | Predict completion date  | Based on contribution rate |
| **Date Math**         | Calculate target date    | Months until goal          |
| **Percentage**        | Progress calculation     | Visual progress bar        |
| **Array/List**        | Contribution history     | Track all contributions    |
| **Sorting**           | Show goals by % complete | Prioritize display         |

**Why These DSA:**

- Linear Regression: "At current rate, you'll finish in 5 months"
- Date Math: "You have 143 days left"
- Percentage: "You're 65% there!"
- Sorting: Show closest goals first

### **External Services**

- ❌ None - All backend calculations

### **In Build Journey?**

✅ **Week 9, Days 57-63** - Fully covered

---

## 9. PDF Reports �

### **What It Does**

- Generate monthly spending report (PDF)
- Generate budget vs actual report (PDF)
- Download/email reports
- Professional formatting with charts

### **How It Works**

```
1. User clicks "Export" → "Monthly Report"
2. Backend aggregates month's data
3. Frontend generates PDF with:
   - Total income/expenses
   - Category breakdown (chart)
   - Top transactions
   - Spending trends
4. User downloads or emails PDF
```

### **DSA Used**

| Algorithm       | Where             | Why                   |
| --------------- | ----------------- | --------------------- |
| **Hash Maps**   | Group by category | O(1) category totals  |
| **Sorting**     | Rank top expenses | Show highest first    |
| **Aggregation** | Calculate totals  | Sum income/expenses   |
| **Percentages** | Chart generation  | Category distribution |

**Why These DSA:**

- Hash Maps: Group transactions by category instantly
- Sorting: "Top 10 expenses" ranking
- Aggregation: Monthly totals calculation
- Percentages: Visual pie charts

### **External Services**

- ❌ **jsPDF** - Client-side library (no external service)
- ❌ **html2canvas** - Convert charts to images

### **In Build Journey?**

✅ **Week 11, Day 72** - Added for MVP

---

## 10. Premium Subscription (Stripe) 💳

### **What It Does**

- Free tier: Basic features
- Premium tier ($5/month): Advanced features
- Stripe payment processing
- Subscription management

**Premium Features:**

- Unlimited goals (vs 3 in free)
- PDF reports
- Priority support
- Export unlimited history

### **How It Works**

```
1. User clicks "Upgrade to Premium"
2. Redirects to Stripe Checkout
3. User enters payment details
4. Stripe processes payment
5. Webhook confirms payment success
6. Backend updates user to Premium
7. Premium features unlocked
```

### **DSA Used**

| Algorithm         | Where                    | Why                        |
| ----------------- | ------------------------ | -------------------------- |
| **Hash Maps**     | User subscription lookup | O(1) check if premium      |
| **Boolean Flags** | Feature gating           | Simple premium check       |
| **Webhooks**      | Payment status tracking  | Async payment confirmation |

**Why These DSA:**

- Hash Maps: Instant "Is this user premium?" check
- Boolean Flags: `user.isPremium` for feature access
- Not heavy DSA - more about integration learning!

### **External Services**

- ✅ **Stripe** - Payment processing
- Stripe Checkout
- Stripe Webhooks
- Stripe Customer Portal

### **In Build Journey?**

✅ **Week 11, Days 75-76** - Added for MVP

---

## �📊 Summary Table

| Feature        | Week | DSA Highlight                 | External Service   |
| -------------- | ---- | ----------------------------- | ------------------ |
| Authentication | 1    | Hash Maps, Hashing            | SendGrid, NextAuth |
| Transactions   | 3    | Hash Maps, Sorting, Trie      | Cloudinary         |
| Search/Filter  | 4    | Inverted Index, Binary Search | None               |
| Budgets        | 5    | Hash Maps, Aggregation        | None               |
| Analytics      | 6    | Time-series, Sorting          | None               |
| Recurring      | 7    | Priority Queue, Cron          | Cron service, FCM  |
| Split Bills    | 8    | **Graph, MinCashFlow**        | None               |
| Goals          | 9    | Linear Regression             | None               |
| PDF Reports    | 11   | Hash Maps, Sorting            | jsPDF (library)    |
| Stripe Premium | 11   | Hash Maps, Webhooks           | Stripe             |

---

## 🔧 External Services Needed

### **Required:**

1. ✅ **PostgreSQL** - Database (Supabase free tier)
2. ✅ **MailTrap/Resend** - Email (free tier: 100 emails/day)
3. ✅ **Cloudinary** - Image storage (free tier: 25GB)
4. ✅ **Vercel** - Web hosting (free for hobby)
5. ✅ **Render** - API hosting (free tier)

### **Optional:**

6. ❌ **OCR API** (Tesseract.js) - Receipt scanning (can skip)
7. ✅ **Firebase** - Push notifications (free tier)

---

## ✅ Build Journey Coverage

- Week 1: Auth
- Week 3: Transactions
- Week 4: Search
- Week 5: Budgets
- Week 6: Analytics
- Week 7: Recurring
- Week 8: Split Bills
- Week 9: Goals
- Week 10: Settings
- Week 11: Advanced features
- Week 12: Testing & Launch

**All features accounted for!** ✅

---

## ❓ Common Questions (FAQ)

### **Q: How do users record INCOME?**

**A:** Same as expenses! Transactions have a `type` field:

```typescript
// Income transaction
{
  amount: 5200,
  type: "INCOME",
  category: "Salary",
  description: "Monthly paycheck"
}

// Expense transaction
{
  amount: 45,
  type: "EXPENSE",
  category: "Food",
  description: "Lunch"
}
```

**User flow:**

1. Click "Add Transaction"
2. Toggle to **"Income"** (instead of Expense)
3. Enter amount, category, description
4. Save → Balance increases!

---

### **Q: Do income transactions need receipts?**

**A:** No! Receipts are **optional for all transactions** (income or expense).

**When receipts are useful:**

- **Expenses:** Warranties, returns, tax deductions
- **Income:** Rarely needed (pay stubs kept separately)

---

### **Q: Why take photos of receipts?**

**A:** It's **optional**, but helpful for:

1. **Proof of purchase** - Return/exchange items
2. **Warranty claims** - Need receipt for warranty
3. **Tax deductions** - Business/medical expenses
4. **Memory aid** - "What did I buy?"
5. **Dispute charges** - Challenge incorrect bills

**Better way:** OCR (future enhancement)

- Take photo → App auto-reads and fills transaction
- For MVP, just store photo

---

### **Q: Where are "Reminders" mentioned?**

**A:** In **Feature 6: Recurring Transactions** (lines 250-294)

When you mark a bill as recurring:

```
1. Add: "Rent, $1,200, monthly, 1st"
2. Mark as recurring
3. On 28th: Push notification "Rent due in 3 days"
4. On 1st: Auto-creates transaction
```

Reminders = Part of recurring feature!

---

### **Q: Will we integrate with banks (auto-import transactions)?**

**A:** **NO - Out of scope for MVP**

**Why not:**

- Requires Plaid API (expensive, complex)
- Security/compliance overhead (PCI-DSS)
- MVP focuses on learning DSA, not third-party integration

**MVP approach:** Manual entry (proven successful - YNAB started this way)

**Future (V2):** Consider Plaid for auto-import

---

### **Q: Will users make payments in-app?**

**A:** **NO - Out of scope**

**Why not:**

- Requires payment processor (Stripe/PayPal)
- Bank account verification
- Payment routing, disputes
- Not focused on DSA learning

**MVP:** Track payments only (record after you paid elsewhere)

---

### **Q: Can we generate financial reports/documents?**

**A:** **YES - Now in MVP!** ✅

**What's included:**

- Monthly spending summary (PDF)
- Budget vs. actual report (PDF)
- CSV export

**Implementation:** Week 11, Day 72

- jsPDF library
- html2canvas for charts
- Data already aggregated!

**See:** Feature 9 in this document

---

### **Q: What about OCR for receipts?**

**A:** **Optional - Phase 2 enhancement**

**Option 1 (MVP):** Just store photo

```
User → Takes photo → Attaches to transaction → Done
```

**Option 2 (Future):** Auto-fill via OCR

```
User → Takes photo → OCR reads text → Auto-fills form → User confirms
```

**Implementation:** Tesseract.js (free, client-side) or Google Vision API

---

### **Q: What's IN scope vs OUT of scope?**

**✅ IN SCOPE (MVP):**

- Manual transaction entry
- Budgets & analytics
- Recurring transactions with reminders
- Bill splitting & MinCashFlow
- Savings goals tracking
- Receipt photo storage
- **PDF reports** (monthly spending + budget)
- **Stripe premium subscription**
- CSV export

**❌ OUT OF SCOPE (Future versions):**

- Bank integration (auto-import)
- Payment processing (pay bills in app)
- Receipt OCR (auto-read)
- AI categorization
- Multi-currency
- Investment tracking
- Credit score monitoring

**Focus:** Learn DSA deeply + Stripe integration

---

## 🎯 Scope Summary

**MVP (12 weeks):**

- Core money tracking
- Budget management
- Analytics & insights
- Bill reminders
- Expense splitting (with graph algorithms!)
- Savings goals

**Version 2 (Future):**

- Bank integration (Plaid)
- Receipt OCR
- AI categorization
- Financial reports
- Multi-currency

**Version 3 (Advanced):**

- Payment processing
- Investment tracking
- Tax optimization
- Credit monitoring

---

**Focus on fundamentals. Master DSA. Build solid MVP.** ✅
