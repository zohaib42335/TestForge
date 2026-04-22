/**
 * Generic API error state with retry action.
 *
 * @param {{ message?: string, onRetry?: () => void }} props
 * @returns {import('react').ReactNode}
 */
export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
      <p className="text-sm font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm">{message}</p>
      {typeof onRetry === 'function' ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          Try Again
        </button>
      ) : null}
    </div>
  )
}
