import usePermissions from '../hooks/usePermissions.js'

/**
 * Conditionally renders content by RBAC permission.
 *
 * @param {{ permission: string, children: import('react').ReactNode, fallback?: import('react').ReactNode }} props
 * @returns {import('react').ReactNode}
 */
export default function PermissionGate({ permission, children, fallback = null }) {
  const { can } = usePermissions()
  return can(permission) ? children : fallback
}
