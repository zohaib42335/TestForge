import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LogoFull } from './Logo.jsx'
import ProjectSwitcher from './ProjectSwitcher.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_META = {
  ADMIN: { icon: 'shield', color: 'text-[#1A3263]', bg: 'bg-[#EAF0FF]', label: 'Admin' },
  QA_MANAGER: { icon: 'briefcase', color: 'text-[#1D4ED8]', bg: 'bg-[#EAF3FF]', label: 'QA Manager' },
  TESTER: { icon: 'check', color: 'text-[#047857]', bg: 'bg-[#E8FAF2]', label: 'Tester' },
  VIEWER: { icon: 'eye', color: 'text-[#7C3AED]', bg: 'bg-[#F2ECFF]', label: 'Viewer' },
}

function RoleIcon({ kind }) {
  if (kind === 'briefcase') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="7" width="18" height="12" rx="2" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    )
  }
  if (kind === 'check') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    )
  }
  if (kind === 'eye') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
      <path d="m9.5 12 1.8 1.8 3.2-3.2" />
    </svg>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { currentUser, logout, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const roleMeta = ROLE_META[currentUser?.role] || { icon: 'shield', color: 'text-[#1A3263]', bg: 'bg-[#EAF0FF]', label: 'Member' }

  return (
    <header className="sticky top-0 z-40 border-b border-[#C8D7F1] bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="shrink-0">
            <LogoFull size="sm" />
          </button>
          <ProjectSwitcher />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A3263] text-sm font-semibold text-white"
          >
            {(currentUser?.displayName || currentUser?.email || '?').charAt(0).toUpperCase()}
          </button>

          {open ? (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-[#C8D7F1] bg-white py-1 shadow-lg">
              <div className="border-b border-[#EEF2FB] px-3 py-2">
                <p className="truncate text-sm font-semibold text-[#1A3263]">
                  {currentUser?.displayName || 'User'}
                </p>
                <p className="truncate text-xs text-[#5A6E9A]">{currentUser?.email}</p>
                <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${roleMeta.bg} ${roleMeta.color}`}>
                  <RoleIcon kind={roleMeta.icon} />
                  <span>{roleMeta.label}</span>
                </div>
              </div>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-[#1A3263] hover:bg-[#F4F7FF]"
              >
                Settings
              </Link>
              {isAdmin ? (
                <Link
                  to="/billing"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm text-[#1A3263] hover:bg-[#F4F7FF]"
                >
                  Billing
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  void logout()
                }}
                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-[#FFF1F1]"
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
