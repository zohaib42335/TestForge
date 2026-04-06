/**
 * @fileoverview Firebase Authentication context: Google popup + email/password.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  firebaseConfigurationError,
} from '../firebase/config.js'

/**
 * @param {unknown} err
 * @returns {string}
 */
export function mapFirebaseAuthError(err) {
  const code =
    err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
  const fallback =
    err && typeof err === 'object' && 'message' in err
      ? String(err.message)
      : 'Authentication failed. Please try again.'

  /** @type {Record<string, string>} */
  const map = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential':
      'Invalid email or password. If you use Google sign-in, try that instead.',
    'auth/email-already-in-use': 'That email is already registered. Sign in instead.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Pop-up was blocked. Allow pop-ups for this site and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/operation-not-allowed':
      'This sign-in method is disabled in Firebase Console. Enable Email/Password and Google.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
  }

  return map[code] || fallback
}

/** @type {import('react').Context<AuthContextValue|null>} */
const AuthContext = createContext(null)

/**
 * @typedef {Object} AuthContextValue
 * @property {import('firebase/auth').User|null} user
 * @property {boolean} loading - True until first auth state is known
 * @property {string} configError - Non-empty if Firebase env vars are missing
 * @property {string} authError - Last operation error (user-facing); clear with clearAuthError
 * @property {() => void} clearAuthError
 * @property {() => Promise<void>} signInWithGoogle
 * @property {(email: string, password: string) => Promise<void>} signInWithEmailPassword
 * @property {(email: string, password: string) => Promise<void>} registerWithEmailPassword
 * @property {() => Promise<void>} signOutUser
 */

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  /** @type {[import('firebase/auth').User|null, React.Dispatch<React.SetStateAction<import('firebase/auth').User|null>>]} */
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configError] = useState(
    isFirebaseConfigured ? '' : firebaseConfigurationError,
  )
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      setUser(null)
      return
    }

    const auth = getFirebaseAuth()
    if (!auth) {
      setLoading(false)
      setAuthError('Firebase Auth could not be initialized.')
      return
    }

    const unsub = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setLoading(false)
      },
      (err) => {
        setAuthError(mapFirebaseAuthError(err))
        setUser(null)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [])

  const clearAuthError = useCallback(() => setAuthError(''), [])

  /**
   * @returns {Promise<void>}
   */
  const signInWithGoogle = useCallback(async () => {
    setAuthError('')
    if (!isFirebaseConfigured) {
      setAuthError(configError || firebaseConfigurationError)
      return
    }
    const auth = getFirebaseAuth()
    if (!auth) {
      setAuthError('Firebase Auth is not available.')
      return
    }
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err))
    }
  }, [configError])

  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  const signInWithEmailPassword = useCallback(async (email, password) => {
    setAuthError('')
    if (!isFirebaseConfigured) {
      setAuthError(configError || firebaseConfigurationError)
      return
    }
    const auth = getFirebaseAuth()
    if (!auth) {
      setAuthError('Firebase Auth is not available.')
      return
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err))
    }
  }, [configError])

  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  const registerWithEmailPassword = useCallback(async (email, password) => {
    setAuthError('')
    if (!isFirebaseConfigured) {
      setAuthError(configError || firebaseConfigurationError)
      return
    }
    const auth = getFirebaseAuth()
    if (!auth) {
      setAuthError('Firebase Auth is not available.')
      return
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err))
    }
  }, [configError])

  /**
   * @returns {Promise<void>}
   */
  const signOutUser = useCallback(async () => {
    setAuthError('')
    if (!isFirebaseConfigured) return
    const auth = getFirebaseAuth()
    if (!auth) return
    try {
      await signOut(auth)
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err))
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      configError,
      authError,
      clearAuthError,
      signInWithGoogle,
      signInWithEmailPassword,
      registerWithEmailPassword,
      signOutUser,
    }),
    [
      user,
      loading,
      configError,
      authError,
      clearAuthError,
      signInWithGoogle,
      signInWithEmailPassword,
      registerWithEmailPassword,
      signOutUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
