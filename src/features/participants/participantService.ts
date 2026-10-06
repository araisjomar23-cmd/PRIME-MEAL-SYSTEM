import { supabase } from '../../lib/supabase'
import type { Registration } from '../../types/registration'

interface ParticipantActivityRow {
  id: string
  title: string | null
  date_text: string | null
  venue: string | null
  programs: { name: string | null }[] | { name: string | null } | null
}

interface ParticipantQueryRow {
  id: string
  ref_code: string | null
  activity_id: string
  name: string | null
  age: number | null
  gender_identity: string | null
  contact: string | null
  barangay: string | null
  organization: string | null
  status: string | null
  registered_at: string
  attended_at: string | null
  notes: string | null
  sectoral_group: string | null
  activities: ParticipantActivityRow[] | ParticipantActivityRow | null
}

function normalizeStatus(status: string | null): Registration['status'] {
  if (status === 'attended' || status === 'completed' || status === 'inactive') return status
  return 'registered'
}

export async function fetchParticipants(): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registration_details')
    .select(`
      id, ref_code, activity_id,
      name, age, gender_identity, contact, barangay, organization,
      status, registered_at, attended_at, notes, sectoral_group,
      activities (
        id, title, date_text, venue,
        programs ( name )
      )
    `)
    .order('registered_at', { ascending: false })

  if (error) {
    console.error('fetchParticipants error:', error.message)
    return []
  }

  return (data || []).map((r: ParticipantQueryRow) => {
    const activity = Array.isArray(r.activities) ? r.activities[0] : r.activities
    const program = activity
      ? Array.isArray(activity.programs)
        ? activity.programs[0]
        : activity.programs
      : null
    return ({
    id: r.id,
    ref: r.ref_code || '',
    registeredAt: r.registered_at,
    attendedAt: r.attended_at,
    notes: r.notes || '',
    status: normalizeStatus(r.status),
    name: r.name || '—',
    age: r.age ?? '—',
    gender: r.gender_identity || '—',
    contact: r.contact || '—',
    barangay: r.barangay || '—',
    org: r.organization || '',
    activityId: r.activity_id,
    activityTitle: activity?.title ?? '—',
    activityDate: activity?.date_text ?? '—',
    activityVenue: activity?.venue ?? '—',
    program: program?.name ?? '—',
    sectoralGroup: r.sectoral_group || 'None',
    })
  })
}

export async function updateStatusInDB(refCode: string, newStatus: string): Promise<boolean> {
  const { error } = await supabase
    .from('registrations')
    .update({ status: newStatus })
    .eq('ref_code', refCode)

  if (error) {
    console.error('updateStatusInDB error:', error.message)
    return false
  }
  return true
}