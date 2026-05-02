# Notification Service — Architecture & Implementation Guide

## What the Notification Service Is Responsible For

Sending all transactional emails. No service sends email directly — they publish
a BullMQ job, and the notification_service processor handles delivery. The
service is entirely queue-driven; it has no HTTP endpoints and no gRPC endpoints.

```
┌─────────────────────────────────────────────────────────────┐
│                    notification_service                     │
│                                                             │
│  TOKEN_NOTIFICATION_QUEUE      PAYMENT_QUEUE               │
│  ┌────────────────────────┐   ┌────────────────────────┐   │
│  │  TokenNotification     │   │  PaymentNotification   │   │
│  │     Processor          │   │     Processor          │   │
│  └──────────┬─────────────┘   └───────────┬────────────┘   │
│             │                             │                 │
│             └──────────┬──────────────────┘                 │
│                        │                                    │
│               NotificationService                          │
│               (23 email methods)                           │
│                        │                                   │
│                  @nestjs-modules/mailer                    │
│                  (Mailtrap SMTP transport)                  │
│                  Handlebars templates                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Why Queue-Driven, Not Direct gRPC

If services called notification_service via gRPC, a slow email provider or a
transient SMTP failure would block the caller's request. Email delivery is
not part of the critical path for any user action — it is a side effect.

BullMQ decouples delivery: the caller publishes and continues immediately. If
Mailtrap is temporarily unreachable, BullMQ retries the job when it recovers.
No user-facing request ever times out waiting for an email to send.

---

## Processor 1 — TokenNotification

Handles auth-lifecycle emails: verification, welcome, password flows, account
management, and recurring transaction summaries.

**Queue:** `TOKEN_NOTIFICATION_QUEUE`

| Job name | Email sent | Triggered by |
|---|---|---|
| `EMAIL_VERIFICATION_JOB` | OTP to verify email address | `auth_service` on register |
| `WELCOME_EMAIL_JOB` | Welcome message after email verified | `auth_service` on verifyEmail |
| `FORGOT_PASSWORD_EMAIL_JOB` | Password reset OTP | `auth_service` on forgotPassword |
| `PASSWORD_CHANGE_JOB` | Password changed confirmation | `auth_service` on resetPassword / changePassword |
| `EMAIL_CHANGE_JOB` | OTP sent to new email address | `auth_service` on initiateEmailChange |
| `EMAIL_CHANGED_JOB` | Security alert sent to old email | `auth_service` on initiateEmailChange |
| `ACCOUNT_DELETION_EMAIL_JOB` | Deletion scheduled notice | `auth_service` on deleteAccount |
| `RECURRING_TRANSACTIONS_EMAIL_JOB` | Summary of auto-created transactions | `scheduler_service` after recurring run |

---

## Processor 2 — PaymentNotification

Handles billing and subscription lifecycle emails.

**Queue:** `PAYMENT_QUEUE`

| Job name | Email sent | Triggered by |
|---|---|---|
| `CREATE_CHECKOUT_SESSION_JOB` | Subscription purchased confirmation | Stripe `checkout.session.completed` webhook |
| `INVOICE_PAID_JOB` | Invoice receipt | Stripe `invoice.paid` webhook |
| `INVOICE_PAYMENT_FAILED_JOB` | Payment failure alert | Stripe `invoice.payment_failed` webhook |
| `SUBSCRIPTION_ACTIVATED_JOB` | Subscription active confirmation | Stripe `customer.subscription.updated` webhook |
| `SUBSCRIPTION_DEACTIVATED_JOB` | Cancellation notice | `auth_service` on deleteAccount |
| `SUBSCRIPTION_DELETED_JOB` | Subscription ended notice | Stripe `customer.subscription.deleted` webhook |
| `NEW_USAGE_TRACKERS_CREATED_JOB` | Monthly usage reset notice | `scheduler_service` on usage tracker reset |

---

## Email Delivery — Mailtrap

All emails are sent via **Mailtrap** using `@nestjs-modules/mailer` with the
Handlebars template adapter.

```typescript
MailerModule.forRoot({
  transport: {
    host: 'sandbox.smtp.mailtrap.io',
    auth: { user: ..., pass: MAIL_TOKEN },
  },
  template: {
    dir: join(__dirname, 'templates'),
    adapter: new HandlebarsAdapter(),
  },
})
```

**Why Handlebars:** template logic (conditionals, loops) belongs in templates,
not in TypeScript. Handlebars lets the email HTML reference variables like
`{{firstName}}`, `{{otpCode}}`, `{{amount}}` passed from the job payload.

**Why Mailtrap:** development/staging emails go to the Mailtrap inbox, not real
addresses. This prevents accidentally spamming users during development. In
production, swap the transport to SendGrid, Resend, or AWS SES without changing
any service code — only the environment variables.

---

## NotificationService Methods

All 23 methods follow the same pattern: receive job payload, call
`this.mailerService.sendMail()` with the matching template and variables.

```
Auth emails (TokenNotification processor):
  sendVerificationEmail({ email, firstName, token })
  sendWelcomeEmail({ email, firstName })
  sendForgotPasswordEmail({ email, firstName, token })
  sendPasswordChangeEmail({ email, firstName })
  sendEmailChangeEmail({ email, firstName, token })
  sendEmailChangedEmail({ email, firstName })
  sendAccountDeletionEmail({ email, firstName, deletionDate })
  sendRecurringTransactionsEmail({ email, firstName, items[] })

Payment emails (PaymentNotification processor):
  sendCheckoutSessionEmail({ email, firstName, plan })
  sendInvoicePaidEmail({ email, firstName, amount, invoiceUrl })
  sendPaymentFailedEmail({ email, firstName })
  sendSubscriptionActivatedEmail({ email, firstName })
  sendSubscriptionCancelledEmail({ email, firstName })
  sendSubscriptionEndedEmail({ email, firstName })
  sendNewUsageTrackersCreatedEmail({ email, firstName, periodStart, periodEnd })
```

---

## Job Payload Contract

Each queue job carries the data the template needs. The contract between the
publisher and the processor is implicit — the job name determines which template
is used and which fields are required. Publishers must include all required fields.

Example — `EMAIL_VERIFICATION_JOB` payload:
```typescript
{
  email: string;
  firstName: string;
  token: string;   // the OTP code to display in the email
}
```

Example — `RECURRING_TRANSACTIONS_EMAIL_JOB` payload:
```typescript
{
  email: string;
  firstName: string;
  lastName: string;
  date: string;           // ISO timestamp of the run
  items: Array<{
    name: string;
    amount: string;
    frequency: string;
    type: string;
  }>;
}
```

---

## Environment Variables

```env
MAIL_TOKEN=...        # Mailtrap API token / SMTP password
MAIL_FROM=...         # From address (e.g. no-reply@fintrack.app)
```

---

## Implementation Order

### Step 1 — Auth emails

Build the `TokenNotification` processor and the 8 auth email methods first.
These are needed immediately when auth_service is built. Start with
`sendVerificationEmail` since registration is the first user action.

Deliverable: user receives verification OTP email after registering.

### Step 2 — Payment emails

Build the `PaymentNotification` processor and billing email methods when
payment_service and the Stripe webhook handler are ready.

Deliverable: user receives checkout confirmation and subscription emails.

### Step 3 — Recurring transactions email

Build `sendRecurringTransactionsEmail`. This requires scheduler_service's
recurring processor to be complete first, since that's the publisher.

---

## What to Ignore (Non-Goals)

- **Push notifications** — handled by `fcm` module in api_gateway via Firebase
- **In-app notifications** — handled by `activity` module in api_gateway
- **SMS** — not planned
- **Email templates served from a CMS** — templates are static Handlebars files;
  template management tooling is out of scope
- **Unsubscribe/preference management** — transactional emails only, no marketing
