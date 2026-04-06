/**
 * @fileoverview Firebase Web SDK initialization using Vite environment variables.
 */

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

/**
 * Reads a trimmed env value or null if missing.
 * @param {string} key
 * @returns {string|null}
 */
function readEnv(key) {
  try {
    const v = import.meta.env[key]
    if (v == null || String(v).trim() === '') return null
    return String(v).trim()
  } catch {
    return null
  }
}

/**
 * Validates Firebase web config from `.env` (VITE_* keys).
 * @returns {{ ok: true, config: import('firebase/app').FirebaseOptions } | { ok: false, message: string }}
 */
export function getFirebaseWebConfig() {
  const apiKey = readEnv('VITE_FIREBASE_API_KEY')
  const authDomain = readEnv('VITE_FIREBASE_AUTH_DOMAIN')
  const projectId = readEnv('VITE_FIREBASE_PROJECT_ID')
  const storageBucket = readEnv('VITE_FIREBASE_STORAGE_BUCKET')
  const messagingSenderId = readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID')
  const appId = readEnv('VITE_FIREBASE_APP_ID')

  /** @type {string[]} */
  const missing = []
  if (!apiKey) missing.push('VITE_FIREBASE_API_KEY')
  if (!authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN')
  if (!projectId) missing.push('VITE_FIREBASE_PROJECT_ID')
  if (!storageBucket) missing.push('VITE_FIREBASE_STORAGE_BUCKET')
  if (!messagingSenderId) missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID')
  if (!appId) missing.push('VITE_FIREBASE_APP_ID')

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Firebase is not configured. Add these to .env and restart the dev server: ${missing.join(', ')}.`,
    }
  }

  return {
    ok: true,
    config: {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    },
  }
}

const _cfg = getFirebaseWebConfig()

/** @type {boolean} */
export const isFirebaseConfigured = _cfg.ok

/** @type {string} */
export const firebaseConfigurationError = _cfg.ok ? '' : _cfg.message

/** @type {import('firebase/app').FirebaseApp|null} */
let firebaseApp = null

/**
 * Returns the singleton Firebase app, or null if env is incomplete.
 * @returns {import('firebase/app').FirebaseApp|null}
 */
export function getFirebaseApp() {
  if (!_cfg.ok) return null
  if (!firebaseApp) {
    firebaseApp =
      getApps().length > 0 ? getApps()[0] : initializeApp(_cfg.config)
  }
  return firebaseApp
}

/**
 * Returns the Firebase Auth instance, or null if not configured.
 * @returns {import('firebase/auth').Auth|null}
 */
export function getFirebaseAuth() {
  const app = getFirebaseApp()
  if (!app) return null
  return getAuth(app)
}
