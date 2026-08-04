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

function ageBracket(age: number): string | null {
  if (age >= 15 && age <= 17) return 'Child Youth'
  if (age >= 18 && age <= 24) return 'Core Youth'
  if (age >= 25 && age <= 30) return 'Adult Youth'
  return null
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
    previewDesc: data.preview_desc || '',
    fullDesc: data.full_desc || '',
    outcomes: data.outcomes || [],
    schedule: data.schedule || [],
    bring: data.bring || [],
    note: data.note || '',
  }
}

export interface RegistrationFormData {
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  age: string
  genderIdentity: string
  street: string
  province: string
  city: string
  barangay: string
  contact: string
  org: string
  youthClass: string
  sectoral: string
}

export interface RegisterResult {
  ok: boolean
  error?: string
  refCode?: string
}

export async function submitRegistration(
  activity: PublicActivity,
  form: RegistrationFormData
): Promise<RegisterResult> {
  const { data: liveRegs } = await supabase
    .from('registrations')
    .select('id')
    .eq('activity_id', activity.id)
    .neq('status', 'inactive')

  const liveTaken = liveRegs?.length || 0
  const openSlots = Math.max(0, activity.slots - liveTaken)
  if (openSlots <= 0) {
    return { ok: false, error: 'This activity is full. No slots remaining.' }
  }

  const age = parseInt(form.age, 10)
  const refCode = generateCode('CY-')
  const pid = generateCode('PID-')
  const name = [form.firstName, form.middleName, form.lastName, form.suffix].filter(Boolean).join(' ')
  const address = [form.street, form.barangay, form.city, form.province, 'Region XI, Davao Region']
    .filter(Boolean)
    .join(', ')

  const payload = {
    ref_code: refCode,
    pid,
    activity_id: activity.id,
    name,
    first_name: form.firstName,
    middle_name: form.middleName || null,
    last_name: form.lastName,
    suffix: form.suffix || null,
    age,
    gender_identity: form.genderIdentity,
    contact: form.contact,
    complete_address: address,
    barangay: form.barangay,
    city_municipality: form.city,
    province: form.province,
    organization: form.org || '',
    youth_classification: form.youthClass,
    sectoral_group: form.sectoral ? [form.sectoral] : null,
    age_bracket: ageBracket(age),
    status: 'registered',
    registered_at: new Date().toISOString(),
  }

  const { error: regErr } = await supabase.from('registrations').insert(payload)

  if (regErr) {
    return { ok: false, error: regErr.message }
  }

  return { ok: true, refCode }
}