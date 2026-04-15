import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject } from '../hooks/useProject.js'
import { useAuth } from '../context/AuthContext.jsx'
import usePlanLimits from '../hooks/usePlanLimits.js'
import PlanLimitModal from './PlanLimitModal.jsx'

function truncate(value, max = 28) {
  if (!value) return ''
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export default function ProjectSwitcher() {
  const navigate = useNavigate()
  const { projects, activeProject, setActiveProject } = useProject()
  const { currentUser } = useAuth()
  const { isAtLimit, usage } = usePlanLimits()
  const [open, setOpen] = useState(false)
  const [showLimit, setShowLimit] = useState(false)

  const companyName = useMemo(() => currentUser?.companyName || 'Company', [currentUser])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-w-[230px] max-w-[340px] items-center justify-between gap-2 rounded-lg border border-[#C8D7F1] bg-white px-3 py-2 text-left shadow-sm"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1A3263]">
            {truncate(activeProject?.name || 'Select Project')}
          </p>
          <p className="truncate text-[11px] text-[#5A6E9A]">{companyName}</p>
        </div>
        <span className="text-xs text-[#1A3263]">{open ? '▲' : '▼'}</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-1 w-full rounded-lg border border-[#C8D7F1] bg-white py-1 shadow-lg">
          <div className="max-h-64 overflow-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  setActiveProject(project.id)
                  setOpen(false)
                  navigate('/dashboard')
                }}
                className={`w-full px-3 py-2 text-left text-sm ${
                  activeProject?.id === project.id
                    ? 'bg-[#EEF2FB] text-[#1A3263] font-medium'
                    : 'text-[#334A75] hover:bg-[#F5F8FF]'
                }`}
              >
                {truncate(project.name)}
              </button>
            ))}
          </div>
          <div className="border-t border-[#E5ECFA] pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                if (isAtLimit.projects) {
                  setShowLimit(true)
                } else {
                  navigate('/onboarding')
                }
              }}
              className="w-full px-3 py-2 text-left text-sm font-medium text-[#1A3263] hover:bg-[#F5F8FF]"
            >
              + Create New Project
            </button>
          </div>
        </div>
      ) : null}
      <PlanLimitModal
        open={showLimit}
        onClose={() => setShowLimit(false)}
        limitType="projects"
        used={usage.projects.used}
        max={usage.projects.max}
      />
    </div>
  )
}
