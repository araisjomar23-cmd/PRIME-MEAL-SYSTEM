import { supabase } from '../../lib/supabase'
import { getActivityStatusLabel } from '../activities/activityStatus'

interface ReportActivityRow {
  id: string
  program_id: string
  title: string
  status: string
  slots: number
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  programs: { name: string | null }[] | { name: string | null } | null
}

interface ReportRegistrationRow {
  id: string
  activity_id: string
  status: string
  gender_identity: string | null
  age_bracket: string | null
  barangay: string | null
}

interface ReportBudgetRow {
  activity_id: string
  amount: number | string
  entry_type: string
}

interface ReportEvaluationRow {
  activity_id: string
  rating: number | null
  would_recommend: boolean | null
}

type ReportDimensionKey = 'gender_identity' | 'age_bracket' | 'barangay'

export interface ReportFilterActivity {
  id: string
  title: string
  programId: string
  programName: string
}

interface ReportFilterActivityRow {
  id: string
  title: string
  program_id: string
  programs: { name: string | null }[] | { name: string | null } | null
}

export async function fetchReportFilterActivities(): Promise<ReportFilterActivity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('id, title, program_id, programs(name)')
    .order('title')

  if (error) {
    console.error('fetchReportFilterActivities error:', error.message)
    throw new Error('Could not load activity and program filters.')
  }

  return (data || []).map((activity: ReportFilterActivityRow) => {
    const program = Array.isArray(activity.programs) ? activity.programs[0] : activity.programs
    return {
      id: activity.id,
      title: activity.title,
      programId: activity.program_id,
      programName: program?.name || '—',
    }
  })
}

export interface ReportFilters {
  activityId?: string
  programId?: string
}

export interface ReportData {
  period: string
  generatedAt: string
  totalActivities: number
  totalRegistered: number
  totalAttended: number
  avgSatisfaction: string
  activityRows: {
    title: string
    program: string
    date: string
    slots: number
    registered: number
    attended: number
    status: string
    budgetUtil: string
  }[]
  genderBreakdown: { label: string; count: number }[]
  ageBreakdown: { label: string; count: number }[]
  topBarangays: { label: string; count: number }[]
  budgetAllocated: number
  budgetUtilized: number
  budgetRemaining: number
  budgetRows: {
    title: string
    allocated: number
    utilized: number
    remaining: number
    utilPct: number
  }[]
  evalSummary: string
  evalRows: {
    title: string
    responses: number
    avgRating: string
    recommendPct: string
  }[]
  insights: string[]
}

export async function generateReport(
  dateFrom: string,
  dateTo: string,
  filters: ReportFilters = {}
): Promise<ReportData> {
  if (!dateFrom || !dateTo || dateFrom > dateTo) {
    throw new Error('Choose a valid date range. The start date must be on or before the end date.')
  }

  let activitiesQuery = supabase
    .from('activities')
    .select('id, program_id, title, status, slots, start_date, end_date, start_time, end_time, programs(name)')
    .lte('start_date', dateTo)
    .gte('end_date', dateFrom)

  if (filters.activityId) activitiesQuery = activitiesQuery.eq('id', filters.activityId)
  if (filters.programId) activitiesQuery = activitiesQuery.eq('program_id', filters.programId)

  const { data: activities, error: activityError } = await activitiesQuery
  if (activityError) {
    console.error('generateReport activity query error:', activityError.message)
    throw new Error('Could not load activities for this report. Please try again.')
  }

  const activityIds = (activities || []).map((a: ReportActivityRow) => a.id)

  const { data: regs, error: registrationError } = await supabase
    .from('registration_details')
    .select('id, activity_id, status, gender_identity, age_bracket, barangay')
    .in('activity_id', activityIds.length ? activityIds : ['none'])

  if (registrationError) {
    console.error('generateReport registration query error:', registrationError.message)
    throw new Error('Could not load participant data for this report. Please try again.')
  }

  const { data: budgetEntries, error: budgetError } = await supabase
    .from('budget_entries')
    .select('activity_id, amount, entry_type')
    .in('activity_id', activityIds.length ? activityIds : ['none'])

  if (budgetError) {
    console.error('generateReport budget query error:', budgetError.message)
    throw new Error('Could not load budget data for this report. Please try again.')
  }

  const { data: evals, error: evaluationError } = await supabase
    .from('evaluations')
    .select('activity_id, rating, would_recommend')
    .in('activity_id', activityIds.length ? activityIds : ['none'])

  if (evaluationError) {
    console.error('generateReport evaluation query error:', evaluationError.message)
    throw new Error('Could not load evaluation data for this report. Please try again.')
  }

  const regsByActivity: Record<string, ReportRegistrationRow[]> = {}
  ;(regs || []).forEach((r: ReportRegistrationRow) => {
    if (!regsByActivity[r.activity_id]) regsByActivity[r.activity_id] = []
    regsByActivity[r.activity_id].push(r)
  })

  const budgetByActivity: Record<string, { alloc: number; spent: number }> = {}
  ;(budgetEntries || []).forEach((b: ReportBudgetRow) => {
    if (!budgetByActivity[b.activity_id]) budgetByActivity[b.activity_id] = { alloc: 0, spent: 0 }
    if (b.entry_type === 'allocation') budgetByActivity[b.activity_id].alloc += Number(b.amount) || 0
    if (b.entry_type === 'expense') budgetByActivity[b.activity_id].spent += Number(b.amount) || 0
  })

  const evalsByActivity: Record<string, ReportEvaluationRow[]> = {}
  ;(evals || []).forEach((e: ReportEvaluationRow) => {
    if (!evalsByActivity[e.activity_id]) evalsByActivity[e.activity_id] = []
    evalsByActivity[e.activity_id].push(e)
  })

  const totalRegistered = (regs || []).length
  const totalAttended = (regs || []).filter((r: ReportRegistrationRow) => r.status === 'attended' || r.status === 'completed').length
  const totalEvalRating = (evals || []).reduce((s: number, e: ReportEvaluationRow) => s + (e.rating || 0), 0)
  const avgSatisfaction = evals && evals.length > 0 ? (totalEvalRating / evals.length).toFixed(1) : 'N/A'

  const activityRows = (activities || []).map((a: ReportActivityRow) => {
    const activityRegs = regsByActivity[a.id] || []
    const attended = activityRegs.filter((r) => r.status === 'attended' || r.status === 'completed').length
    const program = Array.isArray(a.programs) ? a.programs[0] : a.programs
    const budget = budgetByActivity[a.id] || { alloc: 0, spent: 0 }
    const utilPct = budget.alloc > 0 ? Math.round((budget.spent / budget.alloc) * 100) : 0
    return {
      title: a.title,
      program: program?.name || '—',
      date: new Date(a.start_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      slots: a.slots,
      registered: activityRegs.length,
      attended,
      status: getActivityStatusLabel(
        a.status,
        a.start_date,
        a.end_date,
        a.start_time,
        a.end_time
      ),
      budgetUtil: budget.alloc > 0 ? `${utilPct}%` : '—',
    }
  })

  function tally(items: ReportRegistrationRow[], key: ReportDimensionKey): { label: string; count: number }[] {
    const map: Record<string, number> = {}
    items.forEach((item) => {
      const val = item[key] || 'Unspecified'
      map[val] = (map[val] || 0) + 1
    })
    return Object.entries(map)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }

  const genderBreakdown = tally(regs || [], 'gender_identity')
  const ageBreakdown = tally(regs || [], 'age_bracket')
  const topBarangays = tally(regs || [], 'barangay').slice(0, 5)

  const budgetAllocated = Object.values(budgetByActivity).reduce((s, b) => s + b.alloc, 0)
  const budgetUtilized = Object.values(budgetByActivity).reduce((s, b) => s + b.spent, 0)
  const budgetRemaining = budgetAllocated - budgetUtilized

  const budgetRows = (activities || [])
    .map((a: ReportActivityRow) => {
      const b = budgetByActivity[a.id]
      if (!b || b.alloc === 0) return null
      return {
        title: a.title,
        allocated: b.alloc,
        utilized: b.spent,
        remaining: b.alloc - b.spent,
        utilPct: Math.round((b.spent / b.alloc) * 100),
      }
    })
    .filter(Boolean) as ReportData['budgetRows']

  const evalRows = (activities || [])
    .map((a: ReportActivityRow) => {
      const activityEvals = evalsByActivity[a.id] || []
      if (activityEvals.length === 0) return null
      const avg = activityEvals.reduce((s, e) => s + (e.rating || 0), 0) / activityEvals.length
      const recCount = activityEvals.filter((e) => e.would_recommend).length
      return {
        title: a.title,
        responses: activityEvals.length,
        avgRating: avg.toFixed(1),
        recommendPct: `${Math.round((recCount / activityEvals.length) * 100)}%`,
      }
    })
    .filter(Boolean) as ReportData['evalRows']

  const evalSummary =
    evals && evals.length > 0
      ? `A total of ${evals.length} evaluation${evals.length === 1 ? '' : 's'} were collected across ${evalRows.length} activit${evalRows.length === 1 ? 'y' : 'ies'}, with an overall average satisfaction rating of ${avgSatisfaction} out of 5.`
      : 'No evaluation responses were collected during this period.'

  const insights: string[] = []
  const attendanceRate = totalRegistered > 0 ? (totalAttended / totalRegistered) * 100 : 0

  if (attendanceRate < 60 && totalRegistered > 0) {
    insights.push(
      `Attendance rate for this period is ${attendanceRate.toFixed(0)}%, below the 60% benchmark. Consider reviewing reminder/follow-up processes for registered participants.`
    )
  } else if (totalRegistered > 0) {
    insights.push(
      `Attendance rate for this period is ${attendanceRate.toFixed(0)}%, meeting expected benchmarks. Continue current outreach practices.`
    )
  }

  const lowFillActivities = activityRows.filter((a) => a.slots > 0 && a.registered / a.slots < 0.5)
  if (lowFillActivities.length > 0) {
    insights.push(
      `${lowFillActivities.length} activit${lowFillActivities.length === 1 ? 'y has' : 'ies have'} less than 50% slot fill rate. Consider additional promotion for: ${lowFillActivities.map((a) => a.title).join(', ')}.`
    )
  }

  const overBudget = budgetRows.filter((b) => b.utilPct >= 90)
  if (overBudget.length > 0) {
    insights.push(
      `${overBudget.length} activit${overBudget.length === 1 ? 'y is' : 'ies are'} at or above 90% budget utilization: ${overBudget.map((b) => b.title).join(', ')}. Monitor remaining expenses closely.`
    )
  }

  if (evals && evals.length > 0 && Number(avgSatisfaction) < 3.5) {
    insights.push(
      `Average satisfaction rating (${avgSatisfaction}/5) is below the 3.5 benchmark. Review evaluation feedback for common concerns.`
    )
  }

  if (insights.length === 0) {
    insights.push('No significant issues detected for this reporting period based on available data.')
  }

  return {
    period: `${dateFrom} to ${dateTo}`,
    generatedAt: new Date().toLocaleString('en-PH'),
    totalActivities: (activities || []).length,
    totalRegistered,
    totalAttended,
    avgSatisfaction,
    activityRows,
    genderBreakdown,
    ageBreakdown,
    topBarangays,
    budgetAllocated,
    budgetUtilized,
    budgetRemaining,
    budgetRows,
    evalSummary,
    evalRows,
    insights,
  }
}