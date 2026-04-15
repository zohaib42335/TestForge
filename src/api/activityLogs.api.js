import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function getProjectActivity(projectId, params = {}) {
  const response = await api.get(`/projects/${projectId}/activity`, { params })
  return unwrap(response)
}

export async function getEntityActivity(entityId) {
  const response = await api.get(`/activity/${entityId}/entity`)
  return unwrap(response)
}
