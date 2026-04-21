import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
    const original = error.config
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        const res = await axios.post(
          import.meta.env.VITE_API_URL + '/auth/refresh',
          {},
          { withCredentials: true },
        )
        const newToken = res?.data?.data?.accessToken
        setAccessToken(newToken)
        original.headers.Authorization = 'Bearer ' + newToken
        return api(original)
      } catch (refreshError) {
        setAccessToken(null)
        const isOnPublicAuthPage = PUBLIC_AUTH_PATHS.some((path) =>
          window.location.pathname.startsWith(path),
        )
        if (!isOnPublicAuthPage) {
          window.location.assign('/login')
        }
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.data?.error?.code === 'PLAN_LIMIT_REACHED') {
      window.dispatchEvent(
        new CustomEvent('plan-limit-reached', { detail: error.response.data.error }),
      )
    }

    return Promise.reject(error)
  },
)

export default api
