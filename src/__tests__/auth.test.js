import React from 'react'
import { render, screen } from '@testing-library/react'

import App from '../App.jsx'

jest.mock('../utils/googleSheets.js', () => ({
  extractTokenFromUrl: () => null,
  initiateGoogleSignIn: jest.fn(),
  syncToGoogleSheets: jest.fn(),
}))

jest.mock('../hooks/useConnectionState.js', () => ({
  useConnectionState: () => ({ isOnline: true }),
}))

jest.mock('../context/AuthContext.jsx', () => {
  const AuthProvider = ({ children }) => children
  const useAuth = () => ({
    user: null,
    loading: false,
    signOutUser: jest.fn(),
    // Login UI inputs
    configError: '',
    authError: '',
    clearAuthError: jest.fn(),
    signInWithGoogle: jest.fn(),
    signInWithEmailPassword: jest.fn(),
    registerWithEmailPassword: jest.fn(),
  })
  return { AuthProvider, useAuth }
})

describe('auth flow', () => {
  it('unauthenticated user sees Login', () => {
    render(<App />)

    expect(
      screen.getByText(/Sign in to manage test cases/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument()
  })
})

