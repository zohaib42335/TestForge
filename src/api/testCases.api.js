import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function getTestCases(projectId, filters = {}) {
  const response = await api.get(`/projects/${projectId}/test-cases`, { params: filters })
  return unwrap(response)
}

export async function getTestCase(projectId, id) {
  const response = await api.get(`/projects/${projectId}/test-cases/${id}`)
  return unwrap(response)
}

export async function createTestCase(projectId, data) {
  const response = await api.post(`/projects/${projectId}/test-cases`, data)
  return unwrap(response)
}

export async function updateTestCase(projectId, id, data) {
  const response = await api.patch(`/projects/${projectId}/test-cases/${id}`, data)
  return unwrap(response)
}

export async function deleteTestCase(projectId, id) {
  const response = await api.delete(`/projects/${projectId}/test-cases/${id}`)
  return unwrap(response)
}

export async function duplicateTestCase(projectId, id) {
  const response = await api.post(`/projects/${projectId}/test-cases/${id}/duplicate`)
  return unwrap(response)
}

export async function bulkUpdateStatus(projectId, ids, status) {
  const response = await api.patch(`/projects/${projectId}/test-cases/bulk-status`, { ids, status })
  return unwrap(response)
}

export async function approveTestCase(projectId, id) {
  const response = await api.post(`/projects/${projectId}/test-cases/${id}/approve`)
  return unwrap(response)
}

export async function importTestCases(projectId, rows) {
  const response = await api.post(`/projects/${projectId}/test-cases/import`, { rows })
  return unwrap(response)
}

export async function exportTestCases(projectId) {
  const response = await api.get(`/projects/${projectId}/test-cases/export`)
  return unwrap(response)
}
