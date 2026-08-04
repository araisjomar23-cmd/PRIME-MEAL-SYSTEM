import { useEffect, useState } from 'react'
import { fetchActivities } from '../activities/activityService'
import { fetchParticipants } from '../participants/participantService'
import { supabase } from '../../lib/supabase'
import type { Activity } from '../../types/activity'
import type { Registration } from '../../types/registration'

export interface DashboardData {
  totalReg: number
  totalAtt: number
  acts: Activity[]
  totalSlots: number
  fillRate: number
  activeActs: number
  upcomingActs: number
  remaining: number
  attRate: string
  thisWeek: number
  liveCount: Record<string, number>
  all: Registration[]
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [acts, all] = await Promise.all([fetchActivities(), fetchParticipants()])

      const totalReg = all.length
      const totalAtt = all.filter((p) => p.status === 'attended' || p.status === 'completed').length
      const totalSlots = acts.reduce((s, a) => s + a.slots, 0)
      const fillRate = totalSlots > 0 ? Math.round((totalReg / totalSlots) * 100) : 0
      const activeActs = acts.filter((a) => a.status === 'open' || a.status === 'full').length
      const upcomingActs = acts.filter((a) => a.status === 'upcoming').length
      const remaining = 100 - fillRate
      const attRate = totalReg > 0 ? ((totalAtt / totalReg) * 100).toFixed(1) : '0.0'
      const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
      const thisWeek = all.filter((p) => p.registeredAt >= weekAgo).length

      const liveCount: Record<string, number> = {}
      all.forEach((r) => {
        if (r.status !== 'inactive') {
          liveCount[r.activityId] = (liveCount[r.activityId] || 0) + 1
        }
      })

      setData({
        totalReg,
        totalAtt,
        acts,
        totalSlots,
        fillRate,
        activeActs,
        upcomingActs,
        remaining,
        attRate,
        thisWeek,
        liveCount,
        all,
      })
    } catch (err) {
      console.error('Dashboard load error:', err)
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()

    const channel = supabase
      .channel(`dashboard-live-updates-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => refresh())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { data, loading, error, refresh }
}