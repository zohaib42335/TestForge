import { useAuth } from '../context/AuthContext.jsx'

export function useAuthContext() {
  return useAuth()
}

export default useAuthContext
