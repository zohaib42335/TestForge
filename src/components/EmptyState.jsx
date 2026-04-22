/**
 * Generic empty list state.
 *
 * @param {{ icon?: string, title: string, subtitle?: string, ctaLabel?: string, onCta?: () => void }} props
 * @returns {import('react').ReactNode}
 */
export default function EmptyState({
  icon = '📄',
  title,
  subtitle = '',
  ctaLabel,
  onCta,
}) {
  return (
    <div className="rounded-xl border border-[#D7E2F5] bg-white p-10 text-center">
      <div className="mx-auto mb-2 text-4xl">{icon}</div>
      <h3 className="text-lg font-semibold text-[#1A3263]">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-[#5A6E9A]">{subtitle}</p> : null}
      {ctaLabel && typeof onCta === 'function' ? (
        <button
          type="button"
          onClick={onCta}
          className="mt-4 rounded bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white hover:bg-[#122247]"
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  )
}
