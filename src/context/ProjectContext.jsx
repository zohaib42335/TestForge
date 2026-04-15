import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getProjects } from '../api/projects.api.js'
import { useAuth } from './AuthContext.jsx'

const ACTIVE_PROJECT_STORAGE_KEY = 'testforge_active_project_id'
const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(
    localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) || null,
  )
  const [loading, setLoading] = useState(false)

  const refetchProjects = useCallback(async () => {
    if (!isAuthenticated) {
      setProjects([])
      return []
    }

    setLoading(true)
    try {
      const data = await getProjects()
      const list = Array.isArray(data) ? data : []
      setProjects(list)

      const stillExists = list.some((project) => project.id === activeProjectId)
      const nextId = stillExists
        ? activeProjectId
        : list.length > 0
          ? list[0].id
          : null

      setActiveProjectId(nextId)
      if (nextId) {
        localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, nextId)
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY)
      }

      return list
    } finally {
      setLoading(false)
    }
  }, [activeProjectId, isAuthenticated])

  useEffect(() => {
    void refetchProjects()
  }, [refetchProjects])

  const setActiveProject = useCallback((projectId) => {
    setActiveProjectId(projectId)
    if (projectId) {
      localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, projectId)
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY)
    }
  }, [])

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) || null,
    [projects, activeProjectId],
  )

  const value = useMemo(
    () => ({
      projects,
      activeProject,
      setActiveProject,
      loading,
      refetchProjects,
    }),
    [projects, activeProject, setActiveProject, loading, refetchProjects],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectContext must be used inside ProjectProvider')
  }
  return context
}
