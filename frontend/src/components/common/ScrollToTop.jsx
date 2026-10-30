import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Automatically scrolls to top on route change
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return null
}
