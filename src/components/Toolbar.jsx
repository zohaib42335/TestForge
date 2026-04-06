/**
 * Toolbar — Top action bar with Google Sheets sync, Excel export, and auth profile menu.
 * @param {Object} props
 * @param {Function} props.onSync - Triggers Google Sheets sync
 * @param {Function} props.onExport - Triggers Excel export
 * @param {Object} props.syncStatus - { loading, success, error, message }
 * @param {string|null} props.accessToken - Current OAuth token
 * @param {Function} props.onSignIn - Triggers Google Sign In
 * @param {Function} props.onDisconnectSheets - Clears OAuth token / unlink (after connect)
 * @param {Function} props.onClearAll - Clears all test cases
 * @param {Function} props.onImport - Opens bulk import flow
 * @param {Function} [props.onSignOut] - Firebase sign-out
 * @param {{ email: string|null, photoURL: string|null, displayName: string|null, isGoogle: boolean }|null} [props.authProfile] - Signed-in user summary for avatar menu
 */

import { useEffect, useState } from 'react'
import { LogoFull } from './Logo.jsx'

/**
 * @param {{ className?: string; stroke?: string }} props
 * Use stroke="#ffffff" on green / dark buttons when currentColor fails to inherit.
 */
function IconLayoutGrid({
  className = 'h-4 w-4',
  stroke: strokeAttr = 'currentColor',
}) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeAttr}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}

/** Bold check for sync-success state (replaces Unicode ✓ for consistent rendering). */
function IconSyncSuccess() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        d="M20 6L9 17l-5-5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** X mark for sync-error state. */
function IconSyncError() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Sync / refresh arrows — matches other toolbar icons via currentColor. */
function IconSyncArrows() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3v5h-5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 21v-5h5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Exactly one control: loading / success / error / idle sync icon (never blank).
 * @param {{ loading?: boolean; success?: boolean; error?: boolean }} syncStatus
 */
function GoogleSheetsSyncGlyph({ syncStatus }) {
  const loading = syncStatus?.loading === true
  const success = syncStatus?.success === true
  const err = syncStatus?.error === true

  if (loading) {
    return (
      <span
        className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600"
        aria-hidden
      />
    )
  }
  if (success) {
    return <IconSyncSuccess />
  }
  if (err) {
    return <IconSyncError />
  }
  return <IconSyncArrows />
}

/** @param {{ className?: string }} props */
function IconDownload({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}

/** @param {{ className?: string }} props */
function IconUpload({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}

/** @param {{ className?: string }} props */
function IconTrash2({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}

/** Broken-link / unlink — disconnect Google Sheets. */
function IconUnlinkSheets({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 8h2a4 4 0 1 1-4 4v-2" />
      <path d="M8 16H6a4 4 0 1 1 4-4v2" />
      <line x1="9" x2="15" y1="9" y2="15" />
    </svg>
  )
}

const iconToolbarBtn =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 shadow-sm outline-none transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Toast-style hover tooltip for toolbar icon buttons.
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.hint]
 * @param {'default' | 'success' | 'destructive'} [props.variant]
 * @param {string} props.className - button classes
 * @param {import('react').ReactNode} props.children
 * @param {boolean} [props.disabled]
 * @param {() => void} [props.onClick]
 */
function IconWithHoverToast({
  label,
  hint,
  variant = 'default',
  className,
  children,
  disabled,
  onClick,
}) {
  const borderColor =
    variant === 'destructive'
      ? 'rgba(248, 113, 113, 0.45)'
      : variant === 'success'
        ? 'rgba(74, 222, 128, 0.5)'
        : 'rgba(253, 186, 116, 0.95)'

  return (
    <div className="group/icon relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={className}
      >
        {children}
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-[100] mt-2 w-max max-w-[16rem] -translate-x-1/2 opacity-0 shadow-lg transition-opacity duration-200 ease-out group-hover/icon:opacity-100 motion-reduce:transition-none"
      >
        {/* Chevron pointing up toward the icon */}
        <div
          className="absolute -top-[6px] left-1/2 flex -translate-x-1/2"
          aria-hidden
        >
          <div
            className="h-0 w-0 border-x-[7px] border-x-transparent border-b-[7px]"
            style={{ borderBottomColor: '#ffffff' }}
          />
        </div>
        <div
          className="rounded-lg border px-3 py-2 text-left shadow-md"
          style={{
            backgroundColor: '#ffffff',
            borderColor,
          }}
        >
          <p
            className="m-0 text-xs font-semibold leading-tight tracking-wide"
            style={{ color: '#ea580c' }}
          >
            {label}
          </p>
          {hint ? (
            <p
              className="m-0 mt-1 text-[11px] leading-snug"
              style={{ color: '#c2410c' }}
            >
              {hint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Derives a displayable first name from an email local part (e.g. john.doe@x → John).
 * @param {string|null|undefined} email
 * @returns {string}
 */
function firstNameFromEmail(email) {
  if (!email || typeof email !== 'string') return 'User'
  const local = email.split('@')[0]?.trim() || ''
  if (!local) return 'User'
  const segment = local.split(/[._+\-]/)[0] || local
  if (!segment) return 'User'
  return (
    segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
  )
}

/**
 * @param {Object} props
 * @param {{ email: string|null, photoURL: string|null, displayName: string|null, isGoogle: boolean }} props.profile
 * @param {() => void | Promise<void>} props.onSignOut
 */
function ProfileMenu({ profile, onSignOut }) {
  const { email, photoURL, displayName, isGoogle } = profile
  const showPhoto = Boolean(isGoogle && photoURL)
  const firstName = firstNameFromEmail(email)

  return (
    <div className="relative group">
      <button
        type="button"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-orange-200 bg-orange-50 text-stone-800 shadow-sm outline-none ring-offset-2 transition hover:border-orange-400 focus-visible:ring-2 focus-visible:ring-orange-500"
        aria-haspopup="true"
        aria-label="Account menu"
      >
        {showPhoto ? (
          <img
            src={photoURL}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="max-w-[2.35rem] truncate px-0.5 text-center text-[10px] font-semibold leading-tight">
            {firstName}
          </span>
        )}
      </button>

      {/* Bridge + panel: hover/focus keeps menu open; pointer-events toggled so gap does not dismiss */}
      <div
        className="absolute right-0 top-full z-50 -mt-0.5 pt-2 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
        role="region"
        aria-label="Account details"
      >
        <div className="w-64 rounded-xl border border-orange-200 bg-white p-3 shadow-lg">
          {displayName && (
            <p className="truncate text-sm font-semibold text-stone-800">{displayName}</p>
          )}
          {email && (
            <p
              className={`break-all text-xs text-stone-500 ${displayName ? 'mt-1' : ''}`}
              title={email}
            >
              {email}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              void onSignOut()
            }}
            className="mt-3 w-full rounded-lg border border-red-200 bg-white py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * @param {Object} props
 * @param {Function} props.onSync
 * @param {Function} props.onExport
 * @param {{ loading: boolean, success: boolean, error: boolean, message: string }} props.syncStatus
 * @param {string|null} props.accessToken
 * @param {Function} props.onSignIn
 * @param {Function} props.onDisconnectSheets
 * @param {Function} props.onClearAll
 * @param {Function} props.onImport
 * @param {Function} [props.onSignOut]
 * @param {{ email: string|null, photoURL: string|null, displayName: string|null, isGoogle: boolean }|null} [props.authProfile]
 */
export default function Toolbar({
  onSync,
  onExport,
  syncStatus,
  accessToken,
  onSignIn,
  onDisconnectSheets,
  onClearAll,
  onImport,
  onSignOut,
  authProfile,
}) {
  const [messageVisible, setMessageVisible] = useState(false)
  const [messageFading, setMessageFading] = useState(false)

  useEffect(() => {
    const msg = syncStatus?.message
    if (!msg || String(msg).trim() === '') {
      setMessageVisible(false)
      setMessageFading(false)
      return
    }

    setMessageVisible(true)
    setMessageFading(false)

    const fadeTimer = setTimeout(() => setMessageFading(true), 3500)
    const hideTimer = setTimeout(() => {
      setMessageVisible(false)
      setMessageFading(false)
    }, 4000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [syncStatus?.message, syncStatus?.success, syncStatus?.error])

  const handleClearAll = () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(
        'Delete all test cases from this browser? This cannot be undone.',
      )
    ) {
      onClearAll()
    }
  }

  const handleDisconnectSheets = () => {
    if (typeof onDisconnectSheets !== 'function') return
    if (
      typeof window !== 'undefined' &&
      window.confirm(
        'Unlink Google Sheets from this browser? You can connect again anytime.',
      )
    ) {
      onDisconnectSheets()
    }
  }

  const hasToken = accessToken != null && String(accessToken).trim() !== ''
  const showProfile =
    authProfile &&
    (authProfile.email || authProfile.photoURL) &&
    typeof onSignOut === 'function'

  return (
    <header className="sticky top-0 z-40 overflow-visible bg-white border-b border-orange-200 px-6 py-4 shadow-sm">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 overflow-visible">
        <div className="flex flex-wrap items-center justify-between gap-3 overflow-visible">
          <div className="flex min-w-0 flex-wrap items-center gap-3 overflow-visible">
            <h1 className="m-0 shrink-0 p-0">
              <LogoFull size="md" className="align-middle" />
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 overflow-visible pb-1">
              {!hasToken && (
                <IconWithHoverToast
                  label="Connect Google Sheets"
                  hint="Sign in with Google to link your spreadsheet."
                  className={iconToolbarBtn}
                  onClick={onSignIn}
                >
                  <IconLayoutGrid />
                </IconWithHoverToast>
              )}

              {hasToken && (
                <>
                  <IconWithHoverToast
                    label="Unlink Google Sheets"
                    hint="Remove the Google account link from this tab. Sync uses this connection."
                    variant="destructive"
                    className={`${iconToolbarBtn} border-orange-300 text-orange-700 hover:border-orange-400 hover:bg-orange-50`}
                    onClick={handleDisconnectSheets}
                  >
                    <IconUnlinkSheets />
                  </IconWithHoverToast>
                  <IconWithHoverToast
                    label="Sync to Google Sheets"
                    hint="Push your latest test cases to the linked sheet."
                    variant="default"
                    className={
                      syncStatus?.error === true
                        ? `${iconToolbarBtn} text-red-600 hover:text-red-700`
                        : syncStatus?.success === true
                          ? `${iconToolbarBtn} text-green-700 hover:text-green-800`
                          : iconToolbarBtn
                    }
                    disabled={syncStatus?.loading}
                    onClick={onSync}
                  >
                    <GoogleSheetsSyncGlyph syncStatus={syncStatus} />
                  </IconWithHoverToast>
                </>
              )}

              <IconWithHoverToast
                label="Export to Excel"
                hint="Download all cases as a spreadsheet file."
                className={iconToolbarBtn}
                onClick={onExport}
              >
                <IconDownload />
              </IconWithHoverToast>

              <IconWithHoverToast
                label="Import test cases"
                hint="Bulk-add cases from CSV or Excel."
                className={iconToolbarBtn}
                onClick={onImport}
              >
                <IconUpload />
              </IconWithHoverToast>

              <IconWithHoverToast
                label="Clear all test cases"
                hint="Permanently removes every case in this browser."
                variant="destructive"
                className={`${iconToolbarBtn} border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-500`}
                onClick={handleClearAll}
              >
                <IconTrash2 />
              </IconWithHoverToast>
            </div>
          </div>

          {showProfile && <ProfileMenu profile={authProfile} onSignOut={onSignOut} />}
        </div>

        {messageVisible && syncStatus?.message && (
          <p
            className={`max-w-xl text-sm transition-opacity duration-500 ${
              syncStatus.success ? 'text-green-600' : ''
            } ${syncStatus.error ? 'text-red-600' : ''} ${
              !syncStatus.success && !syncStatus.error ? 'text-stone-500' : ''
            } ${messageFading ? 'opacity-0' : 'opacity-100'}`}
            role="status"
          >
            {syncStatus.message}
          </p>
        )}
      </div>
    </header>
  )
}
