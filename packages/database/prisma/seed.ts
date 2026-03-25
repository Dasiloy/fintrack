import 'dotenv/config';
import { prisma } from '../src/client';
import { Currency, Language } from '../src/types';

async function main() {
  void (await prisma.$connect());

  const localePyload = Object.keys(Language).map((key) => ({
    language: Language[key],
    label: key.replaceAll('_', ' '),
  }));

  const currencyPyload = Object.keys(Currency).map((key) => ({
    currency: Currency[key],
    label: key.replaceAll('_', ' '),
  }));

  const categoryPayload = [
    {
      name: 'Food',
      slug: 'cat-food',
      color: '#F97316',
      isSystem: true,
    },
    {
      name: 'Transport',
      slug: 'cat-transport',
      color: '#3B82F6',
      isSystem: true,
    },
    {
      name: 'Housing',
      slug: 'cat-housing',
      color: '#8B5CF6',
      isSystem: true,
    },
    {
      name: 'Shopping',
      slug: 'cat-shopping',
      color: '#EC4899',
      isSystem: true,
    },
    {
      name: 'Health',
      slug: 'cat-health',
      color: '#EF4444',
      isSystem: true,
    },
    {
      name: 'Utilities',
      slug: 'cat-utilities',
      color: '#06B6D4',
      isSystem: true,
    },
    {
      name: 'Income',
      slug: 'cat-income',
      color: '#00D9A5',
      isSystem: true,
    },
    {
      name: 'Miscellaneous',
      slug: 'cat-misc',
      color: '#A1A1AA',
      isSystem: true,
    },
  ];

  await Promise.all([
    prisma.locale.createMany({ data: localePyload, skipDuplicates: true }),
    prisma.currencies.createMany({ data: currencyPyload, skipDuplicates: true }),
    prisma.category.createMany({ data: categoryPayload, skipDuplicates: true }),
  ]);
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
