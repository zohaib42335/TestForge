import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LogoFull } from './Logo.jsx'
import ProjectSwitcher from './ProjectSwitcher.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const navigate = useNavigate()
  const { currentUser, logout, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)

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
