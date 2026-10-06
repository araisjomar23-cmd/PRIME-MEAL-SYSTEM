import { supabase } from '../../lib/supabase'

interface RegistrationCountRow {
  activity_id: string
  status: string
}

interface PublicActivityRow {
  id: string
  program_id: string
  title: string | null
  color_bg: string | null
  tags: string[] | null
  status: string | null
  slots: number | null
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  venue: string | null
  preview_desc: string | null
  full_desc: string | null
  outcomes: string[] | null
  schedule: string[] | null
  bring: string[] | null
  note: string | null
  programs: { id: string; name: string | null }[] | { id: string; name: string | null } | null
}

export interface PublicActivity {
  id: string
  programId: string
  programName: string
  title: string
  colorBg: string
  tags: string[]
  status: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  slots: number
  taken: number
  venue: string
  date: string
  time: string
  previewDesc: string
  fullDesc: string
  outcomes: string[]
  schedule: string[]
  bring: string[]
  note: string
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return '—'
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  return startDate === endDate
  ? fmt(startDate)
  : `${fmt(startDate)} – ${fmt(endDate ?? startDate)}`
}

function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return ''
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${String(m).padStart(2, '0')} ${period}`
  }
  return endTime ? `${fmt(startTime)} – ${fmt(endTime)}` : fmt(startTime)
}

export async function fetchPublicActivities(): Promise<PublicActivity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(`
  id, program_id, title, color_bg, tags,
  status, slots, start_date, end_date, start_time, end_time, venue,
  preview_desc, full_desc, outcomes, schedule, bring, note,
  programs ( id, name )
`)
    .not('status', 'eq', 'closed')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchPublicActivities error:', error.message)
    return []
  }

  const { data: regRows } = await supabase.from('registrations').select('activity_id, status')

  const regMap: Record<string, number> = {}
  ;(regRows || []).forEach((r: RegistrationCountRow) => {
    if (r.status !== 'inactive') regMap[r.activity_id] = (regMap[r.activity_id] || 0) + 1
  })

  return (data || [])
    .map((a: PublicActivityRow) => {
      const program = Array.isArray(a.programs) ? a.programs[0] : a.programs
      return {
        id: a.id,
        programId: a.program_id,
        programName: program?.name || '—',
        title: a.title || '',
        colorBg: a.color_bg || '',
        tags: a.tags || [],
        status: a.status || 'open',
        startDate: a.start_date || '',
        endDate: a.end_date || '',
        startTime: a.start_time || '',
        endTime: a.end_time || '',
        slots: a.slots || 0,
        taken: regMap[a.id] || 0,
        venue: a.venue || '—',
        date: formatDateRange(a.start_date, a.end_date),
        time: formatTimeRange(a.start_time || undefined, a.end_time || undefined),
        previewDesc: a.preview_desc || '',
        fullDesc: a.full_desc || '',
        outcomes: a.outcomes || [],
        schedule: a.schedule || [],
        bring: a.bring || [],
        note: a.note || '',
      }
    })
    .filter((activity) => !['draft', 'closed', 'cancelled', 'canceled'].includes(activity.status.toLowerCase()))
}