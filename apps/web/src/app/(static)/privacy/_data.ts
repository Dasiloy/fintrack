/**
 * Privacy Policy page — local data.
 *
 * All section content lives here so the policy can be updated without
 * touching any component or layout code. If the policy ever moves to a CMS
 * or headless service, only this file needs to change.
 */

export const LAST_UPDATED = 'March 1, 2026';
export const LAST_UPDATED_ISO = '2026-03-01';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subsection {
  heading: string;
  items: readonly string[];
}

export interface PrivacySection {
  id: string;
  title: string;
  content?: readonly string[];
  subsections?: readonly Subsection[];
  items?: readonly string[];
  footer?: string;
  contactBlock?: { email: string; note: string };
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const SECTIONS: PrivacySection[] = [
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
    footer: 'To exercise any of these rights, please email privacy@fintrack.live. We will respond within 30 days.',
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
    content: ['For privacy-related questions, requests, or concerns, please contact our Privacy team:'],
    contactBlock: {
      email: 'privacy@fintrack.live',
      note: 'We aim to acknowledge all privacy enquiries within 5 business days and resolve them within 30 days.',
    },
  },
];
