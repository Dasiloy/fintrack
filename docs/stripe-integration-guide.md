# Stripe Integration Guide - FinTrack Premium

## 🎯 Overview

Add Stripe subscription to monetize FinTrack with a premium tier.

**Free Tier:**

- 3 savings goals max
- Basic analytics
- CSV export only

**Premium Tier ($5/month):**

- Unlimited savings goals
- PDF reports (monthly spending + budget vs actual)
- Advanced analytics
- Priority support

---

## 📋 Implementation Steps

### **Day 75: Setup & Feature Gating**

#### 1. Create Stripe Account

```bash
# Sign up at stripe.com
# Get API keys from Dashboard
```

#### 2. Install Stripe

```bash
npm install stripe @stripe/stripe-js
npm install -D @types/stripe
```

#### 3. Add Environment Variables

```env
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 4. Update User Model

```prisma
// prisma/schema.prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  // ... existing fields

  // Stripe fields
  stripeCustomerId      String?  @unique
  stripeSubscriptionId  String?  @unique
  stripePriceId         String?
  stripeCurrentPeriodEnd DateTime?
  isPremium            Boolean  @default(false)
}
```

```bash
npx prisma migrate dev --name add_stripe_fields
```

#### 5. Create Stripe Product

```typescript
// scripts/create-stripe-product.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

async function createProduct() {
  // Create product
  const product = await stripe.products.create({
    name: "FinTrack Premium",
    description: "Unlimited goals, PDF reports, advanced analytics",
  });

  // Create price ($5/month)
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 500, // $5.00
    currency: "usd",
    recurring: {
      interval: "month",
    },
  });

  console.log("Product ID:", product.id);
  console.log("Price ID:", price.id); // Save this!
}

createProduct();
```

```bash
# Save the Price ID
STRIPE_PRICE_ID=price_...
```

#### 6. Feature Gating Utility

```typescript
// lib/stripe/feature-gating.ts
import { User } from "@prisma/client";

export const FEATURE_LIMITS = {
  FREE: {
    maxGoals: 3,
    pdfReports: false,
    advancedAnalytics: false,
  },
  PREMIUM: {
    maxGoals: Infinity,
    pdfReports: true,
    advancedAnalytics: true,
  },
};

export function getUserLimits(user: User) {
  return user.isPremium ? FEATURE_LIMITS.PREMIUM : FEATURE_LIMITS.FREE;
}

export function canCreateGoal(user: User, currentGoalsCount: number) {
  const limits = getUserLimits(user);
  return currentGoalsCount < limits.maxGoals;
}

export function canAccessPDFReports(user: User) {
  return user.isPremium;
}
```

---

### **Day 76: Stripe Checkout & Webhooks**

#### 1. Create Checkout Session API

```typescript
// app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Create or retrieve Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id,
      },
    });
    customerId = customer.id;

    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium`,
    metadata: {
      userId: user.id,
    },
  });

  return NextResponse.json({ sessionId: checkoutSession.id });
}
```

#### 2. Webhook Handler

```typescript
// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000,
            ),
            isPremium: true,
          },
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        await prisma.user.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000,
            ),
            isPremium: true,
          },
        });
      }
      break;
    }

    case "invoice.payment_failed":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.user.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          isPremium: false,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

#### 3. Premium Upgrade Button (Web)

```typescript
// components/premium-button.tsx
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function PremiumUpgradeButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);

    // Create checkout session
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
    });

    const { sessionId } = await res.json();

    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });

    setLoading(false);
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="bg-indigo-600 text-white px-6 py-3 rounded-lg"
    >
      {loading ? 'Loading...' : 'Upgrade to Premium - $5/month'}
    </button>
  );
}
```

#### 4. Premium Features UI Gating

```typescript
// app/goals/page.tsx
import { getUserLimits, canCreateGoal } from '@/lib/stripe/feature-gating';

export default async function GoalsPage() {
  const user = await getCurrentUser();
  const goals = await getGoals(user.id);
  const limits = getUserLimits(user);
  const canCreate = canCreateGoal(user, goals.length);

  return (
    <div>
      <h1>Savings Goals ({goals.length}/{limits.maxGoals})</h1>

      {!canCreate && (
        <div className="bg-yellow-50 p-4 rounded">
          <p>You've reached the limit for free accounts.</p>
          <PremiumUpgradeButton />
        </div>
      )}

      {/* Goals list */}
    </div>
  );
}
```

#### 5. Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy webhook secret to .env.local
# STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 6. Test Payment Flow

```
1. Click "Upgrade to Premium"
2. Use test card: 4242 4242 4242 4242
3. Expiry: Any future date
4. CVC: Any 3 digits
5. Check webhook logs
6. Verify user.isPremium = true in database
```

---

## 🎨 Premium Features Implementation

### PDF Reports (Premium Only)

```typescript
// app/api/reports/monthly/route.ts
import { canAccessPDFReports } from "@/lib/stripe/feature-gating";

export async function GET() {
  const user = await getCurrentUser();

  if (!canAccessPDFReports(user)) {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  // Generate PDF...
}
```

---

## 📱 Mobile (Expo)

Use **RevenueCat** or **in-app purchases** for mobile subscriptions (different from Stripe web).

**Week 11 Day 76:** Just add UI placeholder:

```dart
// Upgrade button in Expo
ElevatedButton(
  onPressed: () {
    // TODO: Implement in-app purchase
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Upgrade on Web'),
        content: Text('Please upgrade on web app'),
      ),
    );
  },
  child: Text('Upgrade to Premium'),
)
```

---

## ✅ Checklist

**Day 75:**

- [ ] Create Stripe account
- [ ] Install Stripe packages
- [ ] Add Stripe fields to User model
- [ ] Create Stripe product & price
- [ ] Implement feature gating logic

**Day 76:**

- [ ] Create checkout session API
- [ ] Implement webhook handler
- [ ] Add premium upgrade button
- [ ] Gate premium features
- [ ] Test with Stripe CLI
- [ ] Verify payment flow works

---

## 🎓 What You'll Learn

- Payment processing
- Subscription management
- Webhook handling
- Feature gating patterns
- Stripe API integration
- Testing payment flows

---

**Focus:** Learn Stripe integration, not build complex monetization. Keep it simple! 💳
