import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSupplementSummaries } from '@/features/protocol-wizard/api/queries/get-supplement-summaries'
import { getTimeBlockSummaries } from '@/features/protocol-wizard/api/queries/get-time-block-summaries'
import {
  getSharedProtocol,
  type SharedScheduleData,
} from '@/features/protocol-wizard/api/queries/get-shared-protocol'
import { matchShareSupplements } from '@/features/protocol-wizard/api/services/build-share-ai-content'
import { toIdentifiedSupplements } from '@/features/protocol-wizard/lib/supplement-serialization'
import { ImportProtocolPage } from '@/features/protocol-wizard/import-protocol-page'
import { auth } from '@/shared/lib/auth'
import type { ParsedSupplement } from '@/features/protocol-wizard/schemas/parsed-protocol-schema'

type Props = { params: Promise<{ token: string }> }

export default async function SharePage({ params }: Props) {
  const { token } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) notFound()

  const userId = session.user.id

  const [sharedProtocol, existingSupplements, recipientTimeBlocks] = await Promise.all([
    getSharedProtocol(token),
    getSupplementSummaries(userId),
    getTimeBlockSummaries(userId),
  ])

  if (!sharedProtocol) notFound()

  const sharedNames = sharedProtocol.supplements.map((s) => s.name)
  const matchedIds = await matchShareSupplements(sharedNames, existingSupplements)

  const timeBlocksToCreate: { tempId: string; name: string; icon: string; startTime: string }[] = []

  function resolveTimeBlockId(schedule: SharedScheduleData): string {
    const match = recipientTimeBlocks.find(
      (tb) =>
        tb.name.toLowerCase() === schedule.timeBlockName.toLowerCase() &&
        tb.startTime === schedule.timeBlockStartTime
    )
    if (match) return match.id

    const existing = timeBlocksToCreate.find(
      (tb) => tb.name === schedule.timeBlockName && tb.startTime === schedule.timeBlockStartTime
    )
    if (existing) return existing.tempId

    const tempId = crypto.randomUUID()
    timeBlocksToCreate.push({
      tempId,
      name: schedule.timeBlockName,
      icon: schedule.timeBlockIcon,
      startTime: schedule.timeBlockStartTime,
    })
    return tempId
  }

  const allTimeBlocks = [
    ...recipientTimeBlocks,
    ...timeBlocksToCreate.map((tb) => ({ id: tb.tempId, name: tb.name, startTime: tb.startTime })),
  ]

  const parsedSupplements: ParsedSupplement[] = sharedProtocol.supplements.map((s, i) => ({
    name: s.name,
    existingSupplementId: matchedIds[i] ?? null,
    brandName: null,
    category: s.category,
    isCritical: false,
    confidence: 1,
    notes: null,
    cycleDaysOn: null,
    cycleDaysOff: null,
    startDayOffset: 0,
    durationDays: null,
    dosageIntervalMinutes: s.schedules[0]?.dosageIntervalMinutes ?? null,
    waitAfterTakingMinutes: null,
    uncertaintyReason: null,
    schedules: s.schedules.map((sch) => ({
      timeBlockId: resolveTimeBlockId(sch),
      dosageAmount: sch.dosageAmount,
      dosageUnit: sch.dosageUnit,
      notes: sch.notes,
      isCritical: sch.isCritical,
      cycleDaysOn: sch.cycleDaysOn,
      cycleDaysOff: sch.cycleDaysOff,
      startDayOffset: sch.startDayOffset,
      durationDays: sch.durationDays,
      waitAfterTakingMinutes: sch.waitAfterTakingMinutes,
      finishPackage: sch.finishPackage,
      sortOrder: sch.sortOrder,
    })),
  }))

  const initialSupplements = toIdentifiedSupplements(parsedSupplements)

  return (
    <ImportProtocolPage
      shareToken={token}
      protocolName={sharedProtocol.protocolName}
      initialSupplements={initialSupplements}
      existingSupplements={existingSupplements}
      timeBlocks={allTimeBlocks}
      timeBlocksToCreate={timeBlocksToCreate}
    />
  )
}
