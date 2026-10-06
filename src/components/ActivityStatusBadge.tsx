import { getActivityStatusLabel } from '../features/activities/activityStatus'

interface ActivityStatusBadgeProps {
  status: string
  startDate?: string | null
  endDate?: string | null
  startTime?: string | null
  endTime?: string | null
  className?: string
}

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Published: 'bg-blue-100 text-blue-700',
  Ongoing: 'bg-green-100 text-green-700',
  Completed: 'bg-purple-100 text-purple-700',
  Cancelled: 'bg-red-100 text-red-700',
}

export default function ActivityStatusBadge({
  status,
  startDate,
  endDate,
  startTime,
  endTime,
  className = '',
}: ActivityStatusBadgeProps) {
  const label = getActivityStatusLabel(status, startDate, endDate, startTime, endTime)

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[label] || 'bg-gray-100 text-gray-600'} ${className}`}
    >
      {label}
    </span>
  )
}
