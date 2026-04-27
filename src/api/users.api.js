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
  // #region agent log
  fetch('http://127.0.0.1:7288/ingest/58efaff7-7b60-468a-a7ce-93907124bf9b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a35e5a'},body:JSON.stringify({sessionId:'a35e5a',runId:'pre-fix',hypothesisId:'H6',location:'users.api.js:29',message:'frontend inviteUser request start',data:{baseURL:api?.defaults?.baseURL||null,emailDomain:String(data?.email||'').split('@')[1]||null,role:data?.role||null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    const response = await api.post('/invitations', data)
    // #region agent log
    fetch('http://127.0.0.1:7288/ingest/58efaff7-7b60-468a-a7ce-93907124bf9b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a35e5a'},body:JSON.stringify({sessionId:'a35e5a',runId:'pre-fix',hypothesisId:'H6',location:'users.api.js:34',message:'frontend inviteUser response success',data:{status:response?.status||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return unwrap(response)
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7288/ingest/58efaff7-7b60-468a-a7ce-93907124bf9b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a35e5a'},body:JSON.stringify({sessionId:'a35e5a',runId:'pre-fix',hypothesisId:'H6',location:'users.api.js:39',message:'frontend inviteUser response error',data:{status:error?.response?.status||null,errorCode:error?.response?.data?.error?.code||null,errorMessage:error?.response?.data?.error?.message||error?.message||'unknown'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw error
  }
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
