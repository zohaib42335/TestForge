import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import usePermissions from '../hooks/usePermissions.js'
import ProjectSwitcher from './ProjectSwitcher.jsx'

/**
 * Builds a project-scoped path when project id exists.
 *
 * @param {string|null|undefined} projectId
 * @param {string} suffix
 * @returns {string}
 */
function projectPath(projectId, suffix) {
  if (!projectId) return '/dashboard'
  return `/projects/${projectId}${suffix}`
}

/**
 * App sidebar with role-based menu visibility.
 *
 * @param {{ activeProjectId?: string|null, mobileOpen?: boolean, onCloseMobile?: () => void }} props
 * @returns {import('react').ReactNode}
 */
export default function Sidebar({ activeProjectId = null, mobileOpen = false, onCloseMobile }) {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const { can, role } = usePermissions()
  const [collapsed, setCollapsed] = useState(false)

  const common = [
    { label: 'Dashboard', to: '/dashboard', icon: 'grid' },
    { label: 'My Test Cases', to: projectPath(activeProjectId, '/test-cases?mine=true'), icon: 'clipboard' },
  ]
  const work = can('executeTestRun')
    ? [
        { label: 'Test Cases', to: projectPath(activeProjectId, '/test-cases'), icon: 'list' },
        { label: 'Test Runs', to: projectPath(activeProjectId, '/runs'), icon: 'play' },
      ]
    : []
  const reports = can('viewReports')
    ? [{ label: 'Reports', to: projectPath(activeProjectId, '/reports'), icon: 'chart' }]
    : []
  const admin = [
    can('manageTeam') ? { label: 'Team', to: '/settings/team', icon: 'users' } : null,
    can('accessBilling') ? { label: 'Billing', to: '/settings/billing', icon: 'card' } : null,
    can('manageTeam') ? { label: 'Settings', to: '/settings', icon: 'gear' } : null,
  ].filter(Boolean)

  /**
   * @param {string} icon
   * @returns {import('react').ReactNode}
   */
  const renderIcon = (icon) => {
    const cls = 'h-4 w-4'
    if (icon === 'clipboard') {
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 4h6l1 2h3v14H5V6h3l1-2Z" />
        </svg>
      )
    }
    if (icon === 'list') {
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      )
    }
    if (icon === 'play') {
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m8 5 11 7-11 7V5Z" />
        </svg>
      )
    }
    if (icon === 'chart') {
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 19V5M10 19v-8M16 19V9M22 19V3" />
        </svg>
      )
    }
    if (icon === 'users') {
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="3.5" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.9" />
          <path d="M16 3.1a3.5 3.5 0 0 1 0 6.8" />
        </svg>
      )
    }
    if (icon === 'card') {
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      )
    }
    if (icon === 'gear') {
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1A1.7 1.7 0 0 0 10.2 3V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      )
    }
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="8" height="8" />
        <rect x="13" y="3" width="8" height="8" />
        <rect x="3" y="13" width="8" height="8" />
        <rect x="13" y="13" width="8" height="8" />
      </svg>
    )
  }

  const content = (
    <aside className={`h-full overflow-visible border-r border-[#D6E0F5] bg-white ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className="relative z-30 border-b border-[#D6E0F5] p-3">
        <div className="mb-2 flex items-center justify-between">
          {!collapsed ? <p className="text-sm font-semibold text-[#1A3263]">Navigation</p> : null}
          <button
            type="button"
            onClick={() => setCollapsed((p) => !p)}
            className="rounded border border-[#D6E0F5] px-2 py-1 text-xs text-[#1A3263]"
          >
            {collapsed ? '>>' : '<<'}
          </button>
        </div>
        {!collapsed ? <ProjectSwitcher /> : null}
      </div>

      <nav className="relative z-10 p-2">
        {[...common, ...work, ...reports, ...admin].map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            onClick={() => onCloseMobile?.()}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-2 rounded-md border-l-4 px-3 py-2 text-sm ${
                isActive
                  ? 'border-l-[#1A3263] bg-[#EEF2FB] text-[#1A3263]'
                  : 'border-l-transparent text-[#5A6E9A] hover:bg-[#F4F7FF]'
              }`
            }
          >
            <span className="inline-flex h-5 w-5 items-center justify-center">{renderIcon(item.icon)}</span>
            {!collapsed ? <span>{item.label}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-[#D6E0F5] p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A3263] text-xs text-white">
            {(currentUser?.displayName || currentUser?.email || '?').charAt(0).toUpperCase()}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#1A3263]">
                {currentUser?.displayName || 'User'}
              </p>
              <p className="text-[10px] text-[#5A6E9A]">{String(role).replace('_', ' ')}</p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
          className="w-full rounded-md border border-[#D6E0F5] px-3 py-2 text-left text-xs text-red-600 hover:bg-[#FFF1F1]"
        >
          {!collapsed ? 'Sign out' : '⎋'}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <div className="hidden md:block">{content}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => onCloseMobile?.()}
          />
          <div className="relative h-full">{content}</div>
        </div>
      ) : null}
    </>
  )
}
