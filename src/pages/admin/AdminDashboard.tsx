import { Users, CheckCircle2, Pin, BarChart3 } from 'lucide-react'
import { useDashboardData } from '../../features/dashboard/useDashboardData'
import { useToast } from '../../components/ToastProvider'
import { SkeletonStatCard } from '../../components/Skeleton'

function AdminDashboard() {
  const { showToast } = useToast()
  const { data, loading, error, refresh } = useDashboardData()

  if (loading) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-primary mb-1">Admin Dashboard</h1>
      <p className="text-sm text-gray-400 mb-6">Live overview of MEAL system activity</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
    </div>
  )
}

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => {
            refresh()
            showToast('Refreshing dashboard…', 'info')
          }}
          className="btn-primary mt-2">
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-primary mb-1">Admin Dashboard</h1>
      <p className="text-sm text-gray-400 mb-6">Live overview of MEAL system activity</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={40} />}
          barColor="var(--color-primary)"
          label="Total Registrations"
          value={data.totalReg}
          sub={`↑ ${data.thisWeek} this week`}
        />
        <StatCard
          icon={<CheckCircle2 size={40} />}
          barColor="var(--color-teal)"
          label="Total Attendance"
          value={data.totalAtt}
          sub={`↑ ${data.attRate}% attendance rate`}
        />
        <StatCard
          icon={<Pin size={40} />}
          barColor="var(--color-info)"
          label="Active Activities"
          value={data.activeActs}
          sub={`${data.upcomingActs} upcoming · ↑ ${data.acts.length} total`}
        />
        <StatCard
          icon={<BarChart3 size={40} />}
          barColor="var(--color-accent)"
          label="Fill Rate"
          value={`${data.fillRate}%`}
          sub={`${data.totalReg} of ${data.totalSlots} slots used`}
          trend={data.remaining > 0 ? `↓ ${data.remaining}% slots remaining` : undefined}
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  barColor,
  label,
  value,
  sub,
  trend,
}: {
  icon: React.ReactNode
  barColor: string
  label: string
  value: string | number
  sub: string
  trend?: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-accent-bar" style={{ background: barColor }} />
      <div className="stat-icon-watermark" style={{ color: barColor }}>
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
      {trend && <div className="text-xs text-orange-500 font-semibold mt-1">{trend}</div>}
    </div>
  )
}

export default AdminDashboard