import { AlertTriangle, CircleAlert } from 'lucide-react'

interface BudgetWarningProps {
  allocated: number
  spent: number
  className?: string
}

export default function BudgetWarning({
  allocated,
  spent,
  className = '',
}: BudgetWarningProps) {
  if (spent <= 0) return null

  const exceeded = allocated > 0 && spent > allocated
  const reached = allocated > 0 && spent === allocated
  const noAllocation = allocated <= 0
  const approaching = allocated > 0 && spent < allocated && spent / allocated >= 0.8

  if (!exceeded && !reached && !noAllocation && !approaching) return null

  const message = noAllocation
    ? `Expenses total ₱${spent.toLocaleString()} but no budget has been allocated.`
    : exceeded
    ? `Over budget by ₱${(spent - allocated).toLocaleString()} (${Math.round((spent / allocated) * 100)}% used).`
    : reached
    ? `The full allocated budget of ₱${allocated.toLocaleString()} has been spent.`
    : `₱${(allocated - spent).toLocaleString()} remaining — ${Math.round((spent / allocated) * 100)}% of the budget has been used.`

  const urgent = exceeded || reached || noAllocation

  return (
    <div
      role={urgent ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
        urgent
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-amber-200 bg-amber-50 text-amber-900'
      } ${className}`}
    >
      {urgent ? (
        <CircleAlert size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
      ) : (
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
      )}
      <div>
        <div className="font-semibold">
          {noAllocation ? 'No budget allocated' : exceeded ? 'Budget exceeded' : reached ? 'Budget fully spent' : 'Budget warning'}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed">{message}</p>
      </div>
    </div>
  )
}
