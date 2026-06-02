/**
 * Terms of Service page — local data.
 *
 * All section content lives here so the terms can be updated without
 * touching any component or layout code.
 */

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_FINTRACK_SUPPORT_EMAIL!;

export const LAST_UPDATED = 'June 2, 2026';
export const LAST_UPDATED_ISO = '2026-06-02';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TermsSection {
  id: string;
  title: string;
  content?: readonly string[];
  items?: readonly string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const SECTIONS: TermsSection[] = [
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
      'The Service is designed primarily for users managing finances in Nigerian Naira (₦). All monetary features, budgets, and financial tracking within the platform operate in NGN.',
      'The Service is provided for personal, non-commercial use only. FinTrack does not provide financial, investment, tax, or legal advice. Information displayed on the platform is for informational purposes only and should not be relied upon as professional financial guidance.',
    ],
  },
  {
    id: 'accounts',
    title: '3. User Accounts & Registration',
    items: [
      'You must provide accurate, current, and complete information when creating an account.',
      'You are solely responsible for safeguarding your account credentials and for all activity that occurs under your account.',
      `You must notify us immediately at ${SUPPORT_EMAIL} if you suspect any unauthorised use of your account.`,
      'One account per individual is permitted. You may not transfer or sell your account to another party.',
      'Accounts created using automated methods, bots, or scripts are strictly prohibited.',
    ],
  },
  {
    id: 'billing',
    title: '4. Subscription Plans & Billing',
    content: [
      'FinTrack offers a free tier with limited features and a paid subscription tier ("Pro") that unlocks additional functionality.',
    ],
    items: [
      'Paid (Pro) subscriptions are currently only available to users in Nigeria. Billing is processed in Nigerian Naira (₦) via Paystack.',
      'Subscriptions are billed in advance on a monthly or annual basis and automatically renew at the end of each billing period unless cancelled before the renewal date.',
      'You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period; no partial refunds are issued for unused time.',
      'We reserve the right to change subscription pricing with at least 30 days notice. Continued use after the notice period constitutes acceptance of the new pricing.',
      'If payment fails, we may suspend access to paid features until payment is resolved.',
      'Users outside Nigeria may use the free tier without restriction. Paid plan availability will be extended to additional African markets in future updates.',
    ],
  },
  {
    id: 'geographic',
    title: '5. Geographic Availability',
    content: [
      'The free tier of FinTrack is accessible globally. However, certain features — including Pro subscriptions and bank account connectivity — are currently limited to users in Nigeria.',
    ],
    items: [
      'Pro (paid) subscriptions are currently only available to users in Nigeria due to payment processing limitations.',
      'Bank account connection via open banking is currently only supported for Nigerian financial institutions.',
      'All financial tracking, budgets, and monetary values within the platform are denominated in Nigerian Naira (₦). The platform does not currently support multi-currency tracking.',
      'We are actively working to expand service availability to additional African markets. Users outside Nigeria who wish to be notified when Pro becomes available in their region may contact us.',
      'We reserve the right to restrict access to the Service or specific features based on geographic location at any time, particularly to comply with applicable laws and payment regulations.',
    ],
  },
  {
    id: 'acceptable-use',
    title: '6. Acceptable Use',
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
    title: '7. Financial Data & Third-Party Connections',
    content: [
      'The Service may allow you to connect your bank accounts and financial institutions via third-party data aggregation providers. By connecting an account, you authorise FinTrack to retrieve and display financial information on your behalf. Bank connectivity is currently available for Nigerian financial institutions only.',
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
    title: '8. Intellectual Property',
    content: [
      'The Service and all associated content, features, and functionality — including but not limited to software, design, text, graphics, and logos — are the exclusive property of FinTrack and are protected by applicable intellectual property laws.',
      'Your financial data belongs to you. By using the Service, you grant FinTrack a limited, non-exclusive, royalty-free licence to process, store, and display your data solely for the purpose of providing the Service to you. We do not sell your data.',
      'You may not copy, modify, distribute, sell, or lease any part of the Service or its content without our prior written consent.',
    ],
  },
  {
    id: 'privacy',
    title: '9. Privacy',
    content: [
      'Your use of the Service is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you agree to the collection and use of information as described in the Privacy Policy.',
    ],
  },
  {
    id: 'disclaimers',
    title: '10. Disclaimers of Warranties',
    content: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.',
      'We do not warrant that the Service will be uninterrupted, error-free, or free from viruses or other harmful components. We do not warrant the accuracy or completeness of any financial data displayed through the Service.',
    ],
  },
  {
    id: 'liability',
    title: '11. Limitation of Liability',
    content: [
      'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FINTRACK AND ITS DIRECTORS, EMPLOYEES, PARTNERS, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.',
      'Our total cumulative liability to you for any claim arising from or relating to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.',
    ],
  },
  {
    id: 'termination',
    title: '12. Termination',
    content: [
      'You may delete your account at any time from your account settings. Upon deletion, your personal data will be removed in accordance with our Privacy Policy.',
      'We reserve the right to suspend or permanently terminate your account, without prior notice or liability, if we determine that you have violated these Terms or engaged in conduct harmful to other users, third parties, or FinTrack.',
    ],
  },
  {
    id: 'changes',
    title: '13. Changes to These Terms',
    content: [
      'We may update these Terms from time to time. When we do, we will revise the "Last updated" date at the top of this page and, for material changes, notify you by email or by a prominent notice within the Service.',
      'Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.',
    ],
  },
  {
    id: 'governing-law',
    title: '14. Governing Law',
    content: [
      'These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023 (NDPA) and applicable regulations issued by the Federal Competition and Consumer Protection Commission (FCCPC). Any disputes arising under these Terms shall first be subject to good-faith negotiation, and thereafter to binding arbitration or the jurisdiction of a competent Nigerian court.',
    ],
  },
  {
    id: 'contact',
    title: '15. Contact Us',
    content: [
      `If you have questions about these Terms, please contact our legal team at ${SUPPORT_EMAIL}. We aim to respond to all enquiries within 5 business days.`,
    ],
  },
];
