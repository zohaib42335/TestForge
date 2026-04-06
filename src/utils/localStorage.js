/**
 * @fileoverview Persistence helpers for the test case list in `localStorage`.
 * All functions fail softly: they log warnings and return booleans / safe defaults; they never throw.
 */

/** @type {string} Storage key for the serialized test case array. */
const STORAGE_KEY = 'qa-test-case-manager:testCases'

/**
 * Returns whether `localStorage` appears usable in this environment.
 * @returns {boolean}
 */
function isStorageAvailable() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const k = '__qa_tcm_storage_test__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

/**
 * Saves test cases array to localStorage with error handling.
 * @param {Array} testCases
 * @returns {boolean} success
 */
export function saveToLocalStorage(testCases) {
  if (!isStorageAvailable()) {
    console.warn(
      '[qa-test-case-manager] saveToLocalStorage: localStorage is unavailable; data was not saved.',
    )
    return false
  }
  try {
    const payload = JSON.stringify(Array.isArray(testCases) ? testCases : [])
    window.localStorage.setItem(STORAGE_KEY, payload)
    return true
  } catch (e) {
    const name = e && typeof e === 'object' && 'name' in e ? e.name : ''
    if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn(
        '[qa-test-case-manager] saveToLocalStorage: storage quota exceeded; data was not saved.',
        e,
      )
    } else {
      console.warn('[qa-test-case-manager] saveToLocalStorage: failed to write.', e)
    }
    return false
  }
}

/**
 * Loads test cases from localStorage. Returns empty array if missing or corrupted.
 * @returns {Array}
 */
export function loadFromLocalStorage() {
  if (!isStorageAvailable()) {
    console.warn(
      '[qa-test-case-manager] loadFromLocalStorage: localStorage is unavailable; returning [].',
    )
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw == null || raw === '') return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      console.warn(
        '[qa-test-case-manager] loadFromLocalStorage: stored value was not an array; returning [].',
      )
      return []
    }
    return parsed
  } catch (e) {
    console.warn(
      '[qa-test-case-manager] loadFromLocalStorage: JSON parse failed; returning [].',
      e,
    )
    return []
  }
}

/**
 * Clears all test case data from localStorage.
 * @returns {boolean} success
 */
export function clearLocalStorage() {
  if (!isStorageAvailable()) {
    console.warn(
      '[qa-test-case-manager] clearLocalStorage: localStorage is unavailable; nothing was cleared.',
    )
    return false
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (e) {
    console.warn('[qa-test-case-manager] clearLocalStorage: failed to remove key.', e)
    return false
  }
}
