interface ConfirmationDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  pending?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmationDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Go back',
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel()
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-message"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="confirmation-dialog-title" className="text-lg font-bold text-gray-900">
          {title}
        </h2>
        <p id="confirmation-dialog-message" className="mt-2 text-sm text-gray-600">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={pending}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-90'
            }`}
          >
            {pending ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
