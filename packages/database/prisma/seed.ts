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

  // lets use prisma db transaction to load the currencies and locales
  await prisma.$transaction([
    prisma.locale.createMany({ data: localePyload, skipDuplicates: true }),
    prisma.currencies.createMany({ data: currencyPyload, skipDuplicates: true }),
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
