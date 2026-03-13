import { getDailyStatus } from './api/queries/get-daily-status'
import { DailyView } from './components/daily-view'

function getTodayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type Props = {
  userId: string
  date?: string
}

export async function DashboardPage({ userId, date }: Props) {
  const dateString = date ?? getTodayString()
  const status = await getDailyStatus(userId, dateString)

  return <DailyView status={status} date={dateString} />
}
