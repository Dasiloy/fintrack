import 'dotenv/config';
import { prisma } from '../src/client';

const SYSTEM_CATEGORIES = [
  { name: 'Food & Dining', slug: 'cat-food-dining', color: '#F97316' },
  { name: 'Groceries', slug: 'cat-groceries', color: '#22C55E' },
  { name: 'Transport', slug: 'cat-transport', color: '#3B82F6' },
  { name: 'Housing & Rent', slug: 'cat-housing', color: '#8B5CF6' },
  { name: 'Utilities', slug: 'cat-utilities', color: '#06B6D4' },
  { name: 'Healthcare', slug: 'cat-healthcare', color: '#EF4444' },
  { name: 'Entertainment', slug: 'cat-entertainment', color: '#EC4899' },
  { name: 'Shopping', slug: 'cat-shopping', color: '#F59E0B' },
  { name: 'Education', slug: 'cat-education', color: '#10B981' },
  { name: 'Savings & Investments', slug: 'cat-savings', color: '#14B8A6' },
  { name: 'Travel', slug: 'cat-travel', color: '#6366F1' },
  { name: 'Personal Care', slug: 'cat-personal-care', color: '#F472B6' },
  { name: 'Subscriptions', slug: 'cat-subscriptions', color: '#A78BFA' },
  { name: 'Insurance', slug: 'cat-insurance', color: '#64748B' },
  { name: 'Fitness & Sports', slug: 'cat-fitness', color: '#84CC16' },
  { name: 'Income', slug: 'cat-income', color: '#4ADE80' },
  { name: 'Gifts & Donations', slug: 'cat-gifts', color: '#FB923C' },
  { name: 'Business', slug: 'cat-business', color: '#2563EB' },
  { name: 'Taxes & Fees', slug: 'cat-taxes', color: '#DC2626' },
  { name: 'Miscellaneous', slug: 'cat-misc', color: '#94A3B8' },
];

async function main() {
  await prisma.$connect();

  console.log('Seeding system categories...');

  const { count } = await prisma.category.createMany({
    data: SYSTEM_CATEGORIES.map((c) => ({ ...c, isSystem: true })),
    skipDuplicates: true,
  });

  console.log(`Seeded ${count} new system categories (${SYSTEM_CATEGORIES.length - count} already existed).`);
}

main()
  .then(async () => {
    console.log('DB seed complete');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.log(error);
    await prisma.$disconnect();
    process.exit(1);
  });
