import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function getSuites(projectId) {
  const response = await api.get(`/projects/${projectId}/suites`)
  return unwrap(response)
}

export async function createSuite(projectId, data) {
  const response = await api.post(`/projects/${projectId}/suites`, data)
  return unwrap(response)
}

export async function updateSuite(id, data) {
  const response = await api.patch(`/suites/${id}`, data)
  return unwrap(response)
}

export async function deleteSuite(id) {
  const response = await api.delete(`/suites/${id}`)
  return unwrap(response)
}
