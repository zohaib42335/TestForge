import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function createRun(projectId, data) {
  const response = await api.post(`/projects/${projectId}/runs`, data)
  return unwrap(response)
}

export async function getRuns(projectId, params = {}) {
  const response = await api.get(`/projects/${projectId}/runs`, { params })
  return unwrap(response)
}

export async function getRun(projectId, runId) {
  const response = await api.get(`/projects/${projectId}/runs/${runId}`)
  return unwrap(response)
}

export async function startRun(projectId, runId) {
  const response = await api.post(`/projects/${projectId}/runs/${runId}/start`)
  return unwrap(response)
}

export async function updateRunResult(projectId, runId, resultId, data) {
  const response = await api.patch(
    `/projects/${projectId}/runs/${runId}/results/${resultId}`,
    data,
  )
  return unwrap(response)
}

export async function deleteRun(projectId, runId) {
  const response = await api.delete(`/projects/${projectId}/runs/${runId}`)
  return unwrap(response)
}

export async function getRunStats(projectId, runId) {
  const response = await api.get(`/projects/${projectId}/runs/${runId}/stats`)
  return unwrap(response)
}
