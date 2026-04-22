/**
 * Generic confirmation modal.
 *
 * @param {{ open: boolean, title?: string, description?: string, confirmLabel?: string, confirmVariant?: 'danger'|'primary', onCancel: () => void, onConfirm: () => void, busy?: boolean }} props
 * @returns {import('react').ReactNode}
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onCancel,
  onConfirm,
  busy = false,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#D6E0F5] bg-white p-5 shadow-lg">
        <h3 className="text-lg font-semibold text-[#1A3263]">{title}</h3>
        <p className="mt-2 text-sm text-[#5A6E9A]">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#D6E0F5] px-4 py-2 text-sm text-[#1A3263]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#1A3263] hover:bg-[#122247]'
            } disabled:opacity-70`}
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
