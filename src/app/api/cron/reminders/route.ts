import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReminder24h, sendReminder2h } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // 24h reminder window: reservations between now+23h and now+25h
  const reminder24hFrom = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const reminder24hTo   = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // 2h reminder window: reservations between now+1h30m and now+2h30m
  const reminder2hFrom = new Date(now.getTime() + 90  * 60 * 1000);
  const reminder2hTo   = new Date(now.getTime() + 150 * 60 * 1000);

  const activeStatuses = ['CONFIRMED', 'PENDING'] as const;

  // Fetch both batches in parallel
  const [pending24h, pending2h] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: { in: activeStatuses },
        date: { gte: reminder24hFrom, lte: reminder24hTo },
        reminder24hSentAt: null,
        confirmToken: { not: null },
        cancelToken:  { not: null },
      },
      include: { customer: true, restaurant: true },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: activeStatuses },
        date: { gte: reminder2hFrom, lte: reminder2hTo },
        reminder2hSentAt: null,
        cancelToken: { not: null },
      },
      include: { customer: true, restaurant: true },
    }),
  ]);

  let sent24h = 0;
  let sent2h = 0;

  // Send 24h reminders
  for (const r of pending24h) {
    if (!r.customer?.phone || !r.confirmToken || !r.cancelToken) continue;
    try {
      const ok = await sendReminder24h({
        phone: r.customer.phone,
        customerName: r.customer.name,
        restaurantName: r.restaurant.name,
        date: r.date,
        partySize: r.partySize,
        confirmToken: r.confirmToken,
        cancelToken: r.cancelToken,
      });
      if (ok) {
        await prisma.reservation.update({
          where: { id: r.id },
          data: { reminder24hSentAt: new Date() },
        });
        sent24h++;
      }
    } catch (err) {
      console.error(`[Cron] 24h reminder failed for reservation ${r.id}:`, err);
    }
  }

  // Send 2h reminders
  for (const r of pending2h) {
    if (!r.customer?.phone || !r.cancelToken) continue;
    try {
      const ok = await sendReminder2h({
        phone: r.customer.phone,
        customerName: r.customer.name,
        restaurantName: r.restaurant.name,
        date: r.date,
        partySize: r.partySize,
        cancelToken: r.cancelToken,
      });
      if (ok) {
        await prisma.reservation.update({
          where: { id: r.id },
          data: { reminder2hSentAt: new Date() },
        });
        sent2h++;
      }
    } catch (err) {
      console.error(`[Cron] 2h reminder failed for reservation ${r.id}:`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    sent24h,
    sent2h,
    checked24h: pending24h.length,
    checked2h: pending2h.length,
    timestamp: now.toISOString(),
  });
}
