// src/services/RegistrationService.ts
import { supabase } from '../../lib/supabase'
import type { PublicActivity } from './publicActivityService'

/**
 * Formats database 24h string values (e.g. "13:00:00") into a clean 12h AM/PM layout
 */
function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return '—'
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${String(m).padStart(2, '0')} ${period}`
  }
  return endTime ? `${fmt(startTime)} – ${fmt(endTime)}` : fmt(startTime)
}

/**
 * Fetches a single activity detail object block by its numeric ID
 */
// FIX 1: Changed parameter type from 'string' to 'number' to match database 'integer'
export async function fetchActivityById(id: number): Promise<PublicActivity | null> {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id, program_id, title, color_bg, tags,
      status, slots, taken, start_date, end_date, start_time, end_time, venue,
      preview_desc, full_desc, outcomes, schedule, bring, note,
      programs ( id, name )
    `)
    .eq('id', id)
    .is('archived_at', null)
    .single()

  if (error || !data) return null

  const program = Array.isArray(data.programs) ? data.programs[0] : data.programs
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

  return {
    id: String(data.id), // Kept as string to satisfy the PublicActivity interface type boundary
    programId: data.program_id,
    programName: program?.name || '—',
    title: data.title || '',
    colorBg: data.color_bg || '',
    tags: data.tags || [],
    status: data.status || 'open',
    startDate: data.start_date || '',
    endDate: data.end_date || '',
    startTime: data.start_time || '',
    endTime: data.end_time || '',
    slots: data.slots || 0,
    taken: data.taken || 0,
    venue: data.venue || '—',
    date:
      data.start_date === data.end_date
        ? fmt(data.start_date)
        : `${fmt(data.start_date)} – ${fmt(data.end_date)}`,
    // FIX 2: Fixed the empty time bug using the local helper function
    time: formatTimeRange(data.start_time, data.end_time),
    previewDesc: data.preview_desc || '',
    fullDesc: data.full_desc || '',
    outcomes: data.outcomes || [],
    schedule: data.schedule || [],
    bring: data.bring || [],
    note: data.note || '',
  }
}

export interface RegisterResult {
  ok: boolean
  error?: string
  refCode?: string
}

/**
 * Registers a logged-in user to a specific activity via an atomic backend RPC.
 */
// FIX 3: Changed parameter type from 'string' to 'number' to match database 'integer'
export async function registerParticipant(activityId: number): Promise<RegisterResult> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
    return { ok: false, error: 'Please login first.' }
    }

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('archived_at')
      .eq('id', activityId)
      .maybeSingle()

    if (activityError) {
      return { ok: false, error: 'Could not verify that this activity is available. Please refresh and try again.' }
    }
    if (!activity || activity.archived_at) {
      return { ok: false, error: 'This activity has been archived and is no longer accepting registrations.' }
    }

    // Single atomic call — the lock inside the RPC handles the race.
    const { data, error } = await supabase.rpc('register_participant', {
    p_activity_id: activityId, // Supabase maps the number variable cleanly to the integer input parameter
    })

    if (error) {
    return { ok: false, error: error.message }
    }

  // Unpack array structure safely
    const result = data?.[0]
    if (!result?.success) {
    return { ok: false, error: result?.message || 'Registration failed.' }
    }

    return { ok: true, refCode: result.ref_code }
}
