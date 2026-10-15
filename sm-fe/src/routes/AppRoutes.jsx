import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Homepage from '../UsersPages/Homepage'
import Services from '../UsersPages/Services'
import FilterTasker from '../UsersPages/FilterTasker'
import TaskerProfile from '../UsersPages/TaskerProfile'
import UserProfile from '../UsersPages/UserProfile'
import TaskDetail from '../UsersPages/TaskDetail'
import Login from '../UsersPages/Login'
import NotFound from '../UsersPages/NotFound'
import TaskersDashboard from '../TaskersPages/TaskersDashboard'
import RequireAndCalendar from '../TaskersPages/Require&Calendar'
import TaskManager from '../UsersPages/TaskManager'
import ProtectedRoute from '../components/common/ProtectedRoute'
import { ROUTES } from './paths'

/**
 * Main Routing Configuration for TaskMate application
 * Structured with /client/* for Client/User and /tasker/* for Tasker/Worker
 */
export default function AppRoutes() {
  const navigate = useNavigate()

  // Adapter for components expecting onNavigate('page-string', state)
  const handleNavigate = (page, state) => {
    const pageRouteMap = {
      home: ROUTES.HOME,
      login: ROUTES.LOGIN,
      services: ROUTES.SERVICES,
      search: ROUTES.CLIENT_FILTER_TASKER,
      'filter-tasker': ROUTES.CLIENT_FILTER_TASKER,
      'become-tasker': ROUTES.TASKER_DASHBOARD,
      'tasker-dashboard': ROUTES.TASKER_DASHBOARD,
      'tasker-requests': ROUTES.TASKER_REQUESTS,
      requests: ROUTES.TASKER_REQUESTS,
      'my-tasks': ROUTES.CLIENT_TASKS,
      tasks: ROUTES.CLIENT_TASKS,
      'task-detail': ROUTES.CLIENT_TASK_DETAIL,
      profile: ROUTES.CLIENT_PROFILE,
      'user-profile': ROUTES.CLIENT_PROFILE,
      'tasker-profile': ROUTES.TASKER_PROFILE,
    }
    const target = pageRouteMap[page] || page
    navigate(target, { state })
  }

  return (
    <Routes>
      {/* 1. Public & Auth Routes */}
      <Route path={ROUTES.HOME} element={<Homepage onNavigate={handleNavigate} />} />
      <Route path="/home" element={<Navigate to={ROUTES.HOME} replace />} />
      <Route path={ROUTES.SERVICES} element={<Services onNavigate={handleNavigate} />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path="/register" element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* 2. Client Routes (/client/*) */}
      <Route
        path={ROUTES.CLIENT_TASKS}
        element={
          <ProtectedRoute>
            <TaskManager onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_TASK_DETAIL}
        element={
          <ProtectedRoute>
            <TaskDetail onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/tasks/:id"
        element={
          <ProtectedRoute>
            <TaskDetail onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_FILTER_TASKER}
        element={
          <ProtectedRoute>
            <FilterTasker onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_PROFILE}
        element={
          <ProtectedRoute>
            <UserProfile onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />

      {/* 3. Tasker Routes (/tasker/*) */}
      <Route
        path={ROUTES.TASKER_DASHBOARD}
        element={
          <ProtectedRoute>
            <TaskersDashboard onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TASKER_REQUESTS}
        element={
          <ProtectedRoute>
            <RequireAndCalendar onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TASKER_PROFILE}
        element={
          <ProtectedRoute>
            <TaskerProfile onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasker/:id"
        element={
          <ProtectedRoute>
            <TaskerProfile onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />

      {/* 4. Backward-Compatible Redirects */}
      <Route path="/my-tasks" element={<Navigate to={ROUTES.CLIENT_TASKS} replace />} />
      <Route path="/task-detail" element={<Navigate to={ROUTES.CLIENT_TASK_DETAIL} replace />} />
      <Route path="/tasks/:id" element={<Navigate to={ROUTES.CLIENT_TASK_DETAIL} replace />} />
      <Route path="/search" element={<Navigate to={ROUTES.CLIENT_FILTER_TASKER} replace />} />
      <Route path="/filter-tasker" element={<Navigate to={ROUTES.CLIENT_FILTER_TASKER} replace />} />
      <Route path="/taskers" element={<Navigate to={ROUTES.CLIENT_FILTER_TASKER} replace />} />
      <Route path="/user-profile" element={<Navigate to={ROUTES.CLIENT_PROFILE} replace />} />
      <Route path="/profile" element={<Navigate to={ROUTES.TASKER_PROFILE} replace />} />
      <Route path="/profile/:id" element={<Navigate to="/tasker/:id" replace />} />
      <Route path="/tasker-dashboard" element={<Navigate to={ROUTES.TASKER_DASHBOARD} replace />} />
      <Route path="/tasker-requests" element={<Navigate to={ROUTES.TASKER_REQUESTS} replace />} />

      {/* 5. 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
