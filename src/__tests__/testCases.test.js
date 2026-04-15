import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import App from '../App.jsx'

jest.mock('../utils/googleSheets.js', () => ({
  extractTokenFromUrl: () => null,
  initiateGoogleSignIn: jest.fn(),
  syncToGoogleSheets: jest.fn(async () => ({
    success: true,
    message: 'ok',
  })),
}))

jest.mock('../context/AuthContext.jsx', () => {
  const signOutUser = jest.fn()
  return {
    AuthProvider: ({ children }) => children,
    useAuth: () => ({
      user: {
        uid: 'user-1',
        email: 'zohaib@example.com',
        photoURL: null,
        displayName: 'Zohaib',
        providerData: [],
      },
      currentUser: {
        uid: 'user-1',
        email: 'zohaib@example.com',
        photoURL: null,
        displayName: 'Zohaib',
        providerData: [],
      },
      loading: false,
      roleLoading: false,
      userProfile: { role: 'Admin', email: 'zohaib@example.com', displayName: 'Zohaib' },
      workspaceError: '',
      retryWorkspaceProfile: jest.fn(),
      isAdmin: true,
      isQALead: false,
      isTester: false,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canManageRoles: true,
      canImport: true,
      canExport: true,
      canCreateRun: true,
      canDeleteRun: true,
      canExecuteRun: true,
      canBulkUpdate: true,
      canDuplicate: true,
      canManageTemplates: true,
      signOutUser,
      configError: '',
      authError: '',
      clearAuthError: jest.fn(),
      signInWithGoogle: jest.fn(),
      signInWithEmailPassword: jest.fn(),
      registerWithEmailPassword: jest.fn(),
    }),
  }
})

jest.mock('../hooks/useConnectionState.js', () => ({
  useConnectionState: () => ({ isOnline: true }),
}))

jest.mock('../hooks/useTemplates.js', () => ({
  useTemplates: () => ({
    isSavingTemplate: false,
    addTemplate: jest.fn(),
    templates: [],
    loading: false,
    error: '',
    deletingTemplateIds: new Set(),
  }),
}))

describe('test cases UI (API-backed)', () => {
  it('renders the dashboard shell', async () => {
    render(<App />)
    expect(await screen.findByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('shows Team link for authorized user', async () => {
    render(<App />)
    const teamLink = await screen.findByRole('link', { name: /Team Management/i })
    fireEvent.click(teamLink)
    expect(teamLink).toBeInTheDocument()
  })
})

