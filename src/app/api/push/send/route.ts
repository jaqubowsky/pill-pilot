import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/shared/db/client'
import { notificationSettings, pushSubscriptions, timeBlocks } from '@/shared/db/schema'
import { sendPushNotification } from '@/shared/lib/web-push'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const settings = await db
    .select({
      userId: notificationSettings.userId,
      timeBlockName: timeBlocks.name,
      notifyAt: notificationSettings.notifyAt,
    })
    .from(notificationSettings)
    .innerJoin(timeBlocks, eq(notificationSettings.timeBlockId, timeBlocks.id))
    .where(eq(notificationSettings.enabled, true))

  const matchingSettings = settings.filter((s) => s.notifyAt === currentTime)

  let sent = 0
  let failed = 0

  for (const setting of matchingSettings) {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, setting.userId))

    for (const sub of subscriptions) {
      try {
        await sendPushNotification(sub.subscriptionJson, {
          title: 'PillPilot',
          body: `Czas na suplementy: ${setting.timeBlockName}`,
        })
        sent++
      } catch {
        failed++
      }
    }
  }

  return NextResponse.json({ sent, failed, matched: matchingSettings.length })
}
