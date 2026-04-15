/**
 * TabNav — Underline tab strip for primary app navigation.
 * @param {Object} props
 * @param {'dashboard'|'runs'|'new'|'templates'|'all'|'team'|'activity'|'reports'} props.activeTab
 * @param {(tab: 'dashboard'|'runs'|'new'|'templates'|'all'|'team'|'activity'|'reports') => void} props.onTabChange
 * @param {number} props.testCaseCount
 * @param {boolean} [props.showTeamTab] - When true, show Admin-only Team tab
 * @param {boolean} [props.showActivityTab] - When true, show Admin/QA Lead Activity tab
 */

/** @typedef {'dashboard'|'runs'|'new'|'templates'|'all'|'team'|'activity'|'reports'} TabKey */

export default function TabNav({
  activeTab,
  onTabChange,
  testCaseCount,
  showTeamTab = false,
  showActivityTab = false,
}) {
  /** @type {Array<{ key: TabKey, label: string }>} */
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'runs', label: 'Test Runs' },
    { key: 'new', label: 'New Test Case' },
    { key: 'templates', label: 'Template Library' },
    { key: 'all', label: 'View All' },
    { key: 'reports', label: 'Reports' },
    ...(showTeamTab ? [{ key: /** @type {TabKey} */ ('team'), label: 'Team' }] : []),
    ...(showActivityTab ? [{ key: /** @type {TabKey} */ ('activity'), label: 'Activity' }] : []),
  ]

  return (
    <div className="hidden md:flex w-full flex-col border-b border-[#B0C0E0] bg-white px-4 shadow-none">
      <div className="scrollbar-hide -mx-3 flex flex-nowrap items-stretch gap-0 overflow-x-auto md:mx-0 md:overflow-visible">
        <div className="flex min-h-0 min-w-0 flex-nowrap md:w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                data-tour={`tab-${tab.key}`}
                aria-label={tab.label}
                title={tab.label}
                className={`inline-flex min-h-[44px] shrink-0 flex-nowrap items-center gap-1.5 whitespace-nowrap border-b-2 bg-transparent px-3 text-[13px] transition-[color,border-color] duration-150 ease-in-out md:h-11 md:min-h-0 md:px-4 ${
                  isActive
                    ? 'cursor-pointer border-[#1A3263] font-medium text-[#1A3263]'
                    : 'cursor-pointer border-transparent font-normal text-[#5A6E9A] hover:border-[#B0C0E0] hover:text-[#1A3263]'
                }`}
              >
                {tab.key === 'dashboard' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[14px] w-[14px] shrink-0"
                    aria-hidden
                  >
                    <path d="M4 13h6V4H4v9zm10 7h6V11h-6v9zM4 20h6v-5H4v5zm10-9h6V4h-6v7z" />
                  </svg>
                )}
                {tab.key === 'runs' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[14px] w-[14px] shrink-0"
                    aria-hidden
                  >
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                )}
                {tab.key === 'new' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[14px] w-[14px] shrink-0"
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
                {tab.key === 'templates' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[14px] w-[14px] shrink-0"
                    aria-hidden
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                )}
                {tab.key === 'all' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[14px] w-[14px] shrink-0"
                    aria-hidden
                  >
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
                {tab.key === 'team' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[14px] w-[14px] shrink-0"
                    aria-hidden
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                )}
                {tab.key === 'activity' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[14px] w-[14px] shrink-0"
                    aria-hidden
                  >
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
                {tab.key === 'reports' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[14px] w-[14px] shrink-0"
                    aria-hidden
                  >
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                )}
                <span className="hidden md:inline">{tab.label}</span>
                {tab.key === 'all' && (
                  <span className="rounded-full bg-[#D6E0F5] px-1.5 py-[1px] text-[10px] font-medium text-[#1A3263] md:ml-0.5">
                    {testCaseCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
