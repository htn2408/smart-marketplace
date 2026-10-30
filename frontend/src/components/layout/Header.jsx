import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { TASKMATE_LOGO_URL, DEFAULT_AVATAR } from '../../assets/constants'
import Icon from '../common/Icon'
import Button from '../common/Button'
import { ROUTES } from '../../routes/paths'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../utils/formatters'

/**
 * Standardized Global Header for TaskMate
 * With dynamic auth state: "Đăng nhập" vs "Xin chào {name}" and user dropdown
 */
export default function Header({ activePath, onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const isTasker =
    user?.roles?.includes('TASKER') ||
    user?.roles?.includes('WORKER') ||
    user?.role === 'TASKER' ||
    user?.role === 'WORKER'

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // Close dropdown menu and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !e.target.closest('[data-mobile-menu-toggle]')
      ) {
        setIsMobileMenuOpen(false)
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
    { label: 'Tin nhắn', path: 'messages', to: ROUTES.MESSAGES },
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
    if (
      p.startsWith('/messages') ||
      p.startsWith('/client/messages') ||
      p.startsWith('/tasker/messages')
    )
      return 'messages'
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
      <div className="h-20 max-w-[1240px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-6 xl:gap-8 min-w-0">
          <Link
            to={ROUTES.HOME}
            onClick={(e) => handleLinkClick(e, 'home', ROUTES.HOME)}
            className="flex items-center gap-2 sm:gap-3 group shrink-0"
          >
            <img
              alt="TaskMate Brand Logo"
              className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
              src={TASKMATE_LOGO_URL}
            />
            <span className="sr-only">TaskMate</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 shrink-0">
            {navLinks.map((link) => {
              const isActive = currentActive === link.path
              return (
                <Link
                  key={link.path}
                  to={link.to}
                  onClick={(e) => handleLinkClick(e, link.path, link.to)}
                  className={`font-label-md text-label-md whitespace-nowrap transition-colors ${
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
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={isTasker ? 'swap_horiz' : undefined}
            className="hidden md:inline-flex rounded-full text-primary shrink-0 whitespace-nowrap"
            onClick={(e) =>
              handleLinkClick(
                e,
                isTasker ? 'tasker-dashboard' : 'become-tasker',
                isTasker ? ROUTES.TASKER_DASHBOARD : ROUTES.TASKER_REGISTER
              )
            }
          >
            {isTasker ? 'Chế độ Tasker' : 'Trở thành Tasker'}
          </Button>

          {/* Số dư tài khoản ví (hiển thị trước thông tin tài khoản cá nhân) */}
          {isAuthenticated && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-container-low border border-surface-variant/40 shadow-xs hover:border-primary/40 transition-all select-none shrink-0"
              title={`Số dư khả dụng: ${formatCurrency(user?.balance ?? 0)}`}
            >
              <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Icon name="account_balance_wallet" size={15} />
              </div>
              <div className="flex flex-col text-left whitespace-nowrap">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant leading-none tracking-wider">
                  Số dư
                </span>
                <span className="font-label-md text-xs sm:text-sm font-extrabold text-primary leading-tight">
                  {formatCurrency(user?.balance ?? 0)}
                </span>
              </div>
            </div>
          )}

          {/* Authentication State Display: User Profile & Dropdown (Luôn nằm ngoài cùng bên phải) */}
          {!isAuthenticated ? (
            <Link
              to={ROUTES.LOGIN}
              className="font-label-md text-xs sm:text-label-md font-semibold text-primary hover:text-primary/80 transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-primary-fixed/20 shrink-0 whitespace-nowrap"
            >
              Đăng nhập
            </Link>
          ) : (
            <div className="relative flex items-center gap-2.5 shrink-0" ref={userMenuRef}>
              {/* "Xin chào {name}" */}
              <span className="hidden md:inline-block font-label-md text-sm font-bold text-on-surface whitespace-nowrap">
                Xin chào{' '}
                <span className="text-primary truncate max-w-[130px] inline-block align-bottom">
                  {user?.name || 'bạn'}
                </span>
              </span>

              {/* User Avatar with Dropdown Toggle */}
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
                title="Hồ sơ tài khoản"
              >
                <img
                  alt={user?.name || 'User Profile'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                  src={user?.avatar || DEFAULT_AVATAR}
                />
                <Icon
                  name="expand_more"
                  size={18}
                  className={`text-on-surface-variant transition-transform shrink-0 ${
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

                    <Link
                      to={ROUTES.MESSAGES}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <Icon name="chat" size={18} className="text-outline" />
                      <span>Tin nhắn</span>
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
          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            data-mobile-menu-toggle="true"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
            aria-label="Menu"
          >
            <Icon name={isMobileMenuOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden w-full bg-surface-container-lowest/95 backdrop-blur-2xl border-b border-surface-variant/40 shadow-2xl px-5 py-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* User info on mobile drawer when logged in */}
          {isAuthenticated && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-variant/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Icon name="account_balance_wallet" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant leading-none">
                    Số dư khả dụng
                  </span>
                  <span className="font-label-md text-sm font-extrabold text-primary leading-tight mt-0.5">
                    {formatCurrency(user?.balance ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = currentActive === link.path
              return (
                <Link
                  key={link.path}
                  to={link.to}
                  onClick={(e) => {
                    handleLinkClick(e, link.path, link.to)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-base transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low font-medium'
                  }`}
                >
                  <span>{link.label}</span>
                  <Icon name="chevron_right" size={18} className="text-outline" />
                </Link>
              )
            })}
          </nav>

          <div className="pt-2 border-t border-surface-variant/30 flex flex-col gap-2">
            <Button
              variant="outline"
              size="md"
              icon={isTasker ? 'swap_horiz' : undefined}
              className="w-full rounded-xl text-primary justify-center font-bold"
              onClick={(e) => {
                setIsMobileMenuOpen(false)
                handleLinkClick(
                  e,
                  isTasker ? 'tasker-dashboard' : 'become-tasker',
                  isTasker ? ROUTES.TASKER_DASHBOARD : ROUTES.TASKER_REGISTER
                )
              }}
            >
              {isTasker ? 'Chế độ Tasker' : 'Trở thành Tasker'}
            </Button>

            {!isAuthenticated && (
              <Link
                to={ROUTES.LOGIN}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-center font-bold bg-primary text-on-primary shadow-sm hover:bg-primary-container transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
