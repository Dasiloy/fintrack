import Link from 'next/link';

import { Mailer, StaticPageShell } from '../_components';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

const LAST_UPDATED = 'March 1, 2026';

const SECTIONS = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    content: ['We collect information in the following ways:'],
    subsections: [
      {
        heading: 'Information you provide directly',
        items: [
          'Account registration data: your name, email address, and password (stored as a secure hash — we never store your plain-text password).',
          'Profile and preferences you configure within the app.',
          'Communications you send to our support team.',
        ],
      },
      {
        heading: 'Information collected automatically',
        items: [
          'Usage data: pages visited, features used, clicks, and session duration.',
          'Device and technical data: browser type, operating system, IP address, and device identifiers.',
          'Cookies and similar tracking technologies (see Section 7).',
        ],
      },
      {
        heading: 'Financial account information',
        items: [
          'When you connect a bank or financial account, our third-party data provider retrieves account balances, transaction history, and institution details on your behalf.',
          'FinTrack never receives or stores your banking credentials. All credential handling is performed exclusively by the data aggregation provider.',
        ],
      },
    ],
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Your Information',
    items: [
      'To create and manage your account and authenticate your identity.',
      'To provide, personalise, and improve the Service, including AI-powered insights derived from your financial data.',
      'To send transactional communications such as account alerts, billing receipts, and security notifications.',
      'To send product updates and feature announcements (you may opt out at any time).',
      'To detect, investigate, and prevent fraudulent transactions and abuse.',
      'To comply with applicable legal and regulatory obligations.',
      'To aggregate and anonymise usage data for internal analytics and product improvement (this data cannot identify you).',
    ],
  },
  {
    id: 'information-sharing',
    title: '3. Information Sharing & Disclosure',
    content: [
      'We do not sell, rent, or trade your personal data. We share information only in the following limited circumstances:',
    ],
    items: [
      'Service providers: third-party vendors who process data on our behalf (e.g., cloud hosting, payment processors, email delivery, and analytics). These providers are contractually bound to use your data only to deliver services to us.',
      'Financial data aggregators: with your explicit authorisation, to retrieve your financial account information.',
      'Legal requirements: when we believe in good faith that disclosure is required by applicable law, regulation, legal process, or enforceable governmental request.',
      'Business transfers: in connection with a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity, subject to the same privacy commitments.',
      'With your consent: in any other circumstance where you have explicitly authorised the disclosure.',
    ],
  },
  {
    id: 'data-security',
    title: '4. Data Security',
    content: [
      'We take the security of your personal and financial data seriously and implement industry-standard safeguards:',
    ],
    items: [
      'All data transmitted between your device and our servers is encrypted using TLS 1.3.',
      'Data at rest is encrypted using AES-256.',
      'Banking credentials are never stored or processed by FinTrack — they are handled exclusively by our third-party aggregation provider.',
      'Access to user data within FinTrack is restricted on a need-to-know basis and subject to strict access controls.',
      'We undergo periodic security reviews and vulnerability assessments.',
    ],
    footer:
      'Despite our best efforts, no method of transmission or storage is 100% secure. If you believe your account has been compromised, please contact us immediately at security@fintrack.live.',
  },
  {
    id: 'data-retention',
    title: '5. Data Retention',
    items: [
      'Active accounts: your data is retained for as long as your account remains active.',
      'Cancelled or deleted accounts: personal data is deleted within 90 days of account closure, except where retention is required by law.',
      'Anonymised aggregate data may be retained indefinitely for product analytics.',
      'Backup copies are purged within 30 days of the standard deletion cycle.',
    ],
  },
  {
    id: 'your-rights',
    title: '6. Your Rights & Choices',
    content: [
      'Depending on your jurisdiction, you may have the following rights regarding your personal data:',
    ],
    items: [
      'Access: request a copy of the personal data we hold about you.',
      'Correction: request that we correct inaccurate or incomplete data.',
      'Deletion: request that we delete your personal data, subject to legal obligations.',
      'Portability: receive your data in a structured, machine-readable format.',
      'Objection: object to certain types of processing, including direct marketing.',
      'Withdrawal of consent: where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing.',
    ],
    footer:
      'To exercise any of these rights, please email privacy@fintrack.live. We will respond within 30 days.',
  },
  {
    id: 'cookies',
    title: '7. Cookies & Tracking Technologies',
    content: ['We use the following types of cookies:'],
    items: [
      'Essential cookies: required for the Service to function (e.g., session management, CSRF protection). These cannot be disabled.',
      'Analytics cookies: help us understand how users interact with the Service so we can improve it. You may opt out in your account settings.',
      'Preference cookies: remember your settings (e.g., theme, language) across sessions.',
    ],
    footer:
      'You can control cookies through your browser settings. Disabling essential cookies may prevent parts of the Service from functioning correctly.',
  },
  {
    id: 'third-party',
    title: '8. Third-Party Services',
    content: [
      'The Service may contain links to third-party websites or integrate with third-party services (e.g., financial data providers, payment processors). These entities operate under their own privacy policies, and we are not responsible for their data practices.',
      'We encourage you to review the privacy policies of any third-party services you connect to through FinTrack.',
    ],
  },
  {
    id: 'childrens-privacy',
    title: "9. Children's Privacy",
    content: [
      'The Service is not directed to, and we do not knowingly collect personal data from, individuals under the age of 18. If we become aware that we have inadvertently collected data from a child, we will take prompt steps to delete it.',
      'If you believe we have collected data from a child, please contact us at privacy@fintrack.app.',
    ],
  },
  {
    id: 'international',
    title: '10. International Data Transfers',
    content: [
      'FinTrack may process and store your data on servers located outside your country of residence. By using the Service, you consent to the transfer of your data to these locations.',
      'Where required by applicable law, we implement appropriate safeguards (such as standard contractual clauses) to protect your data during international transfers.',
    ],
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    content: [
      'We may update this Privacy Policy periodically. When we make material changes, we will notify you by email or by displaying a prominent notice within the Service, and we will update the "Last updated" date.',
      'Your continued use of the Service after the effective date of the revised policy constitutes your acceptance of the changes.',
    ],
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    content: [
      'For privacy-related questions, requests, or concerns, please contact our Privacy team:',
    ],
    contactBlock: {
      email: 'privacy@fintrack.live',
      note: 'We aim to acknowledge all privacy enquiries within 5 business days and resolve them within 30 days.',
    },
  },
] as const;

export default function PrivacyPage() {
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
            <li className="text-text-secondary">Privacy Policy</li>
          </ol>
        </nav>

        <p className="text-overline text-primary mb-3">Legal</p>
        <h1 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Privacy Policy
        </h1>
        <p className="text-body text-text-tertiary mb-6">
          Last updated: <time dateTime="2026-03-01">{LAST_UPDATED}</time>
        </p>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          At FinTrack, your privacy matters. This policy explains what data we collect, why we
          collect it, and how we protect and use it.
        </p>
      </div>

      {/* Divider */}
      <div className="mx-auto mb-12 max-w-[800px] px-4 md:px-6">
        <div className="border-border-subtle border-t" />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[800px] px-4 md:px-6">
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="font-manrope text-text-primary mb-4 font-bold">{section.title}</h2>

              {'content' in section &&
                section.content?.map((paragraph, i) => (
                  <p key={i} className="text-body text-text-secondary mb-3 leading-relaxed">
                    {paragraph}
                  </p>
                ))}

              {'subsections' in section &&
                section.subsections?.map(({ heading, items }) => (
                  <div key={heading} className="mb-5">
                    <p className="text-body text-text-primary mb-2 font-semibold">{heading}</p>
                    <ul className="space-y-2" role="list">
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
                  </div>
                ))}

              {'items' in section && section.items && (
                <ul className="mt-3 space-y-2.5" role="list">
                  {section.items.map((item, i) => (
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

              {'footer' in section && section.footer && (
                <p className="text-body-sm text-text-tertiary mt-4 leading-relaxed italic">
                  {section.footer}
                </p>
              )}

              {'contactBlock' in section && section.contactBlock && (
                <div className="glass-card rounded-card border-border-subtle mt-4 inline-block border p-5">
                  <p className="text-body text-text-secondary">
                    Email:{' '}
                    <Link
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`mailto:${section.contactBlock.email}`}
                      className="text-primary hover:text-primary-light underline underline-offset-2 transition-colors"
                    >
                      {section.contactBlock.email}
                    </Link>
                  </p>
                  <p className="text-body-sm text-text-tertiary mt-2">
                    {section.contactBlock.note}
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="glass-card rounded-card border-border-subtle mt-16 mb-8 border p-6">
          <p className="text-body-sm text-text-secondary leading-relaxed">
            This Privacy Policy applies alongside our{' '}
            <Link
              href={STATIC_ROUTES.TERMS}
              className="text-primary hover:text-primary-light underline underline-offset-2 transition-colors"
            >
              Terms of Service
            </Link>
            . Together, these documents govern your relationship with FinTrack.
          </p>
        </div>
      </div>
    </StaticPageShell>
  );
}
