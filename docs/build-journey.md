# FinTrack - Build Journey (Web + Mobile + AI)

## 🎯 Parallel Development Plan

**Goal:** Build web (Next.js), mobile (Flutter), and AI features simultaneously  
**Timeline:** 14 weeks (3.5 months)  
**Daily Effort:** 2-3 hours/day  
**Approach:** For each feature, build BOTH web and mobile versions

---

## 📅 Week-by-Week Breakdown

### **Week 1: Setup & Authentication**

#### Day 1: Project Setup (Both Platforms)

- **Learn:** Turborepo monorepo, Flutter project structure
- **Web:** Initialize Next.js app
- **Mobile:** Initialize Flutter app
- **Output:** Both projects ready

#### Day 2: Design System (Both)

- **Learn:** Tailwind (web), Flutter themes (mobile)
- **Web:** Set up shadcn/ui, colors, typography
- **Mobile:** Set up Flutter theme, colors, typography
- **Output:** Design tokens for both

#### Day 3: Sign Up UI (Web)

- **Learn:** Next.js forms, React Hook Form
- **Generate Mockup:** Sign up page (web)
- **Do:** Build web sign up form
- **Output:** Web sign up UI

#### Day 4: Sign Up UI (Mobile)

- **Learn:** Flutter forms, validation
- **Generate Mockup:** Sign up screen (mobile)
- **Do:** Build Flutter sign up screen
- **Output:** Mobile sign up UI

#### Day 5: Login UI (Both)

- **Learn:** Auth flow comparison (web vs mobile)
- **Generate Mockup:** Login (web + mobile)
- **Web:** Build login form
- **Mobile:** Build login screen
- **Output:** Login UI on both

#### Day 6: Auth Backend

- **Learn:** NextAuth.js, JWT tokens
- **Do:** Set up authentication API
- **Web:** Connect Next.js forms
- **Mobile:** Connect Flutter to API
- **Output:** Working auth on both

#### Day 7: Biometric + Password Reset

- **Learn:** Biometric auth (mobile), email sending (web)
- **Web:** Forgot password flow
- **Mobile:** Fingerprint/Face ID login
- **Output:** Complete authentication

---

### **Week 2: Dashboard & Layout**

#### Day 8: Navigation (Both)

- **Learn:** Layouts (Next.js) vs Navigation (Flutter)
- **Generate Mockup:** Sidebar (web), Bottom nav (mobile)
- **Web:** Build sidebar navigation
- **Mobile:** Build bottom navigation
- **Output:** Navigation on both

#### Day 9: Dashboard Structure (Web)

- **Learn:** Server Components, data fetching
- **Do:** Build web dashboard layout
- **Output:** Web dashboard shell

#### Day 10: Dashboard Structure (Mobile)

- **Learn:** Flutter widgets, Riverpod state
- **Generate Mockup:** Mobile dashboard (use existing)
- **Do:** Build mobile dashboard layout
- **Output:** Mobile dashboard shell

#### Day 11: Balance Display (Both)

- **Learn:** Currency formatting (web vs mobile)
- **Web:** Build balance card component
- **Mobile:** Build balance widget
- **Output:** Balance on both

#### Day 12: Quick Stats (Both)

- **Learn:** Grid layouts
- **Web:** Income/expense cards
- **Mobile:** Income/expense widgets
- **Output:** Stats on both

#### Day 13: Recent Transactions (Both)

- **Learn:** Lists (React vs Flutter)
- **Web:** Transaction list component
- **Mobile:** ListView widget
- **Output:** Recent activity on both

#### Day 14: Dashboard Charts (Both)

- **Learn:** Recharts (web), fl_chart (mobile)
- **Web:** Mini trend chart
- **Mobile:** Spending chart widget
- **Output:** Visual dashboards

---

### **Week 3: Transactions Feature**

#### Day 15: Transaction API

- **Learn:** tRPC, Prisma models
- **Do:** Transaction model, tRPC endpoints
- **Output:** Backend ready

#### Day 16: Transactions List (Web)

- **Learn:** Server Components, tRPC queries
- **Generate Mockup:** Transactions page (web)
- **Do:** Build web transactions page
- **Output:** Web transactions list

#### Day 17: Transactions List (Mobile)

- **Learn:** Flutter ListView, GraphQL queries
- **Generate Mockup:** Transactions screen (mobile)
- **Do:** Build mobile transactions screen
- **Output:** Mobile transactions list

#### Day 18: Transaction Item (Both)

- **Learn:** Component composition
- **Web:** Transaction item component
- **Mobile:** Transaction tile widget
- **Output:** Transaction display on both

#### Day 19: Add Transaction Modal (Web)

- **Learn:** Modals, form state
- **Generate Mockup:** Add transaction modal (web)
- **Do:** Build web add form
- **Output:** Web add transaction

#### Day 20: Add Transaction Screen (Mobile)

- **Learn:** Flutter forms, camera
- **Generate Mockup:** Add transaction screen (mobile)
- **Do:** Build mobile add screen with camera
- **Output:** Mobile add transaction

#### Day 21: Edit/Delete (Both)

- **Learn:** CRUD operations
- **Web:** Edit/delete functionality
- **Mobile:** Swipe actions, dialogs
- **Output:** Full transaction management

---

### **Week 4: Search, Filters & Categories**

#### Day 22: Category System

- **Learn:** Database relationships
- **Do:** Category model, API
- **Output:** Categories backend

#### Day 23: Category Selector (Both)

- **Learn:** Dropdowns (web vs mobile)
- **Generate Mockup:** Category picker
- **Web:** Dropdown component
- **Mobile:** Bottom sheet picker
- **Output:** Category selection

#### Day 24: Search (Both)

- **Learn:** Full-text search, debouncing
- **Web:** Search bar with debounce
- **Mobile:** Search field with real-time results
- **Output:** Search on both

#### Day 25: Filters (Web)

- **Learn:** Query params, filter UI
- **Do:** Date, amount, category filters
- **Output:** Web filtering

#### Day 26: Filters (Mobile)

- **Learn:** Filter bottom sheets
- **Do:** Mobile filter interface
- **Output:** Mobile filtering

#### Day 27: Sort & Pagination (Both)

- **Learn:** Infinite scroll
- **Web:** Infinite scroll
- **Mobile:** ListView pagination
- **Output:** Performant lists

#### Day 28: Receipt Upload (Both)

- **Learn:** File uploads (web), camera (mobile)
- **Web:** Cloudinary upload
- **Mobile:** Image picker + camera
- **Output:** Receipt attachment

---

### **Week 5: Budgets**

#### Day 29: Budget Backend

- **Learn:** Monthly aggregations
- **Do:** Budget model, calculations API
- **Output:** Budget backend

#### Day 30: Budget Page (Web)

- **Learn:** Progress indicators
- **Generate Mockup:** Budget page (web)
- **Do:** Build web budget page
- **Output:** Web budgets

#### Day 31: Budget Screen (Mobile)

- **Learn:** Flutter progress bars
- **Generate Mockup:** Budget screen (mobile)
- **Do:** Build mobile budget screen
- **Output:** Mobile budgets

#### Day 32: Budget Cards (Both)

- **Learn:** Progress visualization
- **Web:** Budget card with progress bar
- **Mobile:** Budget tile with indicator
- **Output:** Visual budgets

#### Day 33: Edit Budgets (Web)

- **Learn:** Inline editing
- **Generate Mockup:** Edit budget modal
- **Do:** Web budget editor
- **Output:** Web budget editing

#### Day 34: Edit Budgets (Mobile)

- **Learn:** Mobile forms, sliders
- **Do:** Mobile budget editor
- **Output:** Mobile budget editing

#### Day 35: Budget Alerts (Both)

- **Learn:** Notifications (web vs mobile)
- **Web:** Toast notifications
- **Mobile:** Push notifications
- **Output:** Overspending alerts

---

### **Week 6: Analytics**

#### Day 36: Analytics Backend

- **Learn:** Data aggregation, statistics
- **Do:** Analytics API endpoints
- **Output:** Analytics backend

#### Day 37: Analytics Page (Web)

- **Learn:** Recharts library
- **Generate Mockup:** Analytics page (web)
- **Do:** Build web analytics page
- **Output:** Web analytics

#### Day 38: Analytics Screen (Mobile)

- **Learn:** fl_chart library
- **Generate Mockup:** Analytics screen (mobile)
- **Do:** Build mobile analytics screen
- **Output:** Mobile analytics

#### Day 39: Line Charts (Both)

- **Learn:** Time-series visualization
- **Web:** Spending trend line chart
- **Mobile:** Spending trend chart widget
- **Output:** Trend charts

#### Day 40: Bar/Pie Charts (Both)

- **Learn:** Category visualization
- **Web:** Category bar + pie charts
- **Mobile:** Category charts
- **Output:** Category breakdown

#### Day 41: Key Metrics (Both)

- **Learn:** Statistical cards
- **Web:** Metrics cards
- **Mobile:** Metrics widgets
- **Output:** Summary statistics

#### Day 42: Date Range Selector (Both)

- **Learn:** Date pickers
- **Web:** Date range picker
- **Mobile:** Calendar bottom sheet
- **Output:** Custom date ranges

---

### **Week 7: Recurring Transactions**

#### Day 43: Recurring Backend

- **Learn:** Schedule patterns, cron jobs
- **Do:** Recurring model, auto-generation logic
- **Output:** Recurring backend

#### Day 44: Mark as Recurring (Web)

- **Learn:** Toggle UI
- **Generate Mockup:** Recurring UI (web)
- **Do:** Web recurring checkbox
- **Output:** Web recurring marking

#### Day 45: Mark as Recurring (Mobile)

- **Learn:** Switch widgets
- **Do:** Mobile recurring toggle
- **Output:** Mobile recurring marking

#### Day 46: Bill Reminders (Both)

- **Learn:** Priority queues, notifications
- **Web:** Upcoming bills list
- **Mobile:** Bill reminder notifications
- **Output:** Bill tracking

#### Day 47: Edit Recurring (Both)

- **Learn:** Future transaction handling
- **Web:** Edit recurring patterns
- **Mobile:** Modify recurring
- **Output:** Recurring control

#### Day 48: Subscription Tracking (Both)

- **Learn:** Category filtering
- **Web:** Subscriptions view
- **Mobile:** Subscriptions screen
- **Output:** Subscription manager

#### Day 49: Review Week 7

- **Do:** Test recurring across platforms
- **Output:** Reliable recurring system

---

### **Week 8: Expense Splitting**

#### Day 50: Split Backend

- **Learn:** Graph data structures
- **Do:** Split model, participants API
- **Output:** Split backend

#### Day 51: Create Split (Web)

- **Learn:** Multi-user forms
- **Generate Mockup:** Split interface (web)
- **Do:** Web split creation
- **Output:** Web split feature

#### Day 52: Create Split (Mobile)

- **Learn:** Multi-step forms
- **Generate Mockup:** Split screen (mobile)
- **Do:** Mobile split creation
- **Output:** Mobile split feature

#### Day 53: MinCashFlow Algorithm

- **Learn:** Graph algorithms (KEY DSA!)
- **Do:** Implement debt simplification
- **Output:** Optimal settlements

#### Day 54: Split Calculation (Both)

- **Learn:** Even vs custom splits
- **Web:** Split calculator UI
- **Mobile:** Split calculator screen
- **Output:** Accurate splitting

#### Day 55: Settlement Tracking (Both)

- **Learn:** State management
- **Web:** Mark as paid, settlement list
- **Mobile:** Settlement tracking
- **Output:** Settlement system

#### Day 56: Split Dashboard (Both)

- **Learn:** Dashboard widgets
- **Generate Mockup:** Split overview
- **Web:** Active splits view
- **Mobile:** Active splits screen
- **Output:** Split management

---

### **Week 9: Savings Goals**

#### Day 57: Goals Backend

- **Learn:** Progress tracking, predictions
- **Do:** Goals model, progress API
- **Output:** Goals backend

#### Day 58: Goals List (Web)

- **Learn:** Progress indicators
- **Generate Mockup:** Goals page (web)
- **Do:** Web goals page
- **Output:** Web goals list

#### Day 59: Goals List (Mobile)

- **Learn:** Card widgets
- **Generate Mockup:** Goals screen (mobile)
- **Do:** Mobile goals screen
- **Output:** Mobile goals list

#### Day 60: Create Goal (Both)

- **Learn:** Target calculations
- **Web:** Goal creation form
- **Mobile:** Goal creation screen
- **Output:** Create goals

#### Day 61: Progress Tracking (Both)

- **Learn:** Linear regression, ETA
- **Web:** Progress visualization
- **Mobile:** Progress widget
- **Output:** Goal progress

#### Day 62: Goal Contributions (Both)

- **Learn:** Manual allocations
- **Web:** Add to goal UI
- **Mobile:** Contribution screen
- **Output:** Fund goals

#### Day 63: Goal Insights (Both)

- **Learn:** Date math, on-track logic
- **Web:** Goal guidance cards
- **Mobile:** Goal insights widget
- **Output:** Goal motivation

---

### **Week 10: Settings & Profile**

#### Day 64: Profile (Both)

- **Learn:** User management
- **Generate Mockup:** Profile settings
- **Web:** Profile editor page
- **Mobile:** Profile screen
- **Output:** Update profile

#### Day 65: Account Management (Both)

- **Learn:** Multi-account systems
- **Generate Mockup:** Account settings
- **Web:** Account manager
- **Mobile:** Account screen
- **Output:** Multiple accounts

#### Day 66: Custom Categories (Both)

- **Learn:** User-defined data
- **Web:** Category management
- **Mobile:** Category settings
- **Output:** Custom categories

#### Day 67: Preferences (Both)

- **Learn:** Settings storage
- **Web:** Preferences page
- **Mobile:** Settings screen
- **Output:** Personalization

#### Day 68: Export Data (Both)

- **Learn:** CSV generation, share
- **Web:** Download CSV
- **Mobile:** Share CSV file
- **Output:** Data export

#### Day 69: Invite Friends (Both)

- **Learn:** Email invitations, share
- **Generate Mockup:** Invite screen
- **Web:** Invite page
- **Mobile:** Share invitation
- **Output:** Referral system

#### Day 70: Theme Toggle (Both)

- **Learn:** Dark/light mode
- **Web:** Theme switcher
- **Mobile:** Theme settings
- **Output:** Theme support

---

### **Week 11: Advanced Features & Monetization**

#### Day 71: Pull-to-Refresh (Mobile)

- **Learn:** Refresh patterns
- **Do:** Add pull-to-refresh to lists
- **Output:** Better mobile UX

#### Day 72: PDF Reports (Both)

- **Learn:** jsPDF library, PDF generation
- **Do:** Monthly spending report + Budget vs Actual
- **Web:** Export button, generate PDF
- **Mobile:** Share PDF file
- **Output:** Professional PDF reports

#### Day 73: Optimistic Updates (Both)

- **Learn:** Optimistic UI
- **Web:** tRPC optimistic updates
- **Mobile:** Local-first updates
- **Output:** Instant feedback

#### Day 74: Error Handling (Both)

- **Learn:** Error boundaries, retry
- **Web:** Error boundaries, toasts
- **Mobile:** Error dialogs, snackbars
- **Output:** User-friendly errors

#### Day 75: Stripe Setup & Free/Premium Tiers

- **Learn:** Stripe basics, subscription model
- **Do:** Stripe account, API keys
- **Backend:** Add subscription field to User model
- **Both:** Feature gating (free vs premium)
- **Output:** Premium tier structure

#### Day 76: Stripe Checkout & Webhooks

- **Learn:** Stripe Checkout, webhooks
- **Web:** "Upgrade to Premium" button
- **Mobile:** In-app purchase flow
- **Backend:** Webhook handler for payment events
- **Output:** Working Stripe subscription

#### Day 77: Review Week 11

- **Do:** Test PDF generation and Stripe flow
- **Output:** Production-ready monetization

---

### **Week 12: Testing, Polish & Launch**

#### Day 78: Push Notifications (Mobile)

- **Learn:** Firebase Cloud Messaging
- **Do:** Budget alerts, bill reminders
- **Output:** Push notifications

#### Day 79: Testing (Web)

- **Learn:** Vitest, Playwright
- **Do:** Write critical tests
- **Output:** Web test coverage

#### Day 80: Testing (Mobile)

- **Learn:** Flutter widget tests
- **Do:** Write mobile tests
- **Output:** Mobile test coverage

#### Day 81: Performance (Both)

- **Learn:** Optimization techniques
- **Web:** Lighthouse audit, optimize
- **Mobile:** Profile and optimize
- **Output:** Fast performance

#### Day 82: Accessibility (Both)

- **Learn:** A11y best practices
- **Web:** ARIA labels, keyboard nav
- **Mobile:** Screen reader support
- **Output:** Accessible apps

#### Day 83: Deployment Setup

- **Learn:** CI/CD, deployment
- **Web:** Deploy to Vercel
- **Mobile:** Build APK/IPA
- **Output:** Deployment pipelines

#### Day 84: CI/CD Pipeline

- **Learn:** GitHub Actions, automated deployment
- **Web:** Set up CI/CD for Vercel
- **Mobile:** Build automation
- **Output:** Automated deployments

---

### **Week 13: AI Integration** 🤖

#### Day 85: Vercel AI SDK Setup

- **Learn:** AI SDK basics, streaming, React hooks
- **Install:** `npm install ai @ai-sdk/openai`
- **Set up:** OpenAI API key
- **Web:** Test completion endpoint
- **Output:** AI SDK configured

#### Day 86: Smart Auto-Categorization

- **Learn:** Prompt engineering, classification
- **Build:** Categorization API route
- **Web:** "Auto-categorize" button in add transaction
- **Mobile:** Same feature via GraphQL
- **Output:** AI categorization working

#### Day 87: Financial Chatbot

- **Learn:** `useChat` hook, context management
- **Build:** Chat API with transaction data access
- **Web:** Chat interface (sidebar or modal)
- **Mobile:** Chat screen
- **Output:** Working financial chatbot

#### Day 88: Chatbot Refinement

- **Learn:** Context window, conversation memory
- **Enhance:** Add user history to context
- **Features:** Follow-up questions, chart generation
- **Mobile:** Polish chat UI
- **Output:** Smart conversational AI

#### Day 89: Spending Anomaly Detection

- **Learn:** Statistical ML (mean, std deviation)
- **Build:** Anomaly detection algorithm
- **Web/Mobile:** Alert badges on unusual transactions
- **Test:** Verify alerts trigger correctly
- **Output:** Anomaly detection working

#### Day 90: ML Analytics Dashboard

- **Learn:** AI-powered insights, predictions
- **Build:** Insights page with AI analysis
- **Features:** Spending trends, predictions, recommendations
- **Generate Mockup:** AI insights dashboard
- **Output:** AI-powered analytics

#### Day 91: Review Week 13

- **Test:** All AI features across platforms
- **Optimize:** Prompt efficiency, reduce costs
- **Monitor:** Set up OpenAI usage alerts
- **Output:** Production-ready AI features

---

### **Week 14: Advanced ML** 🧠

#### Day 92: TensorFlow.js Setup

- **Learn:** TF.js basics, model architecture
- **Install:** `@tensorflow/tfjs`
- **Build:** Simple test model (XOR problem)
- **Web:** Run model in browser
- **Output:** TF.js working in browser

#### Day 93: Training Data Preparation

- **Learn:** Data preprocessing, normalization
- **Build:** Export user transaction history
- **Process:** Tokenize descriptions, encode categories
- **Format:** Convert to training tensors
- **Output:** Training dataset ready

#### Day 94: Pattern Recognition Model

- **Learn:** Neural networks, training loops
- **Train:** Spending pattern model
- **Features:** Time-based patterns, category clusters
- **Web:** Display spending patterns
- **Output:** Trained pattern model

#### Day 95: Smart Budget Recommendations

- **Learn:** Hybrid AI (statistical + LLM)
- **Build:** Budget optimization algorithm
- **Use:** Vercel AI SDK to explain recommendations
- **Web/Mobile:** Budget advisor feature
- **Output:** AI budget recommendations

#### Day 96: Receipt OCR (Optional)

- **Learn:** Tesseract.js, image preprocessing
- **Build:** Photo → extract amount, merchant
- **Mobile:** Camera integration
- **Web:** File upload option
- **Output:** Smart receipt scanning

#### Day 97: Model Evaluation & Tuning

- **Learn:** Accuracy metrics, confusion matrix
- **Evaluate:** Test categorization accuracy
- **Improve:** Adjust prompts, retrain models
- **Optimize:** Reduce API costs
- **Output:** Optimized ML models

#### Day 98: Final Polish & Launch

- **Test:** Complete ML feature testing
- **Document:** ML usage guide for users
- **Monitor:** Cost tracking, error monitoring
- **Celebrate:** **FinTrack with AI is LIVE!** 🚀✨
- **Output:** Production-ready AI-powered finance app

---

## 📊 Progress Tracking

- [ ] Week 1: Setup & Auth (Both)
- [ ] Week 2: Dashboard (Both)
- [ ] Week 3: Transactions (Both)
- [ ] Week 4: Search & Filters (Both)
- [ ] Week 5: Budgets (Both)
- [ ] Week 6: Analytics (Both)
- [ ] Week 7: Recurring (Both)
- [ ] Week 8: Expense Splitting (Both)
- [ ] Week 9: Goals (Both)
- [ ] Week 10: Settings (Both)
- [ ] Week 11: Advanced Features (Both)
- [ ] Week 12: Testing & Launch (Both)
- [ ] Week 13: AI Integration (Vercel AI SDK)
- [ ] Week 14: Advanced ML (TensorFlow.js)

---

## 🎯 Daily Routine

**Each Day:**

1. Review yesterday's work (10 min)
2. Generate mockup if needed (5 min)
3. Learn the concept (30 min)
4. Code the feature (1.5 hours)
   - Alternate between web and mobile
   - Build same feature, compare approaches
5. Test on both platforms (30 min)
6. Document learnings (10 min)

**Total: 2-3 hours/day**

---

## ✅ Key Principles

1. **Build in parallel** - Same feature, both platforms
2. **Compare approaches** - Web vs mobile patterns
3. **Reuse backend** - One API serves both
4. **Learn deeply** - Understand web, mobile, AND AI
5. **Test both** - Ensure feature parity
6. **Stay balanced** - Don't favor one platform

---

## 🎓 What You'll Learn

**Web (Next.js):**

- React Server Components
- tRPC for type-safe APIs
- Progressive enhancement
- SEO optimization

**Mobile (Flutter):**

- Widget composition
- State management (Riverpod)
- Native features (camera, biometrics)
- Platform-specific UX

**AI/ML:**

- Large Language Models (Vercel AI SDK)
- Prompt engineering
- Client-side ML (TensorFlow.js)
- Statistical models
- Real-time streaming

**Both:**

- Same backend serving web + mobile
- API design considerations
- Cross-platform thinking
- Feature parity strategies

---

**14 weeks. Two apps. AI-powered. One powerful skillset.** 🚀🤖
