import 'dotenv/config';
import { prisma } from '../src/client';
import { SplitStatus } from '../src/types';

async function main() {
  await prisma.$connect();

  const userId = 'cmn0mekfu0000g3rq3n94391h';

  const splitPayloads = [
    {
      id: 'seed_split_friday_night_out',
      name: 'Friday Night Out',
      amount: 20_000,
      status: SplitStatus.PARTIALLY_SETTLED,
      participants: [
        {
          name: 'Ada',
          email: 'ada@example.com',
          amount: 8_000,
          settlements: [
            {
              paidAmount: 3_000,
              paidAt: new Date('2026-04-03T20:00:00.000Z'),
            },
          ],
        },
        {
          name: 'Musa',
          email: 'musa@example.com',
          amount: 7_000,
          settlements: [
            {
              paidAmount: 5_000,
              paidAt: new Date('2026-04-04T12:30:00.000Z'),
            },
          ],
        },
        {
          name: 'Kemi',
          email: 'kemi@example.com',
          amount: 5_000,
        },
      ],
    },
    {
      id: 'seed_split_weekend_beach_house',
      name: 'Weekend Beach House',
      amount: 60_000,
      status: SplitStatus.OPEN,
      participants: [
        {
          name: 'Tobi',
          email: 'tobi@example.com',
          amount: 20_000,
        },
        {
          name: 'Femi',
          email: 'femi@example.com',
          amount: 20_000,
        },
        {
          name: 'Zainab',
          email: 'zainab@example.com',
          amount: 20_000,
        },
      ],
    },
    {
      id: 'seed_split_birthday_dinner',
      name: 'Birthday Dinner',
      amount: 15_000,
      status: SplitStatus.SETTLED,
      participants: [
        {
          name: 'Ife',
          email: 'ife@example.com',
          amount: 5_000,
          settlements: [
            {
              paidAmount: 2_500,
              paidAt: new Date('2026-04-05T19:10:00.000Z'),
            },
            {
              paidAmount: 2_500,
              paidAt: new Date('2026-04-06T08:00:00.000Z'),
            },
          ],
        },
        {
          name: 'Segun',
          email: 'segun@example.com',
          amount: 5_000,
          settlements: [
            {
              paidAmount: 5_000,
              paidAt: new Date('2026-04-05T21:00:00.000Z'),
            },
          ],
        },
        {
          name: 'Rita',
          email: 'rita@example.com',
          amount: 5_000,
          settlements: [
            {
              paidAmount: 5_000,
              paidAt: new Date('2026-04-06T10:40:00.000Z'),
            },
          ],
        },
      ],
    },
  ];

  for (const data of splitPayloads) {
    await prisma.$transaction(
      async (tx) => {
        const split = await tx.split.upsert({
          where: { id: data.id },
          create: {
            id: data.id,
            userId,
            name: data.name,
            amount: data.amount,
            status: data.status,
          },
          update: {
            userId,
            name: data.name,
            amount: data.amount,
            status: data.status,
          },
        });

        await tx.splitParticipant.deleteMany({
          where: { splitId: split.id },
        });

        if (!data.participants.length) return;

        await tx.splitParticipant.createMany({
          data: data.participants.map((participant) => ({
            splitId: split.id,
            name: participant.name,
            email: participant.email,
            amount: participant.amount,
          })),
        });

        const createdParticipants = await tx.splitParticipant.findMany({
          where: { splitId: split.id },
          select: { id: true, email: true },
        });

        const participantByEmail = new Map(
          createdParticipants.map((participant) => [participant.email, participant.id]),
        );

        const settlements = data.participants.flatMap((participant) => {
          const participantId = participantByEmail.get(participant.email);
          if (!participantId) return [];

          return (participant.settlements ?? []).map((settlement) => ({
            splitId: split.id,
            participantId,
            paidAmount: settlement.paidAmount,
            paidAt: settlement.paidAt,
          }));
        });

        if (!settlements.length) return;

        await tx.splitSettlement.createMany({
          data: settlements,
        });
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );
  }
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
