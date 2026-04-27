import api, { getAccessToken, setAccessToken } from './axios.js'

export const apiClient = api
export { getAccessToken, setAccessToken }

function unwrap(response) {
  return response?.data?.data ?? response?.data
}

export async function signup(data) {
  const response = await api.post('/auth/signup', data)
  return unwrap(response)
}

export async function login(data) {
  const response = await api.post('/auth/login', data)
  return unwrap(response)
}

export async function googleLogin(idToken) {
  const response = await api.post('/auth/google', { idToken })
  return unwrap(response)
}

export async function logout(refreshToken) {
  const response = await api.post('/auth/logout', { refreshToken })
  return unwrap(response)
}

export async function refreshToken(refreshTokenValue) {
  const response = await api.post('/auth/refresh', { refreshToken: refreshTokenValue })
  return unwrap(response)
}

export async function forgotPassword(email) {
  const response = await api.post('/auth/forgot-password', { email })
  return unwrap(response)
}

export async function resetPassword(token, password) {
  const response = await api.post('/auth/reset-password', {
    token,
    newPassword: password,
  })
  return unwrap(response)
}

export async function getMe() {
  const response = await api.get('/auth/me')
  return unwrap(response)
}

export async function verifyEmail(token) {
  const response = await api.post('/auth/verify-email', { token })
  return unwrap(response)
}
