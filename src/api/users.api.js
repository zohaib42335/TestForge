import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function getCompanyUsers() {
  const response = await api.get('/users')
  return unwrap(response)
}

export async function updateUserRole(userId, role) {
  const response = await api.patch(`/users/${userId}/role`, { role })
  return unwrap(response)
}

export async function deactivateUser(userId) {
  const response = await api.delete(`/users/${userId}`)
  return unwrap(response)
}

export async function updateMyProfile(displayName) {
  const response = await api.patch('/users/me/profile', { displayName })
  return unwrap(response)
}

export async function inviteUser(data) {
  const response = await api.post('/invitations', data)
  return unwrap(response)
}

export async function getPendingInvitations() {
  const response = await api.get('/invitations')
  return unwrap(response)
}

export async function cancelInvitation(invitationId) {
  const response = await api.delete(`/invitations/${invitationId}`)
  return unwrap(response)
}

export async function resendInvitation(invitationId) {
  const response = await api.post(`/invitations/${invitationId}/resend`)
  return unwrap(response)
}

export async function acceptInvitation(payload) {
  const response = await api.post('/invitations/accept', payload)
  return unwrap(response)
}

export async function getMyCompany() {
  const response = await api.get('/companies/me')
  return unwrap(response)
}

export async function getCompanyUsage() {
  const response = await api.get('/companies/me/usage')
  return unwrap(response)
}
