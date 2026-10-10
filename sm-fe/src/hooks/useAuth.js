import { useContext } from 'react'
import { AuthContext } from '../context/authContextDef'

/**
 * Custom Hook useAuth
 * Access global authentication state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
