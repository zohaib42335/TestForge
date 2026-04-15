/**
 * @fileoverview Permission flags for the signed-in user.
 */

import { useAuth } from '../context/AuthContext.jsx'

/**
 * Returns RBAC permission flags derived from the authenticated user profile.
 *
 * @returns {Object}
 */
const usePermissions = () => {
  const {
    canCreate,
    canEdit,
    canDelete,
    canManageRoles,
    canImport,
    canExport,
    canCreateRun,
    canDeleteRun,
    canExecuteRun,
    canBulkUpdate,
    canDuplicate,
    canManageTemplates,
    userProfile,
    isAdmin,
    isQALead,
    isTester,
  } = useAuth()

  return {
    canCreate,
    canEdit,
    canDelete,
    canManageRoles,
    canImport,
    canExport,
    canCreateRun,
    canDeleteRun,
    canExecuteRun,
    canBulkUpdate,
    canDuplicate,
    canManageTemplates,
    userProfile,
    isAdmin,
    isQALead,
    isTester,
    role:
      userProfile && typeof userProfile.role === 'string' ? userProfile.role : 'Tester',
  }
}

export default usePermissions
