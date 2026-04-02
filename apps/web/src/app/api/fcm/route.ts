import { auth } from '@/lib/nextauth';
import { NextResponse } from 'next/server';
import { prisma } from '@fintrack/database/client';
import dayjs from '@fintrack/utils/date';
import { consoleLogger } from '@fintrack/common/console_logger/index';

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const body = await request.json();
  const { fcmToken } = body;

  if (!fcmToken) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    // get 5 days ago
    const fiveDaysAgo = dayjs().subtract(5, 'day').toDate();

    // we want to delete tokens that are older than 5 days for this user
    await Promise.all([
      prisma.fcmDevice.deleteMany({
        where: {
          userId: session.user.id,
          createdAt: { lt: fiveDaysAgo },
        },
      }),
      prisma.fcmDevice.upsert({
        where: {
          userId_fcmToken: {
            userId: session.user.id,
            fcmToken,
          },
        },
        update: {}, // prisma will automatically update the updatedAt field
        create: { fcmToken, userId: session.user.id },
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    consoleLogger.error('fcm', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
