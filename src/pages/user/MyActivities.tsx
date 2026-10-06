import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ParticipantLayout from '../../layouts/ParticipantLayout'
import { SkeletonCard } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Calendar, ClipboardList } from 'lucide-react'
import CancelRegistrationModal from '../../components/CancelRegistrationModal'
import {
  CANCELLATION_ERROR,
  CANCELLATION_ERROR_MESSAGES,
  CANCELLATION_FALLBACK_MESSAGE,
  CANCELLATION_REASON_MAX_LENGTH,
} from '../../features/public/RegistrationConstants'

interface MyActivity {
  id: number
  title: string
  status: string
  registered_at: string
  colorBg: string
}

const PILL_STYLES: Record<string, string> = {
  registered: 'bg-green-100 text-green-700',
  attended: 'bg-blue-100 text-blue-700',
  completed: 'bg-teal-100 text-teal-700',
  inactive: 'bg-gray-100 text-gray-600',
}

export default function MyActivities() {
  const [activities, setActivities] = useState<MyActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<MyActivity | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    loadActivities()
  }, [])

  async function loadActivities() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_uuid', user.id)
      .single()

    if (!participant) { setLoading(false); return }

    const { data } = await supabase
      .from('registrations')
      .select(`
        id,
        status,
        registered_at,
        activities ( title, color_bg )
      `)
      .eq('participant_id', participant.id)
      .order('registered_at', { ascending: false })

    const rows =
      data?.map((r: {
        id: number
        status: string
        registered_at: string
        activities: { title: string | null; color_bg: string | null }[]
      }) => ({
        id: r.id,
        title: r.activities[0]?.title || 'Untitled Activity',
        status: r.status,
        registered_at: r.registered_at,
        colorBg: r.activities[0]?.color_bg || '#1a5c3a',
      })) || []

    setActivities(rows)
    setLoading(false)
  }

  async function handleConfirmCancel(reason: string) {
    if (!target) return

    setCancelling(true)
    setCancelError('')
    try {
      const { error } = await supabase.rpc('cancel_registration', {
        p_registration_id: target.id,
        p_reason: reason.trim().slice(0, CANCELLATION_REASON_MAX_LENGTH) || null,
      })

      if (error) {
        const code = Object.values(CANCELLATION_ERROR).find((value) => error.message?.includes(value))
        setCancelError(
          (code && CANCELLATION_ERROR_MESSAGES[code]) ||
            CANCELLATION_FALLBACK_MESSAGE
        )
        return
      }

      setNotice(`Your registration for "${target.title}" has been cancelled.`)
      setTarget(null)
      await loadActivities()
    } catch (error) {
      console.error('Cancel registration error:', error)
      setCancelError(CANCELLATION_FALLBACK_MESSAGE)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <ParticipantLayout>
      <h1 className="text-3xl font-bold mb-1">My Activities</h1>
      <p className="text-gray-500 mb-8 text-sm">Activities you've registered for.</p>

      {notice && (
        <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="No registrations yet"
            subtitle="Browse activities from your dashboard and register to see them here."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="panel !p-0 overflow-hidden flex">
              <div className="w-1.5 shrink-0" style={{ backgroundColor: activity.colorBg }} />
                <div className="p-5 flex-1 flex items-center justify-between flex-wrap gap-3">
                  <div>
                  <h2 className="font-bold text-lg text-gray-900">{activity.title}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                      <Calendar size={13} />
                    Registered {new Date(activity.registered_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${PILL_STYLES[activity.status] || 'bg-gray-100 text-gray-600'}`}>
                  {activity.status}
                </span>
                {activity.status === 'registered' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError('')
                      setTarget(activity)
                    }}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Cancel registration
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {target && (
        <CancelRegistrationModal
          activityTitle={target.title}
          submitting={cancelling}
          error={cancelError}
          onConfirm={handleConfirmCancel}
          onClose={() => {
            if (!cancelling) {
              setTarget(null)
              setCancelError('')
            }
          }}
        />
      )}
    </ParticipantLayout>
  )
}