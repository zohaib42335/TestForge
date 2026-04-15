/**
 * @fileoverview Template state hook backed by local storage.
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const TEMPLATE_STORAGE_KEY = 'testforge_custom_templates'

/**
 * useTemplates manages custom template CRUD for the authenticated user.
 *
 * @returns {{
 *   templates: Array<object>,
 *   loading: boolean,
 *   error: string,
 *   isSavingTemplate: boolean,
 *   deletingTemplateIds: Set<string>,
 *   addTemplate: (payload: { name: string, description?: string, defaults?: Record<string, string> }) => Promise<{ success: boolean, id?: string, error?: string }>,
 *   deleteTemplate: (docId: string) => Promise<{ success: boolean, error?: string }>,
 *   reloadTemplates: () => Promise<void>,
 * }}
 */
export function useTemplates() {
  const { currentUser } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [deletingTemplateIds, setDeletingTemplateIds] = useState(() => new Set())

  const loadTemplates = useCallback(async () => {
    const uid = currentUser?.id
    if (!uid) {
      setTemplates([])
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      const data = Array.isArray(parsed[uid]) ? parsed[uid] : []
      setTemplates(data)
      setError('')
    } catch {
      setTemplates([])
      setError('Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const addTemplate = useCallback(async (payload) => {
    const uid = currentUser?.id
    if (!uid) {
      return { success: false, error: 'You must be signed in to save templates.' }
    }

    setIsSavingTemplate(true)
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      const next = Array.isArray(parsed[uid]) ? parsed[uid] : []
      const id = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      next.unshift({
        id,
        name: String(payload?.name || 'Custom template').trim(),
        description: String(payload?.description || ''),
        defaults: payload?.defaults || {},
      })
      parsed[uid] = next
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(parsed))
      await loadTemplates()
      return { success: true, id }
    } catch {
      return { success: false, error: 'Failed to save template.' }
    } finally {
      setIsSavingTemplate(false)
    }
  }, [currentUser?.id, loadTemplates])

  const deleteTemplate = useCallback(async (docId) => {
    const uid = currentUser?.id
    if (!uid) {
      return { success: false, error: 'You must be signed in to delete templates.' }
    }
    if (typeof docId !== 'string' || docId.trim() === '') {
      return { success: false, error: 'Template document id is required.' }
    }

    const id = String(docId)
    setDeletingTemplateIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })

    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      const next = (Array.isArray(parsed[uid]) ? parsed[uid] : []).filter((x) => x.id !== id)
      parsed[uid] = next
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(parsed))
      await loadTemplates()
      return { success: true }
    } catch {
      return { success: false, error: 'Failed to delete template.' }
    } finally {
      setDeletingTemplateIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [currentUser?.id, loadTemplates])

  return {
    templates,
    loading,
    error,
    isSavingTemplate,
    deletingTemplateIds,
    addTemplate,
    deleteTemplate,
    reloadTemplates: loadTemplates,
  }
}
