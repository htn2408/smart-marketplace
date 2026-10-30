import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../routes/paths'

/**
 * ProtectedRoute Component
 * - Guard against unauthenticated visitors: redirects to /login
 * - Role-based authorization: redirects to home if role mismatch
 * - Displays loading screen while checking token with backend /api/auth/me
 */
export default function ProtectedRoute({ allowedRoles, redirectTo, children }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // 1. Đang kiểm tra token với Backend /api/auth/me
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-on-surface-variant font-body-sm text-sm">
          Đang xác thực thông tin...
        </p>
      </div>
    )
  }

  // 2. Chưa đăng nhập hoặc token không hợp lệ (bị BE từ chối)
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN || '/login'} state={{ from: location }} replace />
  }

  // 3. Kiểm tra phân quyền theo vai trò (Role Authorization: hỗ trợ cả user.role và mảng user.roles)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = [user?.role, ...(user?.roles || [])]
      .filter(Boolean)
      .map((r) => r.toUpperCase())

    const isAllowed = allowedRoles.some((role) =>
      userRoles.includes(role.toUpperCase())
    )

    if (!isAllowed) {
      // Nếu người dùng là Client cố vào trang dành riêng cho Thợ, tự động chuyển sang trang đăng ký Thợ
      const isTaskerRestricted = allowedRoles.some((r) =>
        ['TASKER', 'WORKER'].includes(r.toUpperCase())
      )

      if (isTaskerRestricted) {
        return <Navigate to={ROUTES.TASKER_REGISTER} replace />
      }

      return <Navigate to={redirectTo || ROUTES.HOME} replace />
    }
  }

  return children ? children : <Outlet />
}
