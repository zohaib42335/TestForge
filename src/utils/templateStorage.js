/**
 * @fileoverview Persist custom user-defined test case templates in localStorage
 * (separate key from the main test case list).
 */

import { v4 as uuidv4 } from 'uuid'

/** @type {string} */
const STORAGE_KEY = 'qa-test-case-manager:customTemplates'

/**
 * @typedef {Object} CustomTemplate
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Record<string, string>} defaults - Partial form fields to merge when applying
 */

/**
 * @returns {boolean}
 */
function storageOk() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

/**
 * Loads custom templates from localStorage.
 * @returns {CustomTemplate[]}
 */
export function loadCustomTemplates() {
  if (!storageOk()) {
    console.warn('[templateStorage] localStorage unavailable.')
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t) =>
        t &&
        typeof t === 'object' &&
        typeof t.id === 'string' &&
        typeof t.name === 'string',
    )
  } catch (e) {
    console.warn('[templateStorage] Failed to parse custom templates.', e)
    return []
  }
}

/**
 * Persists the full custom template list.
 * @param {CustomTemplate[]} templates
 * @returns {boolean}
 */
export function saveCustomTemplatesList(templates) {
  if (!storageOk()) return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
    return true
  } catch (e) {
    console.warn('[templateStorage] Failed to save custom templates.', e)
    return false
  }
}

/**
 * Appends a new custom template.
 * @param {{ name: string, description?: string, defaults: Record<string, string> }} payload
 * @returns {{ success: boolean, message?: string, template?: CustomTemplate }}
 */
export function saveCustomTemplate(payload) {
  const name = payload?.name == null ? '' : String(payload.name).trim()
  if (!name) {
    return { success: false, message: 'Template name is required.' }
  }
  const description =
    payload?.description == null ? '' : String(payload.description).trim()
  const defaults =
    payload?.defaults && typeof payload.defaults === 'object'
      ? payload.defaults
      : {}

  const template = {
    id: `custom-${uuidv4()}`,
    name,
    description,
    defaults,
  }

  const list = loadCustomTemplates()
  list.push(template)
  const ok = saveCustomTemplatesList(list)
  if (!ok) {
    return { success: false, message: 'Could not save template to storage.' }
  }
  return { success: true, template }
}

/**
 * Removes a custom template by id.
 * @param {string} id
 * @returns {boolean}
 */
export function deleteCustomTemplate(id) {
  const list = loadCustomTemplates().filter((t) => t.id !== id)
  return saveCustomTemplatesList(list)
}
