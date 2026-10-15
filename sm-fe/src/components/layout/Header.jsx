import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { TASKMATE_LOGO_URL, DEFAULT_AVATAR } from '../../assets/constants'
import Icon from '../common/Icon'
import Button from '../common/Button'
import { ROUTES } from '../../routes/paths'
import { useAuth } from '../../hooks/useAuth'

/**
 * Standardized Global Header for TaskMate
 * With dynamic auth state: "Đăng nhập" vs "Xin chào {name}" and user dropdown
 */
export default function Header({ activePath, onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { label: 'Trang chủ', path: 'home', to: ROUTES.HOME },
    { label: 'Đăng việc', path: 'task-detail', to: ROUTES.TASK_DETAIL },
    { label: 'Dịch vụ', path: 'services', to: ROUTES.SERVICES },
    ...(isAuthenticated
      ? [
          {
            label: 'Quản lý công việc',
            path: 'my-tasks',
            to: ROUTES.MY_TASKS,
          },
        ]
      : []),
  ]

  // Auto-detect active route if activePath isn't explicitly passed
  const getActiveTab = () => {
    if (activePath) return activePath
    const p = location.pathname
    if (p === '/' || p === '/home') return 'home'
    if (
      p.startsWith('/client/task-detail') ||
      p.startsWith('/task-detail') ||
      p.startsWith('/tasks')
    )
      return 'task-detail'
    if (p.startsWith('/services')) return 'services'
    if (
      p.startsWith('/client/filter-tasker') ||
      p.startsWith('/search') ||
      p.startsWith('/filter-tasker')
    )
      return 'search'
    if (p.startsWith('/client/tasks') || p.startsWith('/my-tasks')) return 'my-tasks'
    if (p.startsWith('/client/profile') || p.startsWith('/user-profile')) return 'profile'
    return ''
  }

  const currentActive = getActiveTab()

  const handleLinkClick = (e, path, to) => {
    e.preventDefault()
    if (path === 'login') {
      navigate(ROUTES.LOGIN)
      return
    }
    if (onNavigate) {
      onNavigate(path)
    } else {
      navigate(to || ROUTES.HOME)
    }
  }

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate(ROUTES.HOME)
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-[1240px] mx-auto px-6 flex items-center justify-between gap-6">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to={ROUTES.HOME}
            onClick={(e) => handleLinkClick(e, 'home', ROUTES.HOME)}
            className="flex items-center gap-3 group"
          >
            <img
              alt="TaskMate Brand Logo"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              src={TASKMATE_LOGO_URL}
            />
            <span className="sr-only">TaskMate</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = currentActive === link.path
              return (
                <Link
                  key={link.path}
                  to={link.to}
                  onClick={(e) => handleLinkClick(e, link.path, link.to)}
                  className={`font-label-md text-label-md transition-colors ${
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-4">
          {(() => {
            const isTasker =
              user?.roles?.includes('TASKER') ||
              user?.roles?.includes('WORKER') ||
              user?.role === 'TASKER' ||
              user?.role === 'WORKER'

            return (
              <Button
                variant="outline"
                size="sm"
                icon={isTasker ? 'swap_horiz' : undefined}
                className="hidden sm:inline-flex rounded-full text-primary"
                onClick={(e) =>
                  handleLinkClick(
                    e,
                    isTasker ? 'tasker-dashboard' : 'become-tasker',
                    isTasker ? ROUTES.TASKER_DASHBOARD : ROUTES.SEARCH
                  )
                }
              >
                {isTasker ? 'Chế độ Tasker' : 'Trở thành Tasker'}
              </Button>
            )
          })()}

          {/* Authentication State Display */}
          {!isAuthenticated ? (
            <Link
              to={ROUTES.LOGIN}
              className="font-label-md text-label-md font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-fixed/20"
            >
              Đăng nhập
            </Link>
          ) : (
            <div className="relative flex items-center gap-3" ref={userMenuRef}>
              {/* "Xin chào {name}" */}
              <span className="hidden md:inline-block font-label-md text-sm font-bold text-on-surface">
                Xin chào{' '}
                <span className="text-primary">{user?.name || 'bạn'}</span>
              </span>

              {/* User Avatar with Dropdown Toggle */}
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
                title="Hồ sơ tài khoản"
              >
                <img
                  alt={user?.name || 'User Profile'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                  src={DEFAULT_AVATAR}
                />
                <Icon
                  name="expand_more"
                  size={18}
                  className={`text-on-surface-variant transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-variant/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-surface-variant/30">
                    <p className="font-label-md text-sm font-bold text-on-surface truncate">
                      {user?.name}
                    </p>
                    <p className="font-body-sm text-xs text-on-surface-variant truncate">
                      {user?.email}
                    </p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-primary-fixed/30 text-primary">
                      {user?.roles?.includes('TASKER') ||
                      user?.roles?.includes('WORKER') ||
                      user?.role === 'TASKER' ||
                      user?.role === 'WORKER'
                        ? 'Khách hàng • Tasker'
                        : 'Khách hàng'}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to={ROUTES.USER_PROFILE}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <Icon name="person" size={18} className="text-outline" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    <Link
                      to={ROUTES.TASK_DETAIL}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <Icon name="post_add" size={18} className="text-outline" />
                      <span>Đăng công việc mới</span>
                    </Link>
                  </div>

                  <div className="border-t border-surface-variant/30 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-error hover:bg-error/10 transition-colors text-left cursor-pointer"
                    >
                      <Icon name="logout" size={18} className="text-error" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications button */}
          <button
            aria-label="Thông báo"
            className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
            type="button"
          >
            <Icon name="notifications" size={22} className="block" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary-container" />
          </button>
        </div>
      </div>
    </header>
  )
}
