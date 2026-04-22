import axios from 'axios'

const FALLBACK_API_URL = 'http://localhost:3000/api/v1'
const API_BASE_URL = String(import.meta.env.VITE_API_URL || '').trim() || FALLBACK_API_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

let accessToken = null
const PUBLIC_AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/accept-invite']

export const setAccessToken = (token) => {
  accessToken = token
}

export const getAccessToken = () => accessToken

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = 'Bearer ' + accessToken
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data?.error?.code === 'PLAN_LIMIT_REACHED') {
      window.dispatchEvent(
        new CustomEvent('plan-limit-reached', { detail: error.response.data.error }),
      )
    }

    return Promise.reject(error)
  },
)

export default api
