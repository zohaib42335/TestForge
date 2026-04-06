/**
 * TestForge brand logo — shield + check mark icon with wordmark variants.
 *
 * Variants:
 * - LogoFull — icon and “TestForge” wordmark horizontal (navbar).
 * - LogoIcon — icon only (favicon references, compact UI).
 * - LogoStacked — icon above wordmark, centered (login / splash).
 *
 * Styling is inline-only so the component stays portable without Tailwind.
 *
 * @example
 * // In Navbar:   <LogoFull size="md" />
 * // In Login:    <LogoStacked size="lg" />
 * // As favicon:  <LogoIcon size="sm" />
 */

import { useId, useState } from 'react'

/** @typedef {'sm' | 'md' | 'lg'} LogoSize */

/** @type {Record<LogoSize, { icon: number; font: number; gap: number; stackGap: number }>} */
const SIZE_MAP = {
  sm: { icon: 24, font: 15, gap: 8, stackGap: 10 },
  md: { icon: 32, font: 20, gap: 10, stackGap: 12 },
  lg: { icon: 48, font: 30, gap: 14, stackGap: 16 },
}

/**
 * @param {LogoSize} size
 * @returns {{ icon: number; font: number; gap: number; stackGap: number }}
 */
function getSizeTokens(size) {
  return SIZE_MAP[size] ?? SIZE_MAP.md
}

const wordmarkStyleBase = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  letterSpacing: '0.01em',
  lineHeight: 1.15,
  userSelect: 'none',
}

const btnReset = {
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
}

/**
 * Shield + check mark — viewBox 0 0 32 32, scales via width/height.
 * @param {{
 *   pixelSize: number
 *   gradientId: string
 *   interactive?: boolean
 *   hovered?: boolean
 *   decorative?: boolean
 * }} props
 */
function IconMark({ pixelSize, gradientId, interactive, hovered, decorative }) {
  const scaleStyle =
    interactive === true
      ? {
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease',
          display: 'inline-flex',
        }
      : { display: 'inline-flex' }

  const svgA11y =
    decorative === true
      ? { 'aria-hidden': true }
      : { role: 'img', 'aria-label': 'TestForge logo' }

  return (
    <span style={scaleStyle}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 32 32"
        style={{ display: 'block', flexShrink: 0 }}
        {...svgA11y}
      >
        {decorative !== true && <title>TestForge</title>}
        <defs>
          <linearGradient
            id={gradientId}
            x1="16"
            y1="3"
            x2="16"
            y2="30"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="55%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        {/* Shield — QA + protection; reads clearly at 16px */}
        <path
          d="M16 3.5 L26.2 9.8 L26.2 19.4 C26.2 23.8 22.4 27.8 16 29.6 C9.6 27.8 5.8 23.8 5.8 19.4 L5.8 9.8 Z"
          fill={`url(#${gradientId})`}
          stroke="rgba(234, 88, 12, 0.3)"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Inner rim — depth without clutter */}
        <path
          d="M16 5.5 L24.2 10.6 L24.2 18.9 C24.2 22.4 20.8 25.6 16 27 C11.2 25.6 7.8 22.4 7.8 18.9 L7.8 10.6 Z"
          fill="none"
          stroke="rgba(234, 88, 12, 0.28)"
          strokeWidth="0.65"
          strokeLinejoin="round"
        />
        {/* Verification tick */}
        <path
          d="M9.8 16.2 L14.3 20.7 L23.2 11.2"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/**
 * @param {{ fontSize: number }} props
 */
function Wordmark({ fontSize }) {
  return (
    <span style={{ ...wordmarkStyleBase, fontSize }}>
      <span style={{ fontWeight: 400, color: '#78716C' }}>Test</span>
      <span style={{ fontWeight: 700, color: '#EA580C' }}>Forge</span>
    </span>
  )
}

/**
 * Full horizontal logo: icon + wordmark.
 * @param {{ size?: LogoSize; className?: string; onClick?: () => void }} props
 */
export function LogoFull({ size = 'md', className = '', onClick }) {
  const tokens = getSizeTokens(size)
  const gradId = useId().replace(/:/g, '')
  const [hovered, setHovered] = useState(false)

  const rowStyle = {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.gap,
    verticalAlign: 'middle',
  }

  const inner = (
    <>
      <IconMark
        pixelSize={tokens.icon}
        gradientId={gradId}
        interactive
        hovered={hovered}
        decorative
      />
      <span aria-hidden="true">
        <Wordmark fontSize={tokens.font} />
      </span>
    </>
  )

  if (typeof onClick === 'function') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        style={{ ...btnReset, ...rowStyle }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="TestForge"
      >
        {inner}
      </button>
    )
  }

  return (
    <div
      className={className}
      style={rowStyle}
      role="img"
      aria-label="TestForge logo"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {inner}
    </div>
  )
}

/**
 * Icon-only mark.
 * @param {{ size?: LogoSize; className?: string; onClick?: () => void }} props
 */
export function LogoIcon({ size = 'md', className = '', onClick }) {
  const tokens = getSizeTokens(size)
  const gradId = useId().replace(/:/g, '')
  const [hovered, setHovered] = useState(false)

  const wrapStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
  }

  const mark = (
    <IconMark
      pixelSize={tokens.icon}
      gradientId={gradId}
      interactive
      hovered={hovered}
    />
  )

  if (typeof onClick === 'function') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        style={{ ...btnReset, ...wrapStyle }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="TestForge"
      >
        {mark}
      </button>
    )
  }

  return (
    <span
      className={className}
      style={wrapStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {mark}
    </span>
  )
}

/**
 * Stacked logo: icon above wordmark, centered.
 * @param {{ size?: LogoSize; className?: string; onClick?: () => void }} props
 */
export function LogoStacked({ size = 'md', className = '', onClick }) {
  const tokens = getSizeTokens(size)
  const gradId = useId().replace(/:/g, '')

  const colStyle = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: tokens.stackGap,
  }

  const inner = (
    <>
      <IconMark
        pixelSize={tokens.icon}
        gradientId={gradId}
        interactive={false}
        decorative
      />
      <span aria-hidden="true">
        <Wordmark fontSize={tokens.font} />
      </span>
    </>
  )

  if (typeof onClick === 'function') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        style={{ ...btnReset, ...colStyle }}
        aria-label="TestForge"
      >
        {inner}
      </button>
    )
  }

  return (
    <div className={className} style={colStyle} role="img" aria-label="TestForge logo">
      {inner}
    </div>
  )
}

export default LogoFull
