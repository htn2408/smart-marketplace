import { useNavigate, useLocation } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import ScrollToTop from './components/common/ScrollToTop'
import { ROUTES } from './routes/paths'
import { AuthProvider } from './context/AuthContext'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine current active page for quick floating switcher
  const getActiveTab = () => {
    const p = location.pathname
    if (p === '/' || p === '/home') return 'home'
    if (p.startsWith('/client/task-detail') || p.startsWith('/task-detail') || p.startsWith('/tasks')) return 'task-detail'
    if (p.startsWith('/client/tasks') || p.startsWith('/my-tasks')) return 'my-tasks'
    if (p.startsWith('/services')) return 'services'
    if (p.startsWith('/client/filter-tasker') || p.startsWith('/search')) return 'search'
    if (p.startsWith('/client/profile') || p.startsWith('/user-profile')) return 'user-profile'
    if (p.startsWith('/tasker/dashboard') || p.startsWith('/tasker-dashboard')) return 'tasker-dashboard'
    if (p.startsWith('/tasker/requests') || p.startsWith('/tasker-requests')) return 'tasker-requests'
    if (p.startsWith('/tasker/profile') || p.startsWith('/tasker')) return 'profile'
    if (p.startsWith('/login')) return 'login'
    return ''
  }

  const activeTab = getActiveTab()

  return (
    <AuthProvider>
      <div className="relative min-h-screen bg-surface">
        <ScrollToTop />

        {/* Floating Demo Page Switcher for rapid navigation between routes */}
        <div className="fixed bottom-4 right-4 z-50 bg-inverse-surface/90 backdrop-blur-md text-inverse-on-surface px-3 py-2 rounded-full shadow-2xl flex items-center gap-1.5 border border-white/10 text-xs overflow-x-auto max-w-[95vw]">
          <span className="font-semibold text-secondary-fixed pr-1 hidden sm:inline">
            Route:
          </span>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            /
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CLIENT_TASKS)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'my-tasks'
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            /client/tasks
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CLIENT_TASK_DETAIL)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'task-detail'
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            /client/task-detail
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.TASKER_DASHBOARD)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'tasker-dashboard'
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            /tasker/dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.TASKER_REQUESTS)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'tasker-requests'
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            /tasker/requests
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            /login
          </button>
        </div>

        {/* Render Active Route */}
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}

export default App
