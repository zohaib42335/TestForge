import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function getOverviewReport(projectId) {
  const response = await api.get(`/projects/${projectId}/reports/overview`)
  return unwrap(response)
}

export async function getExecutionReport(projectId, runId) {
  const response = await api.get(`/projects/${projectId}/reports/runs/${runId}`)
  return unwrap(response)
}

export async function getCoverageReport(projectId) {
  const response = await api.get(`/projects/${projectId}/reports/coverage`)
  return unwrap(response)
}

export async function getTrendReport(projectId, days = 30) {
  const response = await api.get(`/projects/${projectId}/reports/trends`, {
    params: { days },
  })
  return unwrap(response)
}
