# FinTrack - What This App Does

## The Simple Idea

**FinTrack helps you track where your money goes.**

Think of it like a digital piggy bank that:

- Remembers every time you spend or earn money
- Shows you where your money went
- Warns you when you're spending too much
- Helps you save for things you want

---

## Money Words Explained (Financial Terms)

| Word            | What It Means                                              |
| --------------- | ---------------------------------------------------------- |
| **Transaction** | Every time money comes in or goes out (like buying coffee) |
| **Expense**     | Money you spent (gave away)                                |
| **Income**      | Money you received (got paid)                              |
| **Balance**     | How much money you have right now                          |
| **Category**    | Groups of similar spending (like "Food" or "Shopping")     |
| **Budget**      | Plan for how much you can spend on something               |
| **Recurring**   | Money that comes or goes regularly (like rent every month) |
| **Analytics**   | Fancy charts that show your spending patterns              |
| **Split**       | Share the cost of something with friends                   |
| **Goal**        | Something you're saving money for                          |

---

## What Can You Do With FinTrack?

### 1. Track Your Money

- See how much money you have
- Add every time you spend or earn money
- Remember what you spent it on

### 2. Know Where Money Goes

- See all your spending in one place
- Group spending by type (food, transport, shopping)
- Search for old purchases

### 3. Set Spending Limits

- Decide "I'll only spend $200 on eating out this month"
- App shows if you're close to your limit
- Warns you if you go over

### 4. See Pretty Charts

- Visual graphs showing your spending
- Compare this month to last month
- See which category you spend most on

### 5. Remember Bills

- Never forget to pay rent or Netflix
- App reminds you when bills are due
- Auto-tracks monthly subscriptions

### 6. Split Bills With Friends

- Had dinner with 3 friends?
- App figures out who owes what
- Tracks who paid you back

### 7. Save For Goals

- Want to buy a laptop for $1,500?
- Set it as a goal
- App shows how close you are

### 8. Mobile App

- Quick add expenses on the go
- Take photo of receipts
- Check balance anytime

---

## Plans: Free vs Pro

All users start on the **Free plan** automatically — no plan selection during signup. Upgrade to **Pro ($5/month)** contextually inside the app.

| Feature                 | Free                    | Pro                     |
| ----------------------- | ----------------------- | ----------------------- |
| Transactions            | Unlimited, full history | Unlimited, full history |
| Custom categories       | 3                       | Unlimited               |
| Budgets                 | 5                       | Unlimited               |
| Bills & Recurring items | 5                       | Unlimited               |
| Goals                   | 3                       | Unlimited               |
| Active splits           | 3 (max 3 people/split)  | Unlimited               |
| Analytics history       | Last 6 months           | All-time                |
| AI Insights queries     | 20/month                | Unlimited               |
| AI Chat messages        | 10/month                | Unlimited               |
| Receipt uploads         | 10/month                | Unlimited               |
| PDF Reports             | No                      | Yes                     |
| CSV Export              | No                      | Yes                     |

**Upgrade is triggered contextually:**

- Hitting any structural limit → hard-stop overlay with upgrade CTA
- At 80% of a limit → amber warning banner
- Sidebar → persistent "Upgrade to Pro" badge (Free plan only)
- Locked features (PDF, CSV, full analytics) → blurred overlay + "Upgrade to unlock"

---

## Web App — All Pages

### Static / Public Pages (6 pages)

These pages are accessible without logging in:

1. **Home** (`/`) — Landing page: features overview, CTA to sign up
2. **Pricing** (`/pricing`) — Free vs Pro plan comparison + upgrade CTA
3. **About** (`/about`)
4. **Contact** (`/contact`)
5. **Privacy Policy** (`/privacy`)
6. **Terms of Service** (`/terms`)

### Authentication (6 screens)

7. **Login** — Sign in with email/password; links to sign up and forgot password
8. **Sign Up** — Create account (auto-enrolled in Free plan)
9. **Verify Email** — Verify email address after sign up
10. **Forgot Password** — Request password reset via OTP email
11. **Reset Password** — Set new password after OTP verified

### Dashboard (1 screen)

13. **Dashboard** — Total balance hero card, 4 quick stat cards (income / expenses / budget / savings), recent transactions (last 5), budget summary alerts, mini spending trend chart

### Finances

14. **Transactions List** — All spending/income with search, filters, sort; AI-suggested categories for uncategorized items
15. **Add Transaction** — Form to add new expense/income; AI auto-categorization from description/merchant
16. **Transaction Details** — View/edit single transaction; adjust or confirm AI category
17. **Bills & Recurring** — Upcoming bills, recurring income/expenses, subscriptions; pause/skip/edit patterns
18. **Budget Overview** — All category budgets with progress bars
19. **Edit Budget** — Set/change budget limits

### Analytics & AI

20. **Analytics** — Charts and trends (spending over time, category breakdown, income vs expenses)
21. **Insights** `[Pro]` — Spending insights, anomaly detection, recommendations (e.g. "You spent 20% more on dining")
22. **Chat** `[Pro]` — Ask questions about your finances in natural language; get recommendations and explanations

### Planning

23. **Goals List** — All savings goals with progress
24. **Create/Edit Goal** — Add or modify a savings goal
25. **Split Overview** — Active splits, who owes what
26. **Create Split** — Split a bill with friends

### Account

27. **Notification Center** — Budget alerts, bill reminders, activity feed
28. **Profile Settings** — Edit name, email, avatar
29. **Account Settings** — Manage accounts, categories, preferences
30. **Invite Friends** — Send invitations via email

**Premium UI:** Not a screen. Sidebar "Upgrade to Pro" badge + locked-feature overlays → `/pricing`

**Web total: 6 static + 24 app = 30 pages**

---

## Web App Navigation Structure

```
OVERVIEW
  Dashboard                     /dashboard

FINANCES
  Transactions                  /finances/transactions
  Bills & Recurring             /finances/bills
  Budgets                       /finances/budgets

ANALYTICS & AI
  Analytics                     /analytics
  Insights              [Pro]   /analytics/insights
  Chat                  [Pro]   /analytics/chat

PLANNING
  Goals                         /planning/goals
  Split Bills                   /planning/splits

ACCOUNT
  Notifications                 /notifications
  Settings (collapsible)
    Profile                     /settings/profile
    Account                     /settings/account
    Invite Friends              /settings/invite
```

Notes:

- Add Transaction and detail pages are accessed via FAB/row click — not sidebar items
- Insights and Chat show a `[Pro]` badge for Free users; clicking shows an upgrade overlay rather than blocking navigation

---

## Mobile App — All Screens

### Authentication (6 screens)

1. **Splash Screen** — App logo on launch
2. **Onboarding** — Welcome screens (swipe through)
3. **Login** — Email/password + biometric (fingerprint/face)
4. **Sign Up** — Create account
5. **Forgot Password** — Request OTP reset via email
6. **Biometric Setup** — Enable fingerprint/face unlock (optional, post-login)

### Main Screens — Tab content (5 screens)

7. **Home Dashboard** — Balance, quick stats, recent transactions, mini spending chart
8. **Transactions List** — All transactions with search
9. **Add Transaction** — Quick expense/income entry (camera for receipt)
10. **Budgets** — Category budgets with progress bars
11. **Profile** — User settings and preferences

### Secondary Screens (11 screens)

12. **Analytics** — Charts optimized for mobile
13. **Transaction Details** — View/edit single transaction
14. **Bills & Recurring** — Upcoming bills, recurring items, subscriptions
15. **Goals List** — All savings goals
16. **Create Goal** — Add new savings goal
17. **Split Bills** — Active splits overview
18. **Create Split** — Split a bill with friends
19. **Insights** — AI spending insights and anomaly detection
20. **Chat** — Conversational AI about finances
21. **Notifications** — Budget alerts, bill reminders
22. **Settings** — Account settings, preferences

**Mobile total: 22 screens**

---

## Mobile Navigation Structure

```
Tab 1: Dashboard    /home
Tab 2: Finances     /finances
         sub-nav: Transactions | Bills | Budgets | Goals | Splits
Tab 3: + (FAB)      → opens Add Transaction modal directly
Tab 4: Analytics    /analytics
         stack: Analytics → Insights → Chat
Tab 5: Account      /account
         stack: Notifications → Settings → Profile / Account / Invite
```

---

## Special Mobile Features

### Biometric Login (Mobile Only)

- Use fingerprint or face to unlock app
- Faster than typing password
- More secure

### Receipt Camera (Mobile Only)

- Take photo of receipt when adding expense
- App stores it with transaction
- Can review later

### Push Notifications

**Mobile:**

- "You're at 80% of your food budget!"
- "Rent due in 3 days"
- "John paid you back $25"

**Web:**

- Browser notifications (if enabled)
- Email notifications as fallback
- In-app notification center

---

## How Features Work

### Add an Expense

```
1. Click "+" button
2. Enter amount: $5.50
3. Select "Coffee" (or type it)
4. Pick category: Food & Dining
5. Tap photo to add receipt (optional)
6. Save
7. Balance updates automatically
```

### Set a Budget

```
1. Go to Budgets
2. Pick category: "Food & Dining"
3. Set limit: $600/month
4. App tracks spending
5. Shows progress: "$450 spent, $150 left"
6. Warns you at 80%: "You're close to limit!"
```

### Split a Bill

```
1. Create transaction: $120 dinner
2. Click "Split"
3. Add friends: John, Sarah, Mike
4. Choose: Equal split ($30 each)
5. Send notifications
6. Track who paid back
```

### Save for Goal

```
1. Create goal: "New Laptop - $1,500"
2. Set target date: 6 months
3. App calculates: "Save $250/month"
4. Shows progress: "$750 saved (50%)"
5. Visual milestone bar
```

---

## MVP Features (What We're Building)

**Phase 1 - Core:**

- Sign up, login, forgot password
- Dashboard with balance
- Add/view/edit transactions
- Categories
- Simple budgets

**Phase 2 - Enhanced:**

- Advanced analytics with charts
- Expense splitting with friends
- Bills & recurring transactions
- Savings goals
- Mobile app with biometric login

**Phase 3 - AI & Monetization:**

- AI auto-categorization
- AI Insights (spending analysis, anomaly detection)
- AI Chat (conversational finance assistant)
- Free/Pro plan system (Stripe)

---

## Who Is This For?

**Anyone who wants to:**

- Stop wondering "where did my money go?"
- Spend less eating out
- Save for something specific
- Split expenses fairly with roommates
- Never miss a bill payment
- Build better money habits

**Especially useful for:**

- Young professionals starting first jobs
- College students managing allowances
- Families tracking household expenses
- Roommates sharing costs

---

**Simple. Clean. Helps you manage money better.**
