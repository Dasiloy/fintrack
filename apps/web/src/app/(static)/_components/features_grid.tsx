import type { ReactNode } from 'react';
import {
  BarChart3,
  PieChart,
  GitFork,
  Target,
  Repeat2,
  FileText,
  Sparkles,
  Brain,
} from 'lucide-react';

/**
 * Feature bento grid — 3-column desktop layout with mixed card sizes.
 * Key cards contain mini-UI content to illustrate each feature visually.
 */
export function FeaturesGrid() {
  return (
    <section
      id="all-features"
      className="relative mx-auto mb-32 max-w-[1200px] scroll-mt-32 px-4 md:px-6"
    >
      {/* Ambient centre glow */}
      <div
        aria-hidden="true"
        className="bg-primary/5 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
      />

      <div className="mx-auto mb-14 max-w-3xl text-center">
        <h2 className="font-manrope mb-3 font-bold text-text-primary">Everything you need</h2>
        <p className="text-body text-text-secondary">
          A complete toolkit for understanding your money, built for how Nigerians actually spend.
        </p>
      </div>

      {/* Masonry bento — 1 col, md: 2 col, lg: 3 col. Varying card heights
          create a natural staggered layout with no awkward gaps. */}
      <div className="columns-1 gap-4 md:columns-2 lg:columns-3">

        {/* ── Transaction Tracking ── */}
        <div className="glass-card border-border-light group relative mb-4 break-inside-avoid rounded-[18px] border p-5 transition-all duration-smooth will-change-transform hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_44px_-16px_rgba(124,122,255,0.4)] hover:z-10">
          <CategoryLabel color="text-emerald-400" dot="bg-emerald-400">TRACKING</CategoryLabel>
          <div className="mb-1 flex items-center gap-2.5">
            <BarChart3 size={18} className="text-emerald-400" aria-hidden="true" />
            <h3 className="font-manrope text-text-primary font-bold text-lg">Transaction Tracking</h3>
          </div>
          <p className="text-body-sm text-text-secondary mb-4">
            Add transactions manually or scan a receipt. Every naira is categorized and logged.
          </p>
          {/* Mini transaction list */}
          <div className="rounded-[12px] bg-bg-deep p-3 space-y-2">
            {([
              { name: 'Uber Nigeria', cat: 'Transport', amount: '-₦12,500', color: 'text-danger' },
              { name: 'Chopnow Grocery', cat: 'Food & Drinks', amount: '-₦45,000', color: 'text-danger' },
              { name: 'Salary Deposit', cat: 'Income', amount: '+₦850,000', color: 'text-success' },
            ] as const).map(({ name, cat, amount, color }) => (
              <div key={name} className="bg-bg-elevated rounded-[8px] flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-body-sm text-text-primary font-medium">{name}</p>
                  <p className="text-caption text-text-disabled">{cat}</p>
                </div>
                <span className={`text-body-sm font-bold ${color}`}>{amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Insights (1 col) ── */}
        <div className="glass-card border-border-light group relative mb-4 break-inside-avoid rounded-[18px] border p-5 transition-all duration-smooth will-change-transform hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_44px_-16px_rgba(124,122,255,0.4)] hover:z-10">
          <CategoryLabel color="text-violet-400" dot="bg-violet-400">INTELLIGENCE</CategoryLabel>
          <div className="mb-1 flex items-center gap-2.5">
            <Sparkles size={18} className="text-violet-400" aria-hidden="true" />
            <h3 className="font-manrope text-text-primary font-bold text-lg">AI Insights</h3>
          </div>
          <p className="text-body-sm text-text-secondary mb-4">
            Plain-English summaries of your spending trends and financial health each month.
          </p>
          {/* Insight bubble */}
          <div className="rounded-[12px] bg-primary/8 border border-primary/20 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="bg-primary mt-0.5 size-1.5 shrink-0 rounded-full" />
              <p className="text-caption text-text-secondary leading-snug">
                Your savings rate dropped 6% vs last month. Most of the change came from dining out on weekends.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-emerald-400 mt-0.5 size-1.5 shrink-0 rounded-full" />
              <p className="text-caption text-text-secondary leading-snug">
                You are on track to hit your emergency fund goal by August.
              </p>
            </div>
          </div>
        </div>

        {/* ── AI Chat (1 col) ── */}
        <div className="glass-card border-border-light group relative mb-4 break-inside-avoid rounded-[18px] border p-5 transition-all duration-smooth will-change-transform hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_44px_-16px_rgba(124,122,255,0.4)] hover:z-10">
          <CategoryLabel color="text-primary" dot="bg-primary">AI</CategoryLabel>
          <div className="mb-1 flex items-center gap-2.5">
            <Brain size={18} className="text-primary" aria-hidden="true" />
            <h3 className="font-manrope text-text-primary font-bold text-lg">AI Chat</h3>
          </div>
          <p className="text-body-sm text-text-secondary mb-4">
            Ask questions about your money in natural language and get instant answers.
          </p>
          {/* Chat Q&A */}
          <div className="rounded-[12px] bg-bg-deep p-3 space-y-2">
            <div className="bg-bg-elevated rounded-[8px] px-3 py-2">
              <p className="text-caption text-text-secondary italic">
                &ldquo;How much did I spend on food last month?&rdquo;
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-[8px] px-3 py-2">
              <p className="text-caption text-text-secondary leading-snug">
                You spent{' '}
                <span className="text-primary font-bold">₦67,500</span>{' '}
                on food in May — 8% below your monthly budget.
              </p>
            </div>
          </div>
        </div>

        {/* ── Smart Budgets (1 col) ── */}
        <div className="glass-card border-border-light group relative mb-4 break-inside-avoid rounded-[18px] border p-5 transition-all duration-smooth will-change-transform hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_44px_-16px_rgba(124,122,255,0.4)] hover:z-10">
          <CategoryLabel color="text-sky-400" dot="bg-sky-400">PLANNING</CategoryLabel>
          <div className="mb-1 flex items-center gap-2.5">
            <PieChart size={18} className="text-sky-400" aria-hidden="true" />
            <h3 className="font-manrope text-text-primary font-bold text-lg">Smart Budgets</h3>
          </div>
          <p className="text-body-sm text-text-secondary mb-4">
            Set monthly spending limits per category and see live progress as you spend.
          </p>
          {/* Budget bars */}
          <div className="space-y-3">
            {([
              { label: 'Food', spent: 45000, total: 60000, color: 'bg-emerald-400' },
              { label: 'Transport', spent: 18000, total: 25000, color: 'bg-sky-400' },
              { label: 'Entertainment', spent: 12000, total: 10000, color: 'bg-danger' },
            ] as const).map(({ label, spent, total, color }) => {
              const pct = Math.min(100, Math.round((spent / total) * 100));
              return (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-caption text-text-secondary">{label}</span>
                    <span className="text-caption text-text-disabled">₦{spent.toLocaleString()} / ₦{total.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-bg-deep">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recurring Bills (1 col) ── */}
        <div className="glass-card border-border-light group relative mb-4 break-inside-avoid rounded-[18px] border p-5 transition-all duration-smooth will-change-transform hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_44px_-16px_rgba(124,122,255,0.4)] hover:z-10">
          <CategoryLabel color="text-amber-400" dot="bg-amber-400">AUTOMATION</CategoryLabel>
          <div className="mb-1 flex items-center gap-2.5">
            <Repeat2 size={18} className="text-amber-400" aria-hidden="true" />
            <h3 className="font-manrope text-text-primary font-bold text-lg">Recurring Bills</h3>
          </div>
          <p className="text-body-sm text-text-secondary mb-4">
            Log bills once. Transactions are created automatically on each due date.
          </p>
          {/* Recurring items */}
          <div className="rounded-[12px] bg-bg-deep p-3 space-y-2">
            {([
              { abbr: 'DTV', name: 'DSTV', freq: 'Monthly · 1st', amount: '₦24,500' },
              { abbr: 'MTN', name: 'MTN Data', freq: 'Monthly · 24th', amount: '₦25,000' },
              { abbr: 'IKE', name: 'Electricity', freq: 'Bi-weekly', amount: '₦15,000' },
            ] as const).map(({ abbr, name, freq, amount }) => (
              <div key={name} className="bg-bg-elevated rounded-[8px] flex items-center gap-3 px-3 py-2">
                <span className="bg-amber-400/15 text-amber-400 rounded-md px-2 py-0.5 text-[10px] font-black shrink-0">
                  {abbr}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-text-primary font-medium truncate">{name}</p>
                  <p className="text-caption text-text-disabled">{freq}</p>
                </div>
                <span className="text-body-sm text-text-secondary font-bold shrink-0">{amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Financial Goals ── */}
        <div className="glass-card border-border-light group relative mb-4 break-inside-avoid rounded-[18px] border p-5 transition-all duration-smooth will-change-transform hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_44px_-16px_rgba(124,122,255,0.4)] hover:z-10">
          <CategoryLabel color="text-rose-400" dot="bg-rose-400">GOALS</CategoryLabel>
          <div className="mb-1 flex items-center gap-2.5">
            <Target size={18} className="text-rose-400" aria-hidden="true" />
            <h3 className="font-manrope text-text-primary font-bold text-lg">Financial Goals</h3>
          </div>
          <p className="text-body-sm text-text-secondary mb-4">
            Set a savings target with a deadline. Track contributions and stay on pace.
          </p>
          {/* Goal progress */}
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-caption text-text-secondary">Emergency Fund</span>
                <span className="text-caption text-primary font-bold">68%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-deep">
                <div className="h-full w-[68%] rounded-full bg-primary" style={{ boxShadow: '0 0 8px rgba(124,122,255,0.5)' }} />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-caption text-text-secondary">New Laptop</span>
                <span className="text-caption text-emerald-400 font-bold">41%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-deep">
                <div className="h-full w-[41%] rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Expense Splits ── */}
        <div className="glass-card border-border-light group relative mb-4 break-inside-avoid rounded-[18px] border p-5 transition-all duration-smooth will-change-transform hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_44px_-16px_rgba(124,122,255,0.4)] hover:z-10">
          <CategoryLabel color="text-teal-400" dot="bg-teal-400">SHARING</CategoryLabel>
          <div className="mb-1 flex items-center gap-2.5">
            <GitFork size={18} className="text-teal-400" aria-hidden="true" />
            <h3 className="font-manrope text-text-primary font-bold text-lg">Expense Splits</h3>
          </div>
          <p className="text-body-sm text-text-secondary mb-4">
            Split shared bills with friends or housemates and track who has paid.
          </p>
          {/* Split people */}
          <div className="rounded-[12px] bg-bg-deep p-3 space-y-2">
            <div className="bg-bg-elevated rounded-[8px] flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="from-teal-400/40 to-teal-400/10 flex size-7 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-bold text-teal-400">AD</div>
                <span className="text-body-sm text-text-primary">Ade</span>
              </div>
              <span className="text-caption text-success font-bold">Paid</span>
            </div>
            <div className="bg-bg-elevated rounded-[8px] flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="from-rose-400/40 to-rose-400/10 flex size-7 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-bold text-rose-400">TJ</div>
                <span className="text-body-sm text-text-primary">Tolu</span>
              </div>
              <span className="text-caption text-danger font-bold">₦8,333 owed</span>
            </div>
          </div>
        </div>

        {/* ── PDF and CSV Export ── */}
        <div className="glass-card border-border-light group relative mb-4 break-inside-avoid rounded-[18px] border p-5 transition-all duration-smooth will-change-transform hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_44px_-16px_rgba(124,122,255,0.4)] hover:z-10">
          <CategoryLabel color="text-text-tertiary" dot="bg-text-tertiary">PRO</CategoryLabel>
          <div className="mb-1 flex items-center gap-2.5">
            <FileText size={18} className="text-text-tertiary" aria-hidden="true" />
            <h3 className="font-manrope text-text-primary font-bold text-lg">PDF and CSV Export</h3>
          </div>
          <p className="text-body-sm text-text-secondary mb-4">
            Export your transaction history and monthly reports as PDF or CSV.
          </p>
          <div className="rounded-[12px] bg-bg-deep p-3 flex items-center gap-3">
            <div className="bg-bg-elevated rounded-[8px] flex-1 px-3 py-2.5 text-center">
              <FileText size={16} className="text-text-tertiary mx-auto mb-1" aria-hidden="true" />
              <p className="text-caption text-text-secondary font-medium">May 2025.pdf</p>
            </div>
            <div className="bg-bg-elevated rounded-[8px] flex-1 px-3 py-2.5 text-center">
              <FileText size={16} className="text-text-tertiary mx-auto mb-1" aria-hidden="true" />
              <p className="text-caption text-text-secondary font-medium">Q2 2025.csv</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

/** Small reusable category label chip. */
function CategoryLabel({
  color,
  dot,
  children,
}: {
  color: string;
  dot: string;
  children: ReactNode;
}) {
  return (
    <div className={`text-overline mb-3 flex items-center gap-1.5 font-bold tracking-widest ${color}`}>
      <span className={`inline-block size-1.5 rounded-full ${dot}`} />
      {children}
    </div>
  );
}
