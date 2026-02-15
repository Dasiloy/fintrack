# Fintrack 16-Week "Mastery" Roadmap

**The Method**: Each week is a **5-Day Sprint** to master one core concept.
**The Design**: Every Monday, I will provide a **High-Fidelity Mockup** (Web & Mobile) using the _Obsidian Silver_ Design System.
**The Code**: You will implement these designs pixel-perfectly using our strict CSS Variables and Flutter Theme Extensions.

---

## 🏗️ Phase 1: The Molecular Foundation (Weeks 1-4)

**Theme**: "Structure, Types, and O(1) Thinking"

### 🗓️ Week 1: The Monorepo & The Ledger

**Core Concept:** Time Complexity (Big O) & Single Source of Truth.

| Day     | Focus        | The Action Plan                                                                                                                             |
| :------ | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mon** | 🧠 Theory    | **DSA: Big O**. Study efficient ledger structures. <br> 🎨 **Design**: Review "Ledger Table" Mock (Web) & "Transaction List" Mock (Mobile). |
| **Tue** | 🏗️ Arch      | **Turborepo Setup**. Initialize `packages/db` & `packages/ui`. Define strict Prism schema.                                                  |
| **Wed** | 🌐 Web UI    | **Next.js Implementation**. Build the `LedgerTable` component using `--surface-silver` and `--text-secondary` variables.                    |
| **Thu** | 📱 Mobile UI | **Flutter Implementation**. Build the `TransactionTile` widget using `context.colors.surface` and `AppDimens.space4`.                       |
| **Fri** | ✅ Review    | **Break Test**. Change `schema.prisma`. Verify strict compile-time errors in Next.js & Flutter.                                             |

---

### 🗓️ Week 2: Identity as a Linked List

**Core Concept:** Hash Maps & Edge Authentication.

| Day     | Focus        | The Action Plan                                                                                                                |
| :------ | :----------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Hash Maps**. O(1) session lookups in Redis. <br> 🎨 **Design**: Review "Login Screen" Mock (Gradient Blur backgrounds). |
| **Tue** | 🏗️ Arch      | **Auth Service**. Design stateless JWT flow. Plan "Edge Middleware" for route protection.                                      |
| **Wed** | 🌐 Web UI    | **NextAuth Login**. Implement the Glassmorphism login card. Use `backdrop-filter: blur(12px)`.                                 |
| **Thu** | 📱 Mobile UI | **Flutter Auth Screen**. Implement the `LoginScaffold` with `Riverpod` state. Handle keyboard insets gracefully.               |
| **Fri** | ✅ Review    | **Ban Test**. Manually ban a user in Redis. Confirm immediate session termination on Web & Mobile.                             |

---

### 🗓️ Week 3: The Transaction Graph

**Core Concept:** Linked Lists & Atomicity.

| Day     | Focus        | The Action Plan                                                                                                                |
| :------ | :----------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Linked Lists**. Formatting chains of events. <br> 🎨 **Design**: Review "Transaction Detail" Modal (Slide-over panels). |
| **Tue** | 🏗️ Arch      | **Ledger Engine**. Design Double-Entry (Debit/Credit) pairs in Prisma.                                                         |
| **Wed** | 🌐 Web UI    | **Transaction Modal**. Build the `Sheet` component using strictly defined `z-index` and shadow tokens.                         |
| **Thu** | 📱 Mobile UI | **Flutter Detail Screen**. Build the `SliverAppBar` layout for transaction details. Use `Hero` animations.                     |
| **Fri** | ✅ Review    | **Integrity Test**. Manually insert a broken transaction. Verify system rejects it instantly.                                  |

---

### 🗓️ Week 4: The Gateway (tRPC & Proxies)

**Core Concept:** Queues & API patterns.

| Day     | Focus        | The Action Plan                                                                                                            |
| :------ | :----------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Queues**. Handling burst traffic. <br> 🎨 **Design**: Review "Dashboard Layout" (Sidebar navigation vs Bottom Bar). |
| **Tue** | 🏗️ Arch      | **Gateway Design**. "User Intent" JSON vs "System Action" gRPC.                                                            |
| **Wed** | 🌐 Web UI    | **Dashboard Shell**. Implement the responsive `AppShell` with collapsible sidebar using CSS Grid.                          |
| **Thu** | 📱 Mobile UI | **Mobile Scaffold**. Implement the `BottomNavigationBar` with persistent state across tabs.                                |
| **Fri** | ✅ Review    | **Offline Test**. Disconnect Backend. Verify Mobile & Web handle the "Offline" state gracefully.                           |

---

## 💸 Phase 2: The Core Mechanics (Weeks 5-8)

**Theme**: "Data Flow & React/Flutter Patterns"

### 🗓️ Week 5: Banks & Webhooks

**Core Concept:** Event Loops & Idempotency.

| Day     | Focus        | The Action Plan                                                                                                    |
| :------ | :----------- | :----------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Event Loops**. Async task handling. <br> 🎨 **Design**: Review "Bank Connect" flow (Succcess/Error states). |
| **Tue** | 🏗️ Arch      | **Webhook Handler**. Design Redis "Fire and Forget" queue for webhooks.                                            |
| **Wed** | 🌐 Web UI    | **Bank Link Widget**. Integrate Mono Connect SDK. Style the success modal with `--color-success`.                  |
| **Thu** | 📱 Mobile UI | **WebView Integration**. Securely launch Mono Widget in `InAppWebView`. Handle deep linking callbacks.             |
| **Fri** | ✅ Review    | **Replay Attack**. Send the same webhook payload 10 times. Confirm only 1 transaction is created.                  |

---

### 🗓️ Week 6: Budgeting Algorithm

**Core Concept:** Interval Trees & Optimistic UI.

| Day     | Focus        | The Action Plan                                                                                                             |
| :------ | :----------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Interval Trees**. Efficient range queries. <br> 🎨 **Design**: Review "Budget Rings" (Circular Progress animations). |
| **Tue** | 🏗️ Arch      | **Budget Aggregates**. Design on-the-fly calculation vs cached balance strategy.                                            |
| **Wed** | 🌐 Web UI    | **Budget Card**. Build the CSS-only circular progress bar using `conic-gradient`.                                           |
| **Thu** | 📱 Mobile UI | **Custom Painter**. Draw the Budget Ring manually in Flutter for 60FPS performance.                                         |
| **Fri** | ✅ Review    | **Profiler**. Run React/Flutter profiler. Ensure updating a budget only repaints that specific widget.                      |

---

### 🗓️ Week 7: The Mobile Bridge (Flutter Deep Dive)

**Core Concept:** Recursion & Widget Trees.

| Day     | Focus        | The Action Plan                                                                                                |
| :------ | :----------- | :------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Recursion**. Flutter Element Tree traversal. <br> 🎨 **Design**: Review "Settings" & "Profile" screens. |
| **Tue** | 🏗️ Arch      | **Clean Arch**. Refine `features/transactions` with strict domain/data separation.                             |
| **Wed** | 🌐 Web UI    | **Settings Page**. Implement form layouts with `react-hook-form` and Zod validation.                           |
| **Thu** | 📱 Mobile UI | **Slivers & Profiles**. Build complex scrolling effects using `CustomScrollView` and `SliverPersistentHeader`. |
| **Fri** | ✅ Review    | **Environment Test**. Verify `Staging` app cannot authenticate against `Prod` DB.                              |

---

### 🗓️ Week 8: Data Visualization

**Core Concept:** Sorting Algorithms & Virtualization.

| Day     | Focus        | The Action Plan                                                                                                    |
| :------ | :----------- | :----------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Sorting**. Ordering logic. <br> 🎨 **Design**: Review "Financial Charts" (Line/Bar graphs with tooltips).   |
| **Tue** | 🏗️ Arch      | **Chart Data**. Define Edge Compute aggregation layer.                                                             |
| **Wed** | 🌐 Web UI    | **Chart Component**. Build `<ChartContainer />`. Implement interaction (hover/tooltips) with `visx` or `recharts`. |
| **Thu** | 📱 Mobile UI | **Interactive Canvas**. Build "Scrubbable" chart with `GestureDetector`. Use `RepaintBoundary` for perf.           |
| **Fri** | ✅ Review    | **Stress Test**. Scroll 5,000 transactions on a low-end Android device at 60 FPS.                                  |

---

## 🤖 Phase 3: Intelligence & Complexity (Weeks 9-12)

**Theme**: "Graph Theory & AI"

### 🗓️ Week 9: The Bill Splitter

**Core Concept:** Max-Flow Min-Cut & Graph Theory.

| Day     | Focus        | The Action Plan                                                                                                    |
| :------ | :----------- | :----------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Max-Flow**. Graph algorithms. <br> 🎨 **Design**: Review "Split Group" View (Avatars and connection lines). |
| **Tue** | 🏗️ Arch      | **Graph Model**. Users = Nodes, Debts = Edges.                                                                     |
| **Wed** | 🌐 Web UI    | **Split Interface**. Build the drag-and-drop user selection for splitting bills.                                   |
| **Thu** | 📱 Mobile UI | **Isolates**. Run the background "Simplify Debt" calculation. Store graph in `Drift` (SQL).                        |
| **Fri** | ✅ Review    | **Debt Circle**. Create complex A-B-C debt. Verify Fintrack suggests 0 transfers.                                  |

---

### 🗓️ Week 10: AI Chat (RAG)

**Core Concept:** Vector Similarity & Streaming.

| Day     | Focus        | The Action Plan                                                                                                      |
| :------ | :----------- | :------------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Vector Search**. Cosine similarity. <br> 🎨 **Design**: Review "Chat Interface" (Bubbles, Typing indicators). |
| **Tue** | 🏗️ Arch      | **Streaming Pipeline**. Vercel AI SDK + Pinecone.                                                                    |
| **Wed** | 🌐 Web UI    | **Chat Bubble**. Implement the streaming text effect (Typewriter) using CSS animations.                              |
| **Thu** | 📱 Mobile UI | **StreamBuilder**. Handle async token stream. Fix keyboard inset scrolling.                                          |
| **Fri** | ✅ Review    | **Ask Test**. Ask "Sushi spend last week?" Verify correct retrieval.                                                 |

---

### 🗓️ Week 11: Privacy at the Edge

**Core Concept:** Sliding Windows & On-Device ML.

| Day     | Focus        | The Action Plan                                                                                                        |
| :------ | :----------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Sliding Windows**. Pattern analysis. <br> 🎨 **Design**: Review "Privacy Mask" Visuals (Redacted text effects). |
| **Tue** | 🏗️ Arch      | **Privacy Design**. Define "Hostile Cloud" rules.                                                                      |
| **Wed** | 🌐 Web UI    | **Redaction UI**. Implement the "Blur" effect over sensitive data until verified.                                      |
| **Thu** | 📱 Mobile UI | **TFLite**. Run native ML masking layer. Clear sensitive RAM immediately.                                              |
| **Fri** | ✅ Review    | **Network Spy**. Inspect traffic. Confirm no unmasked names leave the device.                                          |

---

### 🗓️ Week 12: Search & Discovery

**Core Concept:** Tries (Prefix Trees).

| Day     | Focus        | The Action Plan                                                                                              |
| :------ | :----------- | :----------------------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Tries**. Autocomplete structures. <br> 🎨 **Design**: Review "Global Search" Modal (Command Palette). |
| **Tue** | 🏗️ Arch      | **Search Index**. In-memory Trie strategy.                                                                   |
| **Wed** | 🌐 Web UI    | **Command Palette**. Build `CMDK` style modal. Implement keyboard navigation shortcuts.                      |
| **Thu** | 📱 Mobile UI | **Slivers**. Build native "Collapsing Header" search bar (Apple Settings style).                             |
| **Fri** | ✅ Review    | **Typo Test**. Type "Starbuks" -> expect "Starbucks".                                                        |

---

## 🏎️ Phase 4: Mastery & Launch (Weeks 13-16)

**Theme**: "Hardening, Security, and Scale"

### 🗓️ Week 13: Caching & Performance

**Core Concept:** LRU Cache.

| Day     | Focus        | The Action Plan                                                                                                     |
| :------ | :----------- | :------------------------------------------------------------------------------------------------------------------ |
| **Mon** | 🧠 Theory    | **DSA: LRU Cache**. Eviction policies. <br> 🎨 **Design**: Review "Loading States" & "Skeletons" (Shimmer effects). |
| **Tue** | 🏗️ Arch      | **Redis Strategy**. Plan invalidation rules.                                                                        |
| **Wed** | 🌐 Web UI    | **Skeletons**. Replace spinners with Shimmer Skeletons matching the precise layout height.                          |
| **Thu** | 📱 Mobile UI | **Local Persistence**. Implement `Hive` for instant app start. Cache images with `CachedNetworkImage`.              |
| **Fri** | ✅ Review    | **Lighthouse**. Hit 95+ Performance. 0 Jank frames on Mobile.                                                       |

---

### 🗓️ Week 14: Security Hardening

**Core Concept:** Hashing & Cryptography.

| Day     | Focus        | The Action Plan                                                                                 |
| :------ | :----------- | :---------------------------------------------------------------------------------------------- |
| **Mon** | 🧠 Theory    | **DSA: Hashing**. SHA-256. <br> 🎨 **Design**: Review "Security Settings" & "Biometric Prompt". |
| **Tue** | 🏗️ Arch      | **Security Audit**. Rate Limiting, CSP Headers.                                                 |
| **Wed** | 🌐 Web UI    | **2FA Input**. Build the OTP Pin Input component with auto-focus logic.                         |
| **Thu** | 📱 Mobile UI | **Biometrics**. Implement FaceID prompt. Blur screen in background (App Switcher).              |
| **Fri** | ✅ Review    | **Pentest**. Attempt brute force. Verify IP ban.                                                |

---

### 🗓️ Week 15: Alpha Testing

**Core Concept:** Real World Stress.

| Day     | Focus         | The Action Plan                                                 |
| :------ | :------------ | :-------------------------------------------------------------- |
| **Mon** | 🚀 Distribute | **TestFlight / Internal Track**. Push builds to 5 trusted devs. |
| **Tue** | 🐛 Monitoring | Setup **Sentry / Crashlytics**. Watch for unhandled exceptions. |
| **Wed** | 🔨 Break It   | **Bug Bounty**. Offer lunch for logic errors.                   |
| **Thu** | 📉 Load Test  | Simulate 1,000 concurrent socket connections.                   |
| **Fri** | ✅ Triage     | Fix critical issues. Ignore minor polish.                       |

---

### 🗓️ Week 16: Beta Polish & Launch

**Core Concept:** Golden Master.

| Day     | Focus      | The Action Plan                                                  |
| :------ | :--------- | :--------------------------------------------------------------- |
| **Mon** | 🧹 Cleanup | Remove `console.log`, `TODO`s, and unused imports.               |
| **Tue** | 📄 Docs    | Finalize API Reference. Update README.                           |
| **Wed** | 🔐 Build   | **Obfuscate** Flutter build (shrink size). Prod build on Vercel. |
| **Thu** | 🚀 Launch  | Flip the DNS switch. Publish to Stores.                          |
| **Fri** | 🎉 Party   | Relax. Monitor Sentry.                                           |

---

## 🎓 Post-Roadmap: The Lifecycle

- **Live Ops (Week 17+)**: Monitor crash reports.
- **Iteration (Week 21+)**: User feedback drives the next cycle.
