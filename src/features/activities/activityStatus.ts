export function getActivityStatusLabel(
  status: string,
  startDate?: string | null,
  endDate?: string | null,
  startTime?: string | null,
  endTime?: string | null
): string {
  const normalized = status.toLowerCase()
  if (normalized === 'draft') return 'Draft'
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled'
  if (normalized === 'completed') return 'Completed'

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (endDate && endDate < today) return 'Completed'

  if (startDate && endDate && startDate <= today && endDate >= today) {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    if (startDate === today && startTime && currentTime < startTime.slice(0, 5)) {
      return 'Published'
    }
    if (endDate === today && endTime && currentTime > endTime.slice(0, 5)) {
      return 'Completed'
    }
    return 'Ongoing'
  }

  if (
    normalized === 'open' ||
    normalized === 'upcoming' ||
    normalized === 'full' ||
    normalized === 'closed' ||
    normalized === 'published'
  ) {
    return 'Published'
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}
