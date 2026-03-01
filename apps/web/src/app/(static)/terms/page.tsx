import Link from 'next/link';

import { StaticPageShell } from '../_components';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

const LAST_UPDATED = 'March 1, 2026';

interface Section {
  id: string;
  title: string;
  content?: string[];
  items?: string[];
}

const SECTIONS: Section[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: [
      'By accessing or using FinTrack ("Service", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). Please read them carefully before using the Service.',
      'If you do not agree to these Terms, you may not access or use the Service. By creating an account or continuing to use the Service, you confirm that you are at least 18 years of age and have the legal capacity to enter into a binding agreement.',
    ],
  },
  {
    id: 'service',
    title: '2. Description of Service',
    content: [
      'FinTrack is a personal finance management platform that enables users to track income and expenses, set and manage budgets, establish financial goals, view spending analytics, and receive AI-powered insights based on their financial behaviour.',
      'The Service is provided for personal, non-commercial use only. FinTrack does not provide financial, investment, tax, or legal advice. Information displayed on the platform is for informational purposes only and should not be relied upon as professional financial guidance.',
    ],
  },
  {
    id: 'accounts',
    title: '3. User Accounts & Registration',
    items: [
      'You must provide accurate, current, and complete information when creating an account.',
      'You are solely responsible for safeguarding your account credentials and for all activity that occurs under your account.',
      'You must notify us immediately at support@fintrack.live if you suspect any unauthorised use of your account.',
      'One account per individual is permitted. You may not transfer or sell your account to another party.',
      'Accounts created using automated methods, bots, or scripts are strictly prohibited.',
    ],
  },
  {
    id: 'billing',
    title: '4. Subscription Plans & Billing',
    content: [
      'FinTrack offers a free tier with limited features and one or more paid subscription tiers ("Pro") that unlock additional functionality.',
    ],
    items: [
      'Paid subscriptions are billed in advance on a monthly or annual basis in USD.',
      'Subscriptions automatically renew at the end of each billing period unless cancelled before the renewal date.',
      'You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period; no partial refunds are issued for unused time.',
      'We reserve the right to change subscription pricing with at least 30 days notice. Continued use after the notice period constitutes acceptance of the new pricing.',
      'If payment fails, we may suspend access to paid features until payment is resolved.',
    ],
  },
  {
    id: 'acceptable-use',
    title: '5. Acceptable Use',
    content: ['You agree not to use the Service to:'],
    items: [
      'Violate any applicable local, national, or international law or regulation.',
      'Transmit any harmful, offensive, or unlawful content.',
      'Attempt to gain unauthorised access to any part of the Service or its infrastructure.',
      'Introduce malicious code, viruses, or other harmful software.',
      'Scrape, mine, or harvest data from the Service without written permission.',
      'Impersonate any person or entity, or misrepresent your affiliation with any person or entity.',
      'Interfere with or disrupt the integrity or performance of the Service.',
    ],
  },
  {
    id: 'financial-data',
    title: '6. Financial Data & Third-Party Connections',
    content: [
      'The Service may allow you to connect your bank accounts and financial institutions via third-party data aggregation providers. By connecting an account, you authorise FinTrack to retrieve and display financial information on your behalf.',
    ],
    items: [
      'FinTrack does not store your banking credentials. Credentials are handled exclusively by the third-party aggregation provider.',
      'Third-party data providers have their own terms of service and privacy policies, which you agree to when connecting an account.',
      'We are not responsible for errors, inaccuracies, or delays in data supplied by third-party providers.',
      'You may disconnect any linked account at any time through your account settings.',
    ],
  },
  {
    id: 'ip',
    title: '7. Intellectual Property',
    content: [
      'The Service and all associated content, features, and functionality — including but not limited to software, design, text, graphics, and logos — are the exclusive property of FinTrack and are protected by applicable intellectual property laws.',
      'Your financial data belongs to you. By using the Service, you grant FinTrack a limited, non-exclusive, royalty-free licence to process, store, and display your data solely for the purpose of providing the Service to you. We do not sell your data.',
      'You may not copy, modify, distribute, sell, or lease any part of the Service or its content without our prior written consent.',
    ],
  },
  {
    id: 'privacy',
    title: '8. Privacy',
    content: [
      'Your use of the Service is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you agree to the collection and use of information as described in the Privacy Policy.',
    ],
  },
  {
    id: 'disclaimers',
    title: '9. Disclaimers of Warranties',
    content: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.',
      'We do not warrant that the Service will be uninterrupted, error-free, or free from viruses or other harmful components. We do not warrant the accuracy or completeness of any financial data displayed through the Service.',
    ],
  },
  {
    id: 'liability',
    title: '10. Limitation of Liability',
    content: [
      'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FINTRACK AND ITS DIRECTORS, EMPLOYEES, PARTNERS, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.',
      'Our total cumulative liability to you for any claim arising from or relating to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.',
    ],
  },
  {
    id: 'termination',
    title: '11. Termination',
    content: [
      'You may delete your account at any time from your account settings. Upon deletion, your personal data will be removed in accordance with our Privacy Policy.',
      'We reserve the right to suspend or permanently terminate your account, without prior notice or liability, if we determine that you have violated these Terms or engaged in conduct harmful to other users, third parties, or FinTrack.',
    ],
  },
  {
    id: 'changes',
    title: '12. Changes to These Terms',
    content: [
      'We may update these Terms from time to time. When we do, we will revise the "Last updated" date at the top of this page and, for material changes, notify you by email or by a prominent notice within the Service.',
      'Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.',
    ],
  },
  {
    id: 'governing-law',
    title: '13. Governing Law',
    content: [
      'These Terms are governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be resolved through binding arbitration or in a court of competent jurisdiction, as appropriate.',
    ],
  },
  {
    id: 'contact',
    title: '14. Contact Us',
    content: [
      'If you have questions about these Terms, please contact our legal team at legal@fintrack.app. We aim to respond to all enquiries within 5 business days.',
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <StaticPageShell>
      {/* Page header */}
      <div className="mx-auto mb-12 max-w-[800px] px-4 md:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="text-caption text-text-tertiary flex items-center gap-2">
            <li>
              <Link
                href={STATIC_ROUTES.HOME}
                className="hover:text-primary duration-smooth transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-text-secondary">Terms of Service</li>
          </ol>
        </nav>

        <p className="text-overline text-primary mb-3">Legal</p>
        <h1 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Terms of Service
        </h1>
        <p className="text-body text-text-tertiary mb-6">
          Last updated: <time dateTime="2026-03-01">{LAST_UPDATED}</time>
        </p>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          These Terms govern your access to and use of FinTrack. Please read them carefully — they
          contain important information about your rights and obligations.
        </p>
      </div>

      {/* Divider */}
      <div className="mx-auto mb-12 max-w-[800px] px-4 md:px-6">
        <div className="border-border-subtle border-t" />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[800px] px-4 md:px-6">
        <div className="space-y-10">
          {SECTIONS.map(({ id, title, content, items }) => (
            <section key={id} id={id} className="scroll-mt-28">
              <h2 className="font-manrope text-text-primary mb-4 font-bold">{title}</h2>

              {content?.map((paragraph, i) => (
                <p key={i} className="text-body text-text-secondary mb-3 leading-relaxed">
                  {paragraph}
                </p>
              ))}

              {items && (
                <ul className="mt-3 space-y-2.5" role="list">
                  {items.map((item, i) => (
                    <li
                      key={i}
                      className="text-body text-text-secondary flex items-start gap-3 leading-relaxed"
                    >
                      <span
                        aria-hidden="true"
                        className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="glass-card rounded-card border-border-subtle mt-16 mb-8 border p-6">
          <p className="text-body-sm text-text-secondary leading-relaxed">
            By using FinTrack you confirm you have read, understood, and agree to these Terms of
            Service. For our data practices, see the{' '}
            <Link
              href={STATIC_ROUTES.PRIVACY}
              className="text-primary hover:text-primary-light underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </StaticPageShell>
  );
}
