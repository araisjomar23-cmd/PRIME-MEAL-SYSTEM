import { supabase } from '../../lib/supabase'

export interface AttendanceLogRow {
  id: string
  checkedInAt: string
  dayNumber: number
  method: string
  name: string
  refCode: string
  activityTitle: string
  activityId: string
}

export async function loadTodayLog(): Promise<AttendanceLogRow[]> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('attendance_log')
    .select(`
      id, checked_in_at, day_number, method, activity_id,
      registrations ( ref_code, name, activity_id,
        activities ( title )
      )
    `)
    .gte('checked_in_at', todayStart.toISOString())
    .order('checked_in_at', { ascending: false })

  if (error) {
    console.error('loadTodayLog error:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    checkedInAt: row.checked_in_at,
    dayNumber: row.day_number,
    method: row.method,
    name: row.registrations?.name || '—',
    refCode: row.registrations?.ref_code || '—',
    activityTitle: row.registrations?.activities?.title || '—',
    activityId: row.activity_id,
  }))
}

export interface MarkAttendanceResult {
  status: 'success' | 'error'
  title: string
  body: string
}

export async function markAttendance(
  activityId: string,
  rawRefCode: string,
  dayNumber: number
): Promise<MarkAttendanceResult> {
  const refCode = rawRefCode.trim().toUpperCase()

  if (!activityId) {
    return { status: 'error', title: 'No Activity Selected', body: 'Please choose an activity first.' }
  }
  if (!refCode) {
    return { status: 'error', title: 'No Code Entered', body: 'Paste or scan a participant reference code.' }
  }

  const { data: reg, error: regErr } = await supabase
    .from('registrations')
    .select('id, ref_code, name, activity_id, status')
    .eq('ref_code', refCode)
    .single()

  if (regErr || !reg) {
    return { status: 'error', title: 'Not Found', body: `No participant found with code ${refCode}.` }
  }

  if (String(reg.activity_id) !== String(activityId)) {
    return {
      status: 'error',
      title: 'Wrong Activity',
      body: `${reg.name} is registered under a different activity.`,
    }
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: existing } = await supabase
    .from('attendance_log')
    .select('id')
    .eq('registration_id', reg.id)
    .eq('day_number', dayNumber)
    .gte('checked_in_at', todayStart.toISOString())
    .maybeSingle()

  if (existing) {
    return {
      status: 'error',
      title: 'Already Scanned',
      body: `${reg.name} was already marked present for Day ${dayNumber} today.`,
    }
  }

  const now = new Date().toISOString()
  const { error: logErr } = await supabase.from('attendance_log').insert({
    registration_id: reg.id,
    activity_id: activityId,
    checked_in_at: now,
    day_number: dayNumber,
    method: 'manual',
  })

  if (logErr) {
    return { status: 'error', title: 'Log Failed', body: logErr.message }
  }

  if (reg.status === 'registered') {
    await supabase
      .from('registrations')
      .update({ status: 'attended', attended_at: now })
      .eq('id', reg.id)
  }

  return {
    status: 'success',
    title: `${reg.name} — Checked In!`,
    body: `Day ${dayNumber} · ${new Date(now).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`,
  }
}