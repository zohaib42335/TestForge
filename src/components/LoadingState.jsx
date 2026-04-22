/**
 * Generic skeleton loading state.
 *
 * @param {{ lines?: number, className?: string }} props
 * @returns {import('react').ReactNode}
 */
export default function LoadingState({ lines = 3, className = '' }) {
  return (
    <div className={`rounded-xl border border-[#D7E2F5] bg-white p-4 ${className}`}>
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: lines }).map((_, idx) => (
          <div key={idx} className="h-4 rounded bg-[#D6E0F5]" />
        ))}
      </div>
    </div>
  )
}
