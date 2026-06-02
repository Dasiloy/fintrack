/**
 * Privacy Policy page — local data.
 *
 * All section content lives here so the policy can be updated without
 * touching any component or layout code. If the policy ever moves to a CMS
 * or headless service, only this file needs to change.
 */

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_FINTRACK_SUPPORT_EMAIL!;

export const LAST_UPDATED = 'June 2, 2026';
export const LAST_UPDATED_ISO = '2026-06-02';

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
          'When you connect a Nigerian bank or financial account, our third-party data provider retrieves account balances, transaction history, and institution details on your behalf.',
          'FinTrack never receives or stores your banking credentials. All credential handling is performed exclusively by the data aggregation provider.',
          'All financial data within the platform is denominated in Nigerian Naira (₦).',
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
      'To comply with applicable legal and regulatory obligations, including the Nigeria Data Protection Act 2023 (NDPA) and directives from the Nigerian Data Protection Commission (NDPC).',
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
      'Financial data aggregators: with your explicit authorisation, to retrieve your Nigerian financial account information.',
      'Payment processors: billing data (excluding raw card details) is shared with Paystack to process NGN subscription payments.',
      'Legal requirements: when we believe in good faith that disclosure is required by applicable Nigerian law, regulation, legal process, or enforceable governmental request.',
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
    footer: `Despite our best efforts, no method of transmission or storage is 100% secure. If you believe your account has been compromised, please contact us immediately at ${SUPPORT_EMAIL}.`,
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
      'As a user, particularly under the Nigeria Data Protection Act 2023 (NDPA), you have the following rights regarding your personal data:',
    ],
    items: [
      'Access: request a copy of the personal data we hold about you.',
      'Correction: request that we correct inaccurate or incomplete data.',
      'Deletion: request that we delete your personal data, subject to legal retention obligations.',
      'Portability: receive your data in a structured, machine-readable format.',
      'Objection: object to certain types of processing, including direct marketing.',
      'Withdrawal of consent: where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing.',
    ],
    footer: `To exercise any of these rights, please email ${SUPPORT_EMAIL}. We will respond within 30 days as required under the NDPA.`,
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
      'The Service integrates with third-party providers to function. Key providers include: Paystack (NGN payment processing), Mono (Nigerian open banking), Firebase (push notifications), and AI model providers for insights generation. These entities operate under their own privacy policies, and we are not responsible for their data practices.',
      'We encourage you to review the privacy policies of any third-party services you connect to through FinTrack.',
    ],
  },
  {
    id: 'geographic',
    title: '9. Geographic Scope & Limitations',
    content: [
      'FinTrack is designed for and primarily serves users in Nigeria. The following limitations apply based on geographic location:',
    ],
    items: [
      'The free tier of FinTrack is accessible globally. Users outside Nigeria may create an account and use free features.',
      'Paid (Pro) subscriptions are currently only available to users in Nigeria, as billing is processed in Nigerian Naira (₦) via Paystack.',
      'Bank account connectivity via open banking is currently only available for Nigerian financial institutions.',
      'All monetary tracking, budgets, and financial data within the platform are denominated in ₦. Multi-currency support is not currently available.',
      'Users outside Nigeria who wish to be notified when Pro subscriptions become available in their region may contact us at the address below.',
    ],
  },
  {
    id: 'childrens-privacy',
    title: "10. Children's Privacy",
    content: [
      'The Service is not directed to, and we do not knowingly collect personal data from, individuals under the age of 18. If we become aware that we have inadvertently collected data from a child, we will take prompt steps to delete it.',
      `If you believe we have collected data from a child, please contact us at ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    id: 'international',
    title: '11. International Data Transfers',
    content: [
      'While FinTrack primarily serves Nigerian users, our infrastructure providers (cloud hosting, AI services) may process data on servers located outside Nigeria. Where such transfers occur, we ensure appropriate safeguards are in place consistent with the requirements of the Nigeria Data Protection Act 2023.',
      'By using the Service, you acknowledge and consent to the transfer of your data to these processing locations for the sole purpose of service delivery.',
    ],
  },
  {
    id: 'changes',
    title: '12. Changes to This Policy',
    content: [
      'We may update this Privacy Policy periodically. When we make material changes, we will notify you by email or by displaying a prominent notice within the Service, and we will update the "Last updated" date.',
      'Your continued use of the Service after the effective date of the revised policy constitutes your acceptance of the changes.',
    ],
  },
  {
    id: 'contact',
    title: '13. Contact Us',
    content: ['For privacy-related questions, requests, or concerns, please contact our Privacy team:'],
    contactBlock: {
      email: SUPPORT_EMAIL,
      note: 'We aim to acknowledge all privacy enquiries within 5 business days and resolve them within 30 days, in accordance with the Nigeria Data Protection Act 2023.',
    },
  },
];
