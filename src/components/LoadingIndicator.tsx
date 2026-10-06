interface LoadingIndicatorProps {
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export default function LoadingIndicator({
  label,
  size = 'sm',
  className = '',
}: LoadingIndicatorProps) {
  const spinnerSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center justify-center gap-2 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`${spinnerSize} animate-spin rounded-full border-2 border-current border-r-transparent`}
      />
      {label && <span>{label}</span>}
    </span>
  )
}
