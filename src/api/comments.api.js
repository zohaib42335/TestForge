import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function getComments(testCaseId, type) {
  const response = await api.get(`/test-cases/${testCaseId}/comments`, {
    params: type ? { type } : {},
  })
  return unwrap(response)
}

export async function addComment(testCaseId, data) {
  const response = await api.post(`/test-cases/${testCaseId}/comments`, data)
  return unwrap(response)
}

export async function editComment(commentId, text) {
  const response = await api.patch(`/comments/${commentId}`, { text })
  return unwrap(response)
}

export async function deleteComment(commentId) {
  const response = await api.delete(`/comments/${commentId}`)
  return unwrap(response)
}

export async function getCommentCounts(projectId, testCaseIds) {
  const response = await api.get(`/projects/${projectId}/comment-counts`, {
    params: { testCaseIds: testCaseIds.join(',') },
  })
  return unwrap(response)
}
