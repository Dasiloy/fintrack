/**
 * Bento capabilities grid — five standout features with visual depth.
 * Each card is hardcoded to allow per-feature decorative content.
 */
export function MetricsSection() {
  return (
    <section className="mx-auto mb-32 max-w-[1200px] px-4 md:px-6">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <h2 className="font-manrope text-text-primary mb-3 font-bold tracking-tight">
          Built around how Nigerians actually manage money
        </h2>
        <p className="text-body text-text-secondary">
          Every feature reflects a real part of how income, spending, and goals work in Nigeria.
        </p>
      </div>

      {/* Bento grid — desktop: first card spans 2 of 3 cols */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* ── Financial Health Score (wide) ── */}
        <div className="glass-card border-border-light group duration-smooth relative overflow-hidden rounded-[18px] border p-6 transition-all hover:-translate-y-0.5 lg:col-span-2">
          {/* Decorative background ring */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-[-20%] right-[-5%] h-[200px] w-[200px] rounded-full opacity-10"
            style={{
              border: '40px solid rgba(124,122,255,0.8)',
              filter: 'blur(2px)',
            }}
          />

          <BentoLabel color="text-violet-400">INTELLIGENCE</BentoLabel>

          <h3 className="font-manrope text-text-primary mb-1 text-xl leading-tight font-bold">
            Financial Health Score
          </h3>
          <p className="text-body-sm text-text-secondary mb-5 max-w-sm leading-relaxed">
            A 0-100 score that reflects how your income, spending, savings rate, and goal progress
            are tracking together. Updated every time you add data.
          </p>

          {/* Score breakdown chips */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                {
                  label: 'Income',
                  val: '90',
                  color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
                },
                {
                  label: 'Spending',
                  val: '72',
                  color: 'bg-primary/10 text-primary border-primary/20',
                },
                {
                  label: 'Savings',
                  val: '68',
                  color: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
                },
                {
                  label: 'Goals',
                  val: '55',
                  color: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
                },
              ] as const
            ).map(({ label, val, color }) => (
              <div
                key={label}
                className={`rounded-full border px-3 py-1 text-[12px] font-bold ${color}`}
              >
                {label} · {val}
              </div>
            ))}
          </div>
        </div>

        {/* ── Mono Bank Sync ── */}
        <div className="glass-card border-border-light group duration-smooth relative overflow-hidden rounded-[18px] border p-6 transition-all hover:-translate-y-0.5">
          <BentoLabel color="text-sky-400">BANKING</BentoLabel>

          <h3 className="font-manrope text-text-primary mb-1 text-xl leading-tight font-bold">
            Mono Bank Sync
          </h3>
          <p className="text-body-sm text-text-secondary mb-5 leading-relaxed">
            Connect any Nigerian bank in seconds. Read-only access to balances and transactions via
            Mono.
          </p>

          {/* Bank chips */}
          <div className="flex flex-wrap gap-2">
            {(['GTBank', 'Access Bank', 'First Bank', 'UBA', 'Zenith'] as const).map((bank) => (
              <span
                key={bank}
                className="bg-bg-deep border-border-light text-text-secondary rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              >
                {bank}
              </span>
            ))}
          </div>
        </div>

        {/* ── AI Insights ── */}
        <div className="glass-card border-border-light group duration-smooth relative overflow-hidden rounded-[18px] border p-6 transition-all hover:-translate-y-0.5">
          <BentoLabel color="text-primary">AI</BentoLabel>

          <h3 className="font-manrope text-text-primary mb-1 text-xl leading-tight font-bold">
            AI Insights
          </h3>
          <p className="text-body-sm text-text-secondary mb-5 leading-relaxed">
            Plain-English summaries of where your money went and what to watch this month.
          </p>

          {/* Insight preview */}
          <div className="bg-primary/8 border-primary/15 rounded-[10px] border px-3 py-2.5">
            <div className="flex items-start gap-2">
              <span className="bg-primary mt-1 size-1.5 shrink-0 rounded-full" />
              <p className="text-caption text-text-secondary leading-snug">
                Your food spend was ₦12k over budget. Dining out on weekends accounted for most of
                the difference.
              </p>
            </div>
          </div>
        </div>

        {/* ── Smart Recurring ── */}
        <div className="glass-card border-border-light group duration-smooth relative overflow-hidden rounded-[18px] border p-6 transition-all hover:-translate-y-0.5">
          <BentoLabel color="text-amber-400">SCHEDULE</BentoLabel>

          <h3 className="font-manrope text-text-primary mb-1 text-xl leading-tight font-bold">
            Smart Recurring
          </h3>
          <p className="text-body-sm text-text-secondary mb-5 leading-relaxed">
            Log DSTV, rent, MTN data, and other regular bills once. Transactions are created
            automatically.
          </p>

          {/* Scheduled items */}
          <div className="space-y-2">
            {(
              [
                { abbr: 'MTN', name: 'MTN Data', when: '24th', amount: '₦25,000' },
                { abbr: 'DTV', name: 'DSTV', when: '1st', amount: '₦24,500' },
              ] as const
            ).map(({ abbr, name, when, amount }) => (
              <div
                key={name}
                className="bg-bg-deep flex items-center gap-3 rounded-[10px] px-3 py-2"
              >
                <span className="rounded-[6px] bg-amber-400/15 px-2 py-0.5 text-[10px] font-black text-amber-400">
                  {abbr}
                </span>
                <span className="text-body-sm text-text-primary flex-1 font-medium">{name}</span>
                <span className="text-caption text-text-disabled mr-2">→ {when}</span>
                <span className="text-body-sm text-text-secondary font-bold">{amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Spending Heatmap ── */}
        <div className="glass-card border-border-light group duration-smooth relative overflow-hidden rounded-[18px] border p-6 transition-all hover:-translate-y-0.5">
          <BentoLabel color="text-emerald-400">ANALYTICS</BentoLabel>

          <h3 className="font-manrope text-text-primary mb-1 text-xl leading-tight font-bold">
            Spending Heatmap
          </h3>
          <p className="text-body-sm text-text-secondary mb-5 leading-relaxed">
            A calendar view of your highest-spend days so you can see at a glance when money moves
            most.
          </p>

          {/* Mini heatmap — 7 columns × 4 rows */}
          <div className="grid grid-cols-7 gap-1">
            {HEATMAP_CELLS.map((intensity, i) => (
              <div
                key={i}
                className="aspect-square rounded-[3px]"
                style={{
                  backgroundColor:
                    intensity === 0
                      ? 'rgba(52,211,153,0.06)'
                      : `rgba(52,211,153,${0.12 + intensity * 0.22})`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Spending heatmap cell intensities (0 = empty, 1-4 = light → dark). */
const HEATMAP_CELLS = [
  0, 1, 0, 2, 0, 1, 0, 1, 2, 3, 1, 0, 2, 1, 2, 1, 4, 3, 2, 1, 0, 0, 3, 2, 1, 4, 2, 1,
];

/** Small coloured category label with a leading dot. */
function BentoLabel({ color, children }: { color: string; children: string }) {
  return (
    <div
      className={`text-overline mb-4 flex items-center gap-1.5 font-bold tracking-widest ${color}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-1.5 rounded-full ${
          color
            .split(' ')
            .find((c) => c.startsWith('before:'))
            ?.replace('before:', '') ?? ''
        }`}
        style={{ background: 'currentColor' }}
      />
      {children}
    </div>
  );
}
