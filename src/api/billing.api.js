import api from './axios.js'

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function createCheckoutSession(plan) {
  const response = await api.post('/billing/checkout', { plan })
  const data = unwrap(response)
  if (data?.url) {
    window.location.href = data.url
  }
  return data
}

export async function createPortalSession() {
  const response = await api.post('/billing/portal')
  const data = unwrap(response)
  if (data?.url) {
    window.location.href = data.url
  }
  return data
}

export async function getSubscription() {
  const response = await api.get('/billing/subscription')
  return unwrap(response)
}
