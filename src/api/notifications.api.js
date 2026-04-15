import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function getNotifications(unreadOnly = false) {
  const response = await api.get('/notifications', {
    params: unreadOnly ? { unreadOnly: 'true' } : {},
  })
  return unwrap(response)
}

export async function getUnreadCount() {
  const response = await api.get('/notifications/unread-count')
  return unwrap(response)
}

export async function markRead(notificationId) {
  const response = await api.patch(`/notifications/${notificationId}/read`)
  return unwrap(response)
}

export async function markAllRead() {
  const response = await api.patch('/notifications/read-all')
  return unwrap(response)
}

export async function deleteNotification(notificationId) {
  const response = await api.delete(`/notifications/${notificationId}`)
  return unwrap(response)
}
