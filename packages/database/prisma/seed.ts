import 'dotenv/config';
import { prisma } from '../src/client';

const SYSTEM_CATEGORIES = [
  {
    name: 'Food & Groceries',
    slug: 'cat-food',
    color: '#F97316',
    description: 'Restaurants, fast food, food delivery, supermarkets, and household consumables.',
    icon: '',
    tags: [
      'food', 'dining', 'restaurant', 'fast food', 'takeaway', 'delivery',
      'meal', 'snack', 'drinks', 'cafe', 'coffee', 'kitchen', 'bukka',
      'eatery', 'grill', 'chop', 'pizza', 'burger', 'suya', 'canteen',
      'bakery', 'pastry', 'ice cream', 'juice', 'smoothie',
      'groceries', 'supermarket', 'market', 'foodstuff', 'provisions',
      'shoprite', 'spar', 'justrite', 'hubmart', 'park n shop',
      'household', 'toiletries', 'cleaning', 'detergent', 'consumables',
    ],
  },
  {
    name: 'Income',
    slug: 'cat-income',
    color: '#4ADE80',
    description: 'Salary, freelance payments, transfers received, refunds, and all inflows.',
    icon: '',
    tags: [
      'income', 'salary', 'wage', 'freelance', 'credit', 'refund',
      'cashback', 'bonus', 'commission', 'dividend', 'interest',
      'received', 'inflow', 'proceeds', 'grant', 'allowance', 'stipend',
      'transfer in', 'payment received', 'settlement', 'payout',
    ],
  },
  {
    name: 'Transport',
    slug: 'cat-transport',
    color: '#3B82F6',
    description: 'Ride-hailing, fuel, public transport, flights, and logistics.',
    icon: '',
    tags: [
      'transport',
      'uber',
      'bolt',
      'taxify',
      'ride',
      'fuel',
      'petrol',
      'diesel',
      'bus',
      'taxi',
      'keke',
      'okada',
      'fare',
      'toll',
      'logistics',
      'shipping',
      'courier',
      'flight',
      'airfare',
      'travel',
      'commute',
      'parking',
      'train',
      'ferry',
      'dispatch',
    ],
  },
  {
    name: 'Bills & Utilities',
    slug: 'cat-bills-utilities',
    color: '#06B6D4',
    description: 'Electricity, water, internet, airtime, cable TV, and rent.',
    icon: '',
    tags: [
      'bills',
      'utilities',
      'electricity',
      'nepa',
      'phcn',
      'water',
      'internet',
      'wifi',
      'broadband',
      'airtime',
      'data',
      'cable',
      'dstv',
      'gotv',
      'startimes',
      'rent',
      'service charge',
      'waste',
      'ikedc',
      'ekedc',
      'aedc',
      'phed',
      'kedco',
      'ibedc',
      'spectranet',
      'swift',
      'mtn',
      'airtel',
      'glo',
      '9mobile',
      'prepaid',
      'token',
    ],
  },
  {
    name: 'Shopping & Retail',
    slug: 'cat-shopping',
    color: '#F59E0B',
    description: 'Clothing, electronics, online stores, and general retail.',
    icon: '',
    tags: [
      'shopping',
      'retail',
      'clothing',
      'fashion',
      'electronics',
      'gadgets',
      'jumia',
      'konga',
      'jiji',
      'slot',
      'store',
      'mall',
      'market',
      'accessories',
      'appliances',
      'hardware',
      'purchase',
      'order',
      'delivery',
      'online',
      'ecommerce',
      'shoes',
      'bags',
    ],
  },
  {
    name: 'Healthcare',
    slug: 'cat-healthcare',
    color: '#EF4444',
    description: 'Hospitals, pharmacies, lab tests, and personal care.',
    icon: '',
    tags: [
      'healthcare',
      'hospital',
      'clinic',
      'pharmacy',
      'drugs',
      'medical',
      'doctor',
      'dentist',
      'health',
      'wellness',
      'lab',
      'test',
      'surgery',
      'beauty',
      'salon',
      'spa',
      'cosmetics',
      'grooming',
      'hygiene',
      'medplus',
      'healthplus',
      'reddington',
      'prescription',
    ],
  },
  {
    name: 'Entertainment',
    slug: 'cat-entertainment',
    color: '#EC4899',
    description: 'Streaming, movies, events, sports betting, and leisure.',
    icon: '',
    tags: [
      'entertainment',
      'cinema',
      'movie',
      'netflix',
      'spotify',
      'streaming',
      'games',
      'event',
      'concert',
      'ticket',
      'club',
      'nightlife',
      'betting',
      'gambling',
      'sport',
      'fun',
      'leisure',
      'music',
      'showmax',
      'audiomack',
      'boomplay',
      'bet9ja',
      'sportybet',
      '1xbet',
      'naira bet',
      'subscription',
      'disney',
      'apple tv',
    ],
  },
  {
    name: 'Education',
    slug: 'cat-education',
    color: '#10B981',
    description: 'School fees, exams, courses, and educational materials.',
    icon: '',
    tags: [
      'education',
      'school',
      'tuition',
      'fees',
      'university',
      'college',
      'course',
      'training',
      'books',
      'stationery',
      'learning',
      'exam',
      'waec',
      'jamb',
      'neco',
      'tutorial',
      'lesson',
      'scholarship',
      'coursera',
      'udemy',
      'british council',
      'institution',
    ],
  },
  {
    name: 'Savings & Investments',
    slug: 'cat-savings',
    color: '#14B8A6',
    description: 'Savings goals, investments, insurance, and loan repayments.',
    icon: '',
    tags: [
      'savings',
      'investment',
      'insurance',
      'loan',
      'mortgage',
      'repayment',
      'piggyvest',
      'cowrywise',
      'risevest',
      'stocks',
      'crypto',
      'pension',
      'retirement',
      'deposit',
      'contribution',
      'stash',
      'treasury',
      'mutual fund',
      'bonds',
      'interest',
      'principal',
      'premium',
    ],
  },
  {
    name: 'Miscellaneous',
    slug: 'cat-misc',
    color: '#94A3B8',
    description: 'Bank charges, taxes, fees, and everything else.',
    icon: '',
    tags: [
      'misc',
      'general',
      'other',
      'fees',
      'charges',
      'bank charge',
      'tax',
      'government',
      'atm',
      'withdrawal',
      'cash',
      'sms',
      'maintenance',
      'penalty',
      'fine',
      'levy',
      'stamp duty',
      'commission',
      'vat',
      'transfer charge',
      'processing fee',
    ],
  },
];

const MERCHANTS = [
  // ─── Food & Dining ───────────────────────────────────────────────────────
  {
    name: 'KFC',
    aliases: ['KFC', 'KENTUCKY FRIED CHICKEN', 'KENTUCKY'],
    categoryHint: 'food dining restaurant fast chicken',
  },
  {
    name: 'CHICKEN REPUBLIC',
    aliases: ['CHICKEN REPUBLIC', 'CHICK REPUBLIC', 'CHICKENREPUBLIC'],
    categoryHint: 'food dining restaurant fast chicken',
  },
  {
    name: 'DOMINOS PIZZA',
    aliases: ['DOMINOS', "DOMINO'S", 'DOMINOES PIZZA', 'DOMINOS PIZZA'],
    categoryHint: 'food dining pizza restaurant',
  },
  {
    name: 'MR BIGGS',
    aliases: ['MR BIGGS', 'MRBIGGS', 'MR. BIGGS', 'UAC RESTAURANTS'],
    categoryHint: 'food dining restaurant fast',
  },
  {
    name: 'KILIMANJARO',
    aliases: ['KILIMANJARO', 'KILIMANJARO RESTAURANT', 'KILIMANJARO NIGERIA'],
    categoryHint: 'food dining restaurant',
  },
  {
    name: 'SWEET SENSATION',
    aliases: ['SWEET SENSATION', 'SWEET SENSATIONS', 'SWEETSENSATION'],
    categoryHint: 'food dining bakery pastry',
  },
  {
    name: 'THE PLACE RESTAURANT',
    aliases: ['THE PLACE', 'THE PLACE RESTAURANT', 'THEPLACE'],
    categoryHint: 'food dining restaurant',
  },
  {
    name: 'TANTALIZERS',
    aliases: ['TANTALIZERS', 'TANTALIZER'],
    categoryHint: 'food dining restaurant fast',
  },
  {
    name: 'COLD STONE CREAMERY',
    aliases: ['COLDSTONE', 'COLD STONE', 'COLDSTONE CREAMERY', 'COLD STONE CREAMERY'],
    categoryHint: 'food dining ice cream snack',
  },
  {
    name: 'CHOWDECK',
    aliases: ['CHOWDECK', 'CHOW DECK', 'CHOWDECK LOGISTICS'],
    categoryHint: 'food delivery dining',
  },
  {
    name: 'JUMIA FOOD',
    aliases: ['JUMIA FOOD', 'JUMIAFOOD', 'HELLOFOOD'],
    categoryHint: 'food delivery dining',
  },
  {
    name: 'BOLT FOOD',
    aliases: ['BOLT FOOD', 'BOLTFOOD', 'BOLT FOOD NIGERIA'],
    categoryHint: 'food delivery dining',
  },
  {
    name: 'GLOVO',
    aliases: ['GLOVO', 'GLOVOAPP', 'GLOVO NIGERIA'],
    categoryHint: 'food delivery dining transport',
  },
  {
    name: 'BARCELOS',
    aliases: ['BARCELOS', 'BARCELOS NIGERIA'],
    categoryHint: 'food dining restaurant',
  },
  {
    name: 'TASTEE FRIED CHICKEN',
    aliases: ['TASTEE', 'TASTEE FRIED CHICKEN', 'TFC'],
    categoryHint: 'food dining restaurant fast chicken',
  },

  // ─── Groceries & Supermarkets ────────────────────────────────────────────
  {
    name: 'SHOPRITE',
    aliases: ['SHOPRITE', 'SHOPRITE NIGERIA', 'SHOPRITE CHECKERS'],
    categoryHint: 'groceries supermarket retail food',
  },
  {
    name: 'SPAR NIGERIA',
    aliases: ['SPAR', 'SPAR NIGERIA', 'SPAR SUPERMARKET'],
    categoryHint: 'groceries supermarket retail',
  },
  {
    name: 'JUSTRITE SUPERSTORE',
    aliases: ['JUSTRITE', 'JUST RITE', 'JUSTRITE SUPERSTORE'],
    categoryHint: 'groceries supermarket retail',
  },
  {
    name: 'HUBMART',
    aliases: ['HUBMART', 'HUB MART', 'PARK N SHOP', 'ARTEE INDUSTRIES'],
    categoryHint: 'groceries supermarket retail',
  },

  // ─── Transport ───────────────────────────────────────────────────────────
  {
    name: 'UBER',
    aliases: ['UBER', 'UBER NIGERIA', 'UBER BV', 'UBER TRIP'],
    categoryHint: 'transport ride uber',
  },
  {
    name: 'BOLT',
    aliases: ['BOLT', 'TAXIFY', 'BOLT TECHNOLOGY', 'BOLT NIGERIA'],
    categoryHint: 'transport ride bolt',
  },
  {
    name: 'TOTAL ENERGIES',
    aliases: ['TOTAL', 'TOTALENERGIES', 'TOTAL NIGERIA', 'TOTAL ENERGIES'],
    categoryHint: 'transport fuel petrol diesel',
  },
  {
    name: 'ARDOVA PETROLEUM',
    aliases: ['ARDOVA', 'AP PETROLEUM', 'ARDOVA PLC', 'FYNDFUEL ARDOVA'],
    categoryHint: 'transport fuel petrol',
  },
  {
    name: 'OANDO',
    aliases: ['OANDO', 'OANDO PLC', 'OANDO FUEL'],
    categoryHint: 'transport fuel petrol diesel',
  },
  {
    name: 'MRS OIL',
    aliases: ['MRS OIL', 'MRS PETROLEUM', 'MRS OIL NIGERIA'],
    categoryHint: 'transport fuel petrol',
  },
  {
    name: 'MOBIL OIL',
    aliases: ['MOBIL', 'EXXONMOBIL', 'MOBIL OIL NIGERIA', 'MOBIL PETROLEUM'],
    categoryHint: 'transport fuel petrol diesel',
  },
  {
    name: 'CONOIL',
    aliases: ['CONOIL', 'CONOIL PLC', 'CONOIL PETROLEUM'],
    categoryHint: 'transport fuel petrol',
  },
  {
    name: 'NIPCO',
    aliases: ['NIPCO', 'NIPCO GAS', 'NIPCO PETROLEUM'],
    categoryHint: 'transport fuel petrol gas',
  },

  // ─── Bills & Utilities — Telecom ─────────────────────────────────────────
  {
    name: 'MTN NIGERIA',
    aliases: ['MTN', 'MTN NIGERIA', 'MTN AIRTIME', 'MTN DATA', 'MTN VTU', 'MTN RECHARGE'],
    categoryHint: 'bills utilities airtime data phone',
  },
  {
    name: 'AIRTEL NIGERIA',
    aliases: ['AIRTEL', 'AIRTEL NIGERIA', 'AIRTEL AIRTIME', 'AIRTEL DATA'],
    categoryHint: 'bills utilities airtime data phone',
  },
  {
    name: 'GLO MOBILE',
    aliases: ['GLO', 'GLOBACOM', 'GLO MOBILE', 'GLO AIRTIME'],
    categoryHint: 'bills utilities airtime data phone',
  },
  {
    name: '9MOBILE',
    aliases: ['9MOBILE', 'ETISALAT', '9MOBILE NIGERIA', 'ETISALAT NIGERIA'],
    categoryHint: 'bills utilities airtime data phone',
  },

  // ─── Bills & Utilities — Cable TV ────────────────────────────────────────
  {
    name: 'MULTICHOICE NIGERIA',
    aliases: ['DSTV', 'GOTV', 'MULTICHOICE', 'MULTICHOICE NIGERIA', 'DSTV SUBSCRIPTION'],
    categoryHint: 'bills utilities entertainment cable tv dstv gotv',
  },
  {
    name: 'STARTIMES',
    aliases: ['STARTIMES', 'STAR TIMES', 'STARTIMES NIGERIA'],
    categoryHint: 'bills utilities entertainment cable tv',
  },

  // ─── Bills & Utilities — Electricity DISCOs ──────────────────────────────
  {
    name: 'IKEJA ELECTRIC',
    aliases: ['IKEDC', 'IKEJA ELECTRIC', 'IKEDC PREPAID', 'IKEJA DISCO'],
    categoryHint: 'bills utilities electricity nepa phcn',
  },
  {
    name: 'EKO ELECTRICITY',
    aliases: ['EKEDC', 'EKO ELECTRICITY', 'EKEDC PREPAID', 'EKO DISCO'],
    categoryHint: 'bills utilities electricity nepa phcn',
  },
  {
    name: 'ABUJA ELECTRICITY',
    aliases: ['AEDC', 'ABUJA ELECTRICITY', 'AEDC PREPAID', 'ABUJA DISCO'],
    categoryHint: 'bills utilities electricity nepa phcn',
  },
  {
    name: 'PORT HARCOURT ELECTRICITY',
    aliases: ['PHED', 'PORT HARCOURT ELECTRICITY', 'PHED PREPAID'],
    categoryHint: 'bills utilities electricity nepa phcn',
  },
  {
    name: 'KANO ELECTRICITY',
    aliases: ['KEDCO', 'KANO ELECTRICITY', 'KEDCO PREPAID'],
    categoryHint: 'bills utilities electricity nepa phcn',
  },
  {
    name: 'IBADAN ELECTRICITY',
    aliases: ['IBEDC', 'IBADAN ELECTRICITY', 'IBEDC PREPAID', 'IBADAN DISCO'],
    categoryHint: 'bills utilities electricity nepa phcn',
  },
  {
    name: 'BENIN ELECTRICITY',
    aliases: ['BEDC', 'BENIN ELECTRICITY', 'BEDC PREPAID'],
    categoryHint: 'bills utilities electricity nepa phcn',
  },

  // ─── Bills & Utilities — Internet ISPs ───────────────────────────────────
  {
    name: 'SPECTRANET',
    aliases: ['SPECTRANET', 'SPECTRANET INTERNET', 'SPECTRANET LIMITED'],
    categoryHint: 'bills utilities internet broadband wifi',
  },
  {
    name: 'SWIFT NETWORKS',
    aliases: ['SWIFT NETWORKS', 'SWIFT', 'SWIFT INTERNET'],
    categoryHint: 'bills utilities internet broadband',
  },
  {
    name: 'SMILE COMMUNICATIONS',
    aliases: ['SMILE', 'SMILE COMMUNICATIONS', 'SMILECOMS'],
    categoryHint: 'bills utilities internet broadband data',
  },

  // ─── Shopping & Retail ───────────────────────────────────────────────────
  {
    name: 'JUMIA NIGERIA',
    aliases: ['JUMIA', 'JUMIA NIGERIA', 'JUMIA.COM.NG', 'JUMIA ONLINE'],
    categoryHint: 'shopping retail online ecommerce',
  },
  {
    name: 'KONGA',
    aliases: ['KONGA', 'KONGA.COM', 'KONGA ONLINE', 'KONGA NIGERIA'],
    categoryHint: 'shopping retail online ecommerce',
  },
  {
    name: 'SLOT SYSTEMS',
    aliases: ['SLOT', 'SLOT SYSTEMS', 'SLOT NIGERIA', 'SLOT LIMITED'],
    categoryHint: 'shopping retail electronics gadgets',
  },

  // ─── Healthcare ──────────────────────────────────────────────────────────
  {
    name: 'HEALTHPLUS PHARMACY',
    aliases: ['HEALTHPLUS', 'HEALTH PLUS', 'HEALTHPLUS PHARMACY'],
    categoryHint: 'healthcare pharmacy drugs medical',
  },
  {
    name: 'MEDPLUS PHARMACY',
    aliases: ['MEDPLUS', 'MED PLUS', 'MEDPLUS PHARMACY'],
    categoryHint: 'healthcare pharmacy drugs medical',
  },
  {
    name: 'REDDINGTON HOSPITAL',
    aliases: ['REDDINGTON', 'REDDINGTON HOSPITAL', 'REDDINGTON MULTISPECIALIST'],
    categoryHint: 'healthcare hospital medical',
  },
  {
    name: 'LAGOON HOSPITALS',
    aliases: ['LAGOON HOSPITAL', 'LAGOON HOSPITALS', 'LAGOON HOSPITAL GROUP'],
    categoryHint: 'healthcare hospital medical',
  },

  // ─── Entertainment & Betting ─────────────────────────────────────────────
  {
    name: 'NETFLIX',
    aliases: ['NETFLIX', 'NETFLIX.COM', 'NETFLIX SUBSCRIPTION'],
    categoryHint: 'entertainment streaming subscription',
  },
  {
    name: 'SHOWMAX',
    aliases: ['SHOWMAX', 'SHOWMAX NIGERIA', 'SHOWMAX SUBSCRIPTION'],
    categoryHint: 'entertainment streaming subscription',
  },
  {
    name: 'SPOTIFY',
    aliases: ['SPOTIFY', 'SPOTIFY AB', 'SPOTIFY SUBSCRIPTION'],
    categoryHint: 'entertainment streaming music subscription',
  },
  {
    name: 'BET9JA',
    aliases: ['BET9JA', 'SBTECH BET9JA', 'KC GAMING'],
    categoryHint: 'entertainment betting gambling sport',
  },
  {
    name: 'SPORTYBET',
    aliases: ['SPORTYBET', 'SPORTY BET', 'SPORTY', 'SPORTYBET NIGERIA'],
    categoryHint: 'entertainment betting gambling sport',
  },
  {
    name: '1XBET',
    aliases: ['1XBET', '1X BET', '1XBET NIGERIA', '1X CORP'],
    categoryHint: 'entertainment betting gambling sport',
  },
  {
    name: 'NAIRA BET',
    aliases: ['NAIRA BET', 'NAIRABET', 'NAIRABET NIGERIA'],
    categoryHint: 'entertainment betting gambling sport',
  },

  // ─── Fintech / Transfers ─────────────────────────────────────────────────
  {
    name: 'OPAY',
    aliases: ['OPAY', 'OPAY DIGITAL', 'O-PAY', 'PAYCOM'],
    categoryHint: 'transfer payment fintech',
  },
  {
    name: 'PALMPAY',
    aliases: ['PALMPAY', 'PALM PAY', 'TRANSSNET PALMPAY'],
    categoryHint: 'transfer payment fintech',
  },
  {
    name: 'FLUTTERWAVE',
    aliases: ['FLUTTERWAVE', 'FLUTTER WAVE', 'RAVE BY FLUTTERWAVE'],
    categoryHint: 'transfer payment fintech',
  },
  {
    name: 'PAYSTACK',
    aliases: ['PAYSTACK', 'PAY STACK', 'PAYSTACK PAYMENTS'],
    categoryHint: 'transfer payment fintech',
  },
  {
    name: 'MONIEPOINT',
    aliases: ['MONIEPOINT', 'MONIE POINT', 'MONIEPOINT MICROFINANCE'],
    categoryHint: 'transfer payment fintech',
  },
  {
    name: 'KUDA BANK',
    aliases: ['KUDA', 'KUDA BANK', 'KUDA MICROFINANCE'],
    categoryHint: 'transfer payment fintech savings',
  },

  // ─── Savings & Investments ───────────────────────────────────────────────
  {
    name: 'PIGGYVEST',
    aliases: ['PIGGYVEST', 'PIGGY VEST', 'PIGGYVEST INC', 'PIGGYBANK.NG'],
    categoryHint: 'savings investment',
  },
  {
    name: 'COWRYWISE',
    aliases: ['COWRYWISE', 'COWRY WISE', 'COWRYWISE FINANCIAL'],
    categoryHint: 'savings investment mutual fund',
  },
  {
    name: 'RISEVEST',
    aliases: ['RISEVEST', 'RISE VEST', 'RISE DIGITAL', 'RISE INVEST'],
    categoryHint: 'savings investment stocks',
  },
  {
    name: 'CHAKA',
    aliases: ['CHAKA', 'CHAKA.IO', 'CHAKA TECHNOLOGIES'],
    categoryHint: 'savings investment stocks',
  },
  {
    name: 'BAMBOO',
    aliases: ['BAMBOO', 'BAMBOO INVEST', 'BAMBOO SYSTEMS'],
    categoryHint: 'savings investment stocks',
  },
];

// ---------------------------------------------------------------------------

async function main() {
  await prisma.$connect();

  // Seed system categories
  console.log('Seeding system categories...');
  const { count: categoryCount } = await prisma.category.createMany({
    data: SYSTEM_CATEGORIES.map((c) => ({ ...c, isSystem: true })),
    skipDuplicates: true,
  });
  console.log(
    `  ✓ ${categoryCount} new system categories (${SYSTEM_CATEGORIES.length - categoryCount} already existed)`,
  );

  // Seed merchants
  console.log('Seeding merchants...');
  const { count: merchantCount } = await prisma.merchant.createMany({
    data: MERCHANTS,
    skipDuplicates: true,
  });
  console.log(
    `  ✓ ${merchantCount} new merchants (${MERCHANTS.length - merchantCount} already existed)`,
  );
}

main()
  .then(async () => {
    console.log('DB seed complete.');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
