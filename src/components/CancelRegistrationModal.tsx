import { useState, type FormEvent } from 'react'
import { CANCELLATION_REASON_MAX_LENGTH } from '../features/public/RegistrationConstants'
import LoadingIndicator from './LoadingIndicator'

interface CancelRegistrationModalProps {
  activityTitle: string
  submitting: boolean
  error: string
  onConfirm: (reason: string) => void | Promise<void>
  onClose: () => void
}

export default function CancelRegistrationModal({
  activityTitle,
  submitting,
  error,
  onConfirm,
  onClose,
}: CancelRegistrationModalProps) {
  const [reason, setReason] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onConfirm(reason)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-registration-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="cancel-registration-title" className="text-lg font-bold text-gray-900">
          Cancel your registration?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Your registration for <strong>{activityTitle}</strong> will be cancelled and the slot
          released.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="cancellation-reason" className="mt-4 block text-sm font-medium text-gray-700">
            Reason <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="cancellation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={CANCELLATION_REASON_MAX_LENGTH}
            rows={3}
            disabled={submitting}
            className="input mt-1 w-full resize-y"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {reason.length}/{CANCELLATION_REASON_MAX_LENGTH}
          </p>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Keep registration
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? <LoadingIndicator label="Cancelling registration…" /> : 'Cancel registration'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}