import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Homepage from '../UsersPages/Homepage'
import Services from '../UsersPages/Services'
import SearchTasker from '../UsersPages/SearchTasker'
import TaskerProfile from '../UsersPages/TaskerProfile'
import UserProfile from '../UsersPages/UserProfile'
import TaskDetail from '../UsersPages/TaskDetail'
import Login from '../UsersPages/Login'
import NotFound from '../UsersPages/NotFound'
import TaskersDashboard from '../TaskersPages/TaskersDashboard'
import ProtectedRoute from '../components/common/ProtectedRoute'
import { ROUTES } from './paths'

/**
 * Main Routing Configuration for TaskMate application
 * Includes Public Routes, Auth Login/Register Route, and Protected Routes guarded by JWT
 */
export default function AppRoutes() {
  const navigate = useNavigate()

  // Adapter for components expecting onNavigate('page-string', state)
  const handleNavigate = (page, state) => {
    const pageRouteMap = {
      home: ROUTES.HOME,
      login: ROUTES.LOGIN,
      services: ROUTES.SERVICES,
      search: ROUTES.SEARCH,
      'become-tasker': ROUTES.TASKER_DASHBOARD,
      'tasker-dashboard': ROUTES.TASKER_DASHBOARD,
      'task-detail': ROUTES.TASK_DETAIL,
      profile: ROUTES.USER_PROFILE,
      'user-profile': ROUTES.USER_PROFILE,
      'tasker-profile': ROUTES.PROFILE,
    }
    const target = pageRouteMap[page] || page
    navigate(target, { state })
  }

  return (
    <Routes>
      {/* 1. Trang Đăng nhập & Đăng ký */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path="/register" element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* 2. Các trang Công khai (Public Routes) */}
      <Route path={ROUTES.HOME} element={<Homepage onNavigate={handleNavigate} />} />
      <Route path="/home" element={<Navigate to={ROUTES.HOME} replace />} />
      <Route path={ROUTES.SERVICES} element={<Services onNavigate={handleNavigate} />} />
      <Route path={ROUTES.SEARCH} element={<SearchTasker onNavigate={handleNavigate} />} />
      <Route path="/taskers" element={<Navigate to={ROUTES.SEARCH} replace />} />

      {/* 3. Các trang Riêng tư / Có ID người dùng yêu cầu JWT qua kiểm duyệt (Protected Routes) */}
      <Route
        path={ROUTES.TASK_DETAIL}
        element={
          <ProtectedRoute>
            <TaskDetail onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <ProtectedRoute>
            <TaskDetail onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <TaskerProfile onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.USER_PROFILE}
        element={
          <ProtectedRoute>
            <UserProfile onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TASKER_DASHBOARD}
        element={
          <ProtectedRoute>
            <TaskersDashboard onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute>
            <TaskerProfile onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />

      {/* 4. 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
