import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, MapPin, Calendar, ArrowRight, Sparkles, Zap } from 'lucide-react'
import { fetchPublicActivities } from '../../features/public/publicActivityService'
import type { PublicActivity } from '../../features/public/publicActivityService'
import ActivityModal from '../../features/public/ActivityModal'
import { Clock } from 'lucide-react'
import { autoCloseExpiredActivities } from '../../features/activities/activityService'
import { supabase } from '../../lib/supabase'

const PROGRAMS = [
  'Health',
  'Education',
  'Economic Empowerment',
  'Social Inclusion and Equity',
  'Peace Building and Security',
  'Governance',
  'Active Citizenship',
  'Environment',
  'Global Mobility',
  'Agriculture',
]

function fmtShort(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}

function UserHome() {
  const [searchParams] = useSearchParams()
  const [activities, setActivities] = useState<PublicActivity[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('activity'))
  const [loading, setLoading] = useState(true)
  const [programFilter, setProgramFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()

    const channel = supabase
      .channel(`public-activities-live-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function load() {
  setLoading(true)
  await autoCloseExpiredActivities()
  const data = await fetchPublicActivities()
  setActivities(data)
  setLoading(false)
}

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return activities.filter((a) => {
      const mP = !programFilter || a.programName === programFilter
      const mQ = !q || a.title.toLowerCase().includes(q) || a.venue.toLowerCase().includes(q)
      return mP && mQ
    })
  }, [activities, programFilter, search])

  const totalSlots = activities.reduce((s, a) => s + a.slots, 0)
  const totalTaken = activities.reduce((s, a) => s + a.taken, 0)
  const programCount = new Set(activities.map((a) => a.programId)).size

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
      {/* Hero */}
      <div className="relative overflow-hidden text-white" style={{ background: 'var(--color-primary)' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 65% 90% at 95% -5%, rgba(232,160,32,.22) 0%, transparent 65%), radial-gradient(ellipse 45% 60% at -5% 110%, rgba(46,125,90,.28) 0%, transparent 55%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-2">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-accent mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent eyebrow-dot" />
            Live Activities Open Now
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-3">
            CYDO <span className="text-accent">MEAL</span> System
          </h1>
          <p className="text-white/70 max-w-md leading-relaxed mb-7">
            Browse and register for youth development activities happening across Panabo City.
          </p>

          <div className="inline-flex bg-white/10 border border-white/15 rounded-2xl overflow-hidden mb-8">
            <div className="px-5 py-3 text-center border-r border-white/10">
              <div className="font-display text-xl font-extrabold text-accent leading-none mb-0.5">
                {fmtShort(activities.length)}
              </div>
              <div className="text-[10px] text-white/60">Activities</div>
            </div>
            <div className="px-5 py-3 text-center border-r border-white/10">
              <div className="font-display text-xl font-extrabold text-accent leading-none mb-0.5">
                {fmtShort(Math.max(0, totalSlots - totalTaken))}
              </div>
              <div className="text-[10px] text-white/60">Open Slots</div>
            </div>
            <div className="px-5 py-3 text-center">
              <div className="font-display text-xl font-extrabold text-accent leading-none mb-0.5">
                {fmtShort(programCount)}
              </div>
              <div className="text-[10px] text-white/60">Programs</div>
            </div>
          </div>

          {/* Glass search bar */}
          <div className="flex flex-wrap gap-2.5 max-w-2xl mb-10">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activities or venues..."
                className="w-full bg-white/[0.13] backdrop-blur-md border-none rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/45 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="bg-white/[0.13] backdrop-blur-md border-none rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:bg-white/20"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="text-black">All Programs</option>
              {PROGRAMS.map((p) => (
                <option key={p} value={p} className="text-black">{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative leading-[0]">
          <svg viewBox="0 0 1440 52" fill="none" preserveAspectRatio="none" className="w-full block">
            <path
              d="M0 52V28C120 10 240 2 360 8 480 14 600 38 720 40 840 42 960 24 1080 14 1200 4 1320 8 1440 20V52H0Z"
              fill="var(--color-paper)"
            />
          </svg>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500 mb-5">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'activity' : 'activities'} found`}
        </p>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading activities…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-16">No activities found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a) => {
              const open = Math.max(0, a.slots - a.taken)
              const isFull = open <= 0
              const isUrgent = !isFull && a.slots > 0 && open / a.slots <= 0.15

              return (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border overflow-hidden flex flex-col cursor-pointer transition-all hover:-translate-y-1.5"
                  style={{
                    borderColor: 'var(--color-border-warm)',
                    boxShadow: '0 2px 16px rgba(26,92,58,.07)',
                  }}
                  onClick={() => setSelectedId(a.id)}
                >
                  <div
                    className="h-[140px] relative flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: a.colorBg || '#1a5c3a' }}
                  >
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 55%, rgba(0,0,0,.06))' }} />
                    <Sparkles size={44} className="relative z-10 text-white/90 drop-shadow-lg" />

                    <span
                      className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm"
                      style={{
                        background: a.status === 'open' ? 'rgba(212,240,224,.92)' : a.status === 'upcoming' ? 'rgba(220,238,255,.92)' : 'rgba(253,232,200,.92)',
                        color: a.status === 'open' ? '#1a5c3a' : a.status === 'upcoming' ? '#1a4d7a' : '#9a5f0a',
                      }}
                    >
                      {a.status}
                    </span>

                    {isUrgent && (
                      <span className="urgency-badge absolute top-2.5 left-2.5 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white bg-red-600">
                        <Zap size={10} /> Almost Full
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-primary mb-1.5">{a.programName}</div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{a.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mb-3">
                      <span className="inline-flex items-center gap-1"><Calendar size={12} /> {a.date}</span>
                      {a.time && <span className="inline-flex items-center gap-1"><Clock size={12} /> {a.time}</span>}
                      <span className="inline-flex items-center gap-1"><MapPin size={12} /> {a.venue}</span>
                    </div>
                    <p className="text-sm text-gray-600 flex-1 mb-4 line-clamp-3">{a.previewDesc}</p>

                    <div className="mb-3">
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                        <span>{isFull ? 'Full' : `${open} slot${open === 1 ? '' : 's'} left`}</span>
                        <span>{a.taken}/{a.slots}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${a.slots > 0 ? Math.min(100, (a.taken / a.slots) * 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(a.id)
                      }}
                      disabled={isFull}
                      className="w-full btn-primary flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isFull ? 'Activity Full' : <>View & Register</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedId && (
        <ActivityModal
          activityId={selectedId}
          onClose={() => {
            setSelectedId(null)
            load()
          }}
        />
      )}
    </div>
  )
}

export default UserHome