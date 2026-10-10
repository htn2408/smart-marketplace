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
    if (p.startsWith('/task-detail') || p.startsWith('/tasks')) return 'task-detail'
    if (p.startsWith('/search') || p.startsWith('/services')) return 'search'
    if (p.startsWith('/profile')) return 'profile'
    if (p.startsWith('/login')) return 'login'
    return ''
  }

  const activeTab = getActiveTab()

  return (
    <AuthProvider>
      <div className="relative min-h-screen bg-surface">
        <ScrollToTop />

        {/* Floating Demo Page Switcher for rapid navigation between routes */}
        <div className="fixed bottom-4 right-4 z-50 bg-inverse-surface/90 backdrop-blur-md text-inverse-on-surface px-3 py-2 rounded-full shadow-2xl flex items-center gap-1.5 border border-white/10 text-xs">
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
            / (Trang chủ)
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.TASK_DETAIL)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'task-detail'
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            /task-detail
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.SEARCH)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            /search
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROFILE)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-sm'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            /profile
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
