import { supabase } from '../../lib/supabase'
import type { PublicActivity } from './publicActivityService'

function generateCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = prefix
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
    if (i === 3) code += '-'
  }
  return code
}

export async function fetchActivityById(id: string): Promise<PublicActivity | null> {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id, program_id, title, color_bg, tags,
      status, slots, start_date, end_date, venue,
      preview_desc, full_desc, outcomes, schedule, bring, note,
      programs ( id, name )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  const { data: regRows } = await supabase
    .from('registrations')
    .select('id')
    .eq('activity_id', id)
    .neq('status', 'inactive')

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

  return {
    id: data.id,
    programId: data.program_id,
    programName: (data as any).programs?.name || '—',
    title: data.title || '',
    colorBg: data.color_bg || '',
    tags: data.tags || [],
    status: data.status || 'open',
    slots: data.slots || 0,
    taken: regRows?.length || 0,
    venue: data.venue || '—',
    date:
      data.start_date === data.end_date
        ? fmt(data.start_date)
        : `${fmt(data.start_date)} – ${fmt(data.end_date)}`,
    time: '',
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

export async function registerParticipant(activityId: string): Promise<RegisterResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Please login first.' }
  }

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id')
    .eq('user_uuid', user.id)
    .single()

  if (participantError || !participant) {
    return { ok: false, error: 'Please complete your profile before registering.' }
  }

  const { data: existing } = await supabase
    .from('registrations')
    .select('id')
    .eq('participant_id', participant.id)
    .eq('activity_id', activityId)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: 'You are already registered for this activity.' }
  }

  const { data: liveRegs } = await supabase
    .from('registrations')
    .select('id')
    .eq('activity_id', activityId)
    .neq('status', 'inactive')

  const { data: activityRow } = await supabase
    .from('activities')
    .select('slots')
    .eq('id', activityId)
    .single()

  const openSlots = Math.max(0, (activityRow?.slots || 0) - (liveRegs?.length || 0))
  if (openSlots <= 0) {
    return { ok: false, error: 'This activity is full. No slots remaining.' }
  }

  const refCode = generateCode('CY-')

  const { error } = await supabase.from('registrations').insert({
    participant_id: participant.id,
    activity_id: activityId,
    ref_code: refCode,
    status: 'registered',
    registered_at: new Date().toISOString(),
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, refCode }
}