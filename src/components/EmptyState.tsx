interface Props {
  icon: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-5">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-primary mb-5 ring-1 ring-green-100">
        <span aria-hidden="true">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      {subtitle && <p className="text-sm leading-relaxed text-gray-500 max-w-sm">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}