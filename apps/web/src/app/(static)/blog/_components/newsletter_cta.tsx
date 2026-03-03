'use client';

import { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';

/**
 * Newsletter signup CTA — shows a simple email form.
 * Simulates submission with a thank-you state (no backend required).
 */
export function NewsletterCta() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email.includes('@')) return;
    setSubmitted(true);
  };

  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-24 md:px-6">
      <div className="glass-card rounded-card relative overflow-hidden border border-primary/15 px-8 py-14 md:px-14">
        {/* Accent blobs */}
        <div
          aria-hidden="true"
          className="bg-primary/15 pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-primary/8 pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-2xl"
        />

        <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row md:justify-between">
          {/* Copy */}
          <div className="max-w-lg text-center md:text-left">
            <h2 className="font-manrope text-text-primary mb-3 text-2xl font-bold md:text-3xl">
              Join our financial community
            </h2>
            <p className="text-body text-text-secondary leading-relaxed">
              Get the latest insights on budgeting, investing, and market trends delivered
              directly to your inbox every week.
            </p>
          </div>

          {/* Form */}
          <div className="w-full max-w-md">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle size={28} className="text-primary" aria-hidden="true" />
                <p className="text-body text-text-primary font-semibold">You're in!</p>
                <p className="text-body-sm text-text-secondary">
                  We'll send your first issue this week.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Mail
                      size={15}
                      className="text-text-tertiary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="input-field w-full py-3 pl-9 pr-4 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="glossy-button rounded-button text-body text-text-primary shadow-glow whitespace-nowrap px-6 py-3 font-bold"
                  >
                    Subscribe
                  </button>
                </div>
                <p className="text-caption text-text-disabled mt-3 text-center md:text-left">
                  No spam — unsubscribe at any time.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
