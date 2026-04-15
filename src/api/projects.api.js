import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function createProject(data) {
  const response = await api.post('/projects', data)
  return unwrap(response)
}

export async function getProjects() {
  const response = await api.get('/projects')
  return unwrap(response)
}

export async function getProject(projectId) {
  const response = await api.get(`/projects/${projectId}`)
  return unwrap(response)
}

export async function updateProject(projectId, data) {
  const response = await api.patch(`/projects/${projectId}`, data)
  return unwrap(response)
}

export async function archiveProject(projectId) {
  const response = await api.delete(`/projects/${projectId}/archive`)
  return unwrap(response)
}

export async function addProjectMember(projectId, userId) {
  const response = await api.post(`/projects/${projectId}/members`, { userId })
  return unwrap(response)
}

export async function removeProjectMember(projectId, userId) {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`)
  return unwrap(response)
}
