import { useState, useEffect } from 'react'
import { AuthContext } from './authContextDef'
import {
  getToken,
  setToken as saveToken,
  removeToken as clearToken,
  loginApi,
  registerApi,
  fetchCurrentUserApi,
} from '../services/authService'

/**
 * AuthProvider Component
 * Manages global authentication state, token storage and backend verification
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken())
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(getToken()))

  // Verify token with backend /api/auth/me on initial mount if token exists
  useEffect(() => {
    const savedToken = getToken()
    if (!savedToken) return

    let isMounted = true

    fetchCurrentUserApi(savedToken)
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.warn('Xác thực token thất bại:', err.message)
        if (isMounted) {
          clearToken()
          setToken(null)
          setUser(null)
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * Perform user login
   */
  const login = async (credentials) => {
    const response = await loginApi(credentials)
    if (response?.token) {
      saveToken(response.token)
      setToken(response.token)
      setUser(response.user)
    }
    return response
  }

  /**
   * Perform user registration
   */
  const register = async (payload) => {
    return await registerApi(payload)
  }

  /**
   * Perform logout
   */
  const logout = () => {
    clearToken()
    setToken(null)
    setUser(null)
  }

  /**
   * Update current user in memory
   */
  const updateUser = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : updatedData))
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
