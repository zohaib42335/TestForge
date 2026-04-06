/**
 * @fileoverview Firestore data-layer helpers for TestForge (Step 2 — no UI wiring yet).
 * All functions expect the **Firebase Auth uid** as `userId` (e.g. `auth.currentUser.uid`).
 * They return a consistent result object instead of throwing to keep Step 3 integration predictable.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import { getFirebaseApp } from './config.js'
import {
  COL_USERS,
  SCHEMA_VERSION,
  SUB_TEMPLATES,
  SUB_TEST_CASES,
} from './schema.js'

/**
 * @typedef {Object} ServiceResult
 * @property {boolean} success
 * @property {string} [error] - Human-readable message safe to surface in UI
 * @property {string} [code] - Firebase error code when available
 */

/**
 * @typedef {Object} TestCaseFirestore
 * @property {string} id - Firestore document id
 * @property {string} [testCaseId] - Human id e.g. TC-001
 * @property {string} [module]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [preconditions]
 * @property {string} [testSteps]
 * @property {string} [expectedResult]
 * @property {string} [actualResult]
 * @property {string} [status]
 * @property {string} [priority]
 * @property {string} [severity]
 * @property {string} [testType]
 * @property {string} [environment]
 * @property {string} [assignedTo]
 * @property {string} [createdBy]
 * @property {string} [createdDate]
 * @property {string} [executionDate]
 * @property {string} [comments]
 * @property {string} [automationStatus]
 * @property {string} [bugId]
 * @property {import('firebase/firestore').Timestamp|Date|*} [createdAt]
 * @property {import('firebase/firestore').Timestamp|Date|*} [updatedAt]
 * @property {number} [schemaVersion]
 * @property {string} [ownerId]
 */

/**
 * @typedef {Object} TemplateFirestore
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {Record<string, string>} [defaults]
 * @property {import('firebase/firestore').Timestamp|Date|*} [createdAt]
 * @property {import('firebase/firestore').Timestamp|Date|*} [updatedAt]
 * @property {number} [schemaVersion]
 * @property {string} [ownerId]
 */

/** @returns {import('firebase/firestore').Firestore|null} */
export function getDb() {
  const app = getFirebaseApp()
  if (!app) return null
  try {
    return getFirestore(app)
  } catch (e) {
    console.error('[firestore] getDb failed:', e)
    return null
  }
}

/**
 * @param {unknown} err
 * @returns {{ message: string, code?: string }}
 */
function normalizeError(err) {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const code = String(err.code)
    const message = String(err.message)
    return { message, code }
  }
  if (err instanceof Error) {
    return { message: err.message }
  }
  return { message: 'An unexpected error occurred.' }
}

/**
 * Removes keys with `undefined` so Firestore does not reject writes.
 * @param {Record<string, unknown>} obj
 * @returns {Record<string, unknown>}
 */
function stripUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  )
}

/**
 * @param {string} userId
 * @returns {ServiceResult & { userId?: never }}
 */
function requireUid(userId) {
  if (typeof userId !== 'string' || userId.trim() === '') {
    return {
      success: false,
      error: 'A valid authenticated user id is required.',
      code: 'invalid-argument',
    }
  }
  return { success: true }
}

/**
 * @param {import('firebase/firestore').DocumentData} data
 * @param {string} docId
 * @returns {TestCaseFirestore}
 */
function mapTestCaseDoc(data, docId) {
  return {
    id: docId,
    ...(data && typeof data === 'object' ? data : {}),
  }
}

/**
 * @param {import('firebase/firestore').DocumentData} data
 * @param {string} docId
 * @returns {TemplateFirestore}
 */
function mapTemplateDoc(data, docId) {
  return {
    id: docId,
    ...(data && typeof data === 'object' ? data : {}),
  }
}

/**
 * Reads all test cases for a user, newest `updatedAt` first.
 * @param {string} userId - Firebase Auth uid
 * @returns {Promise<ServiceResult & { data?: TestCaseFirestore[] }>}
 */
export async function getTestCases(userId) {
  const gate = requireUid(userId)
  if (!gate.success) return gate

  const db = getDb()
  if (!db) {
    return {
      success: false,
      error: 'Firebase is not configured or Firestore failed to initialize.',
      code: 'failed-precondition',
    }
  }

  try {
    const col = collection(db, COL_USERS, userId, SUB_TEST_CASES)
    const q = query(col, orderBy('updatedAt', 'desc'))
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => mapTestCaseDoc(d.data(), d.id))
    return { success: true, data: items }
  } catch (err) {
    const { message, code } = normalizeError(err)
    console.error('[firestore] getTestCases:', err)
    return { success: false, error: message, code }
  }
}

/**
 * Creates a new test case document. Returns the new Firestore document id.
 * @param {string} userId
 * @param {Record<string, unknown>} payload - Field values (strings recommended for parity with localStorage)
 * @returns {Promise<ServiceResult & { id?: string }>}
 */
export async function addTestCase(userId, payload) {
  const gate = requireUid(userId)
  if (!gate.success) return gate

  const db = getDb()
  if (!db) {
    return {
      success: false,
      error: 'Firebase is not configured or Firestore failed to initialize.',
      code: 'failed-precondition',
    }
  }

  try {
    const body = stripUndefined({
      ...payload,
      schemaVersion: SCHEMA_VERSION,
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const col = collection(db, COL_USERS, userId, SUB_TEST_CASES)
    const ref = await addDoc(col, body)
    return { success: true, id: ref.id }
  } catch (err) {
    const { message, code } = normalizeError(err)
    console.error('[firestore] addTestCase:', err)
    return { success: false, error: message, code }
  }
}

/**
 * Merges partial fields into an existing test case.
 * @param {string} userId
 * @param {string} docId - Firestore document id (**not** the human `testCaseId` unless you used it as doc id)
 * @param {Record<string, unknown>} partial
 * @returns {Promise<ServiceResult>}
 */
export async function updateTestCase(userId, docId, partial) {
  const gate = requireUid(userId)
  if (!gate.success) return gate
  if (typeof docId !== 'string' || docId.trim() === '') {
    return {
      success: false,
      error: 'Document id is required for update.',
      code: 'invalid-argument',
    }
  }

  const db = getDb()
  if (!db) {
    return {
      success: false,
      error: 'Firebase is not configured or Firestore failed to initialize.',
      code: 'failed-precondition',
    }
  }

  try {
    const ref = doc(db, COL_USERS, userId, SUB_TEST_CASES, docId)
    const body = stripUndefined({
      ...partial,
      updatedAt: serverTimestamp(),
    })
    await updateDoc(ref, body)
    return { success: true }
  } catch (err) {
    const { message, code } = normalizeError(err)
    console.error('[firestore] updateTestCase:', err)
    return { success: false, error: message, code }
  }
}

/**
 * Deletes a test case document.
 * @param {string} userId
 * @param {string} docId - Firestore document id
 * @returns {Promise<ServiceResult>}
 */
export async function deleteTestCase(userId, docId) {
  const gate = requireUid(userId)
  if (!gate.success) return gate
  if (typeof docId !== 'string' || docId.trim() === '') {
    return {
      success: false,
      error: 'Document id is required for delete.',
      code: 'invalid-argument',
    }
  }

  const db = getDb()
  if (!db) {
    return {
      success: false,
      error: 'Firebase is not configured or Firestore failed to initialize.',
      code: 'failed-precondition',
    }
  }

  try {
    const ref = doc(db, COL_USERS, userId, SUB_TEST_CASES, docId)
    await deleteDoc(ref)
    return { success: true }
  } catch (err) {
    const { message, code } = normalizeError(err)
    console.error('[firestore] deleteTestCase:', err)
    return { success: false, error: message, code }
  }
}

/**
 * Lists all templates for a user, newest first.
 * @param {string} userId
 * @returns {Promise<ServiceResult & { data?: TemplateFirestore[] }>}
 */
export async function getTemplates(userId) {
  const gate = requireUid(userId)
  if (!gate.success) return gate

  const db = getDb()
  if (!db) {
    return {
      success: false,
      error: 'Firebase is not configured or Firestore failed to initialize.',
      code: 'failed-precondition',
    }
  }

  try {
    const col = collection(db, COL_USERS, userId, SUB_TEMPLATES)
    const q = query(col, orderBy('updatedAt', 'desc'))
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => mapTemplateDoc(d.data(), d.id))
    return { success: true, data: items }
  } catch (err) {
    const { message, code } = normalizeError(err)
    console.error('[firestore] getTemplates:', err)
    return { success: false, error: message, code }
  }
}

/**
 * Creates a template document.
 * @param {string} userId
 * @param {{ name: string, description?: string, defaults?: Record<string, string> }} payload
 * @returns {Promise<ServiceResult & { id?: string }>}
 */
export async function addTemplate(userId, payload) {
  const gate = requireUid(userId)
  if (!gate.success) return gate

  if (!payload || typeof payload.name !== 'string' || payload.name.trim() === '') {
    return {
      success: false,
      error: 'Template name is required.',
      code: 'invalid-argument',
    }
  }

  const db = getDb()
  if (!db) {
    return {
      success: false,
      error: 'Firebase is not configured or Firestore failed to initialize.',
      code: 'failed-precondition',
    }
  }

  try {
    const body = stripUndefined({
      schemaVersion: SCHEMA_VERSION,
      ownerId: userId,
      name: payload.name.trim(),
      description:
        payload.description == null ? '' : String(payload.description).trim(),
      defaults:
        payload.defaults && typeof payload.defaults === 'object'
          ? payload.defaults
          : {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const col = collection(db, COL_USERS, userId, SUB_TEMPLATES)
    const ref = await addDoc(col, body)
    return { success: true, id: ref.id }
  } catch (err) {
    const { message, code } = normalizeError(err)
    console.error('[firestore] addTemplate:', err)
    return { success: false, error: message, code }
  }
}

/**
 * Deletes a template document.
 * @param {string} userId
 * @param {string} docId
 * @returns {Promise<ServiceResult>}
 */
export async function deleteTemplate(userId, docId) {
  const gate = requireUid(userId)
  if (!gate.success) return gate
  if (typeof docId !== 'string' || docId.trim() === '') {
    return {
      success: false,
      error: 'Document id is required for delete.',
      code: 'invalid-argument',
    }
  }

  const db = getDb()
  if (!db) {
    return {
      success: false,
      error: 'Firebase is not configured or Firestore failed to initialize.',
      code: 'failed-precondition',
    }
  }

  try {
    const ref = doc(db, COL_USERS, userId, SUB_TEMPLATES, docId)
    await deleteDoc(ref)
    return { success: true }
  } catch (err) {
    const { message, code } = normalizeError(err)
    console.error('[firestore] deleteTemplate:', err)
    return { success: false, error: message, code }
  }
}
