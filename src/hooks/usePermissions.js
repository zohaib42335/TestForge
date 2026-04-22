import { useAuth } from '../context/AuthContext.jsx'

const PERMISSIONS = {
  createProject: ['ADMIN', 'QA_MANAGER'],
  updateProject: ['ADMIN', 'QA_MANAGER'],
  archiveProject: ['ADMIN'],
  manageTeam: ['ADMIN'],
  accessBilling: ['ADMIN'],
  viewReports: ['ADMIN', 'QA_MANAGER', 'VIEWER'],
  createTestCase: ['ADMIN', 'QA_MANAGER'],
  editTestCase: ['ADMIN', 'QA_MANAGER'],
  deleteTestCase: ['ADMIN', 'QA_MANAGER'],
  duplicateTestCase: ['ADMIN', 'QA_MANAGER'],
  createTestRun: ['ADMIN', 'QA_MANAGER'],
  deleteTestRun: ['ADMIN', 'QA_MANAGER'],
  executeTestRun: ['ADMIN', 'QA_MANAGER', 'TESTER'],
  addComment: ['ADMIN', 'QA_MANAGER', 'TESTER'],
  viewActivityLog: ['ADMIN', 'QA_MANAGER'],
  manageSuites: ['ADMIN', 'QA_MANAGER'],
  importTestCases: ['ADMIN', 'QA_MANAGER'],
  exportData: ['ADMIN', 'QA_MANAGER'],
}

/**
 * Returns role-based permission helpers for UI guards.
 *
 * @returns {{ role: string, can: (permission: keyof typeof PERMISSIONS) => boolean }}
 */
export default function usePermissions() {
  const { userProfile, currentUser } = useAuth()
  const role = String(userProfile?.role || currentUser?.role || 'VIEWER')

  /**
   * Checks if current role can execute permission.
   *
   * @param {keyof typeof PERMISSIONS} permission
   * @returns {boolean}
   */
  const can = (permission) => {
    const allowed = PERMISSIONS[permission]
    return Array.isArray(allowed) ? allowed.includes(role) : false
  }

  return { can, role }
}
