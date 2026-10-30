import { useState } from 'react'
import TaskerSidebar from './TaskerSidebar'
import Icon from '../common/Icon'
import Button from '../common/Button'
import { useAuth } from '../../hooks/useAuth'
import { updateWorkerProfileApi } from '../../services/authService'
import { DEFAULT_AVATAR } from '../../assets/constants'

/**
 * TaskerLayout Component - Khung giao diện dùng chung (Shared Sidebar + Topbar) cho tất cả các trang thuộc role Tasker.
 * Thay thế thanh tìm kiếm trên Header bằng nút "Chế độ Client" để chuyển nhanh về giao diện Khách.
 */
export default function TaskerLayout({
  activeMenu = 'overview',
  onSelectMenu,
  isOnline,
  onToggleOnline,
  onNavigate,
  title = 'Bảng điều khiển Thợ',
  children,
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const { user, token, updateUser } = useAuth()
  const displayName = user?.name || 'Đối tác Tasker'
  const rating = user?.workerProfile?.rating ? Number(user.workerProfile.rating).toFixed(1) : '5.0'
  const resolvedOnline =
    isOnline !== undefined ? isOnline : (user?.workerProfile?.status || 'ONLINE') === 'ONLINE'

  const handleToggleStatus = async () => {
    if (onToggleOnline) {
      onToggleOnline()
      return
    }
    if (!token) return
    const nextStatus = resolvedOnline ? 'OFFLINE' : 'ONLINE'
    try {
      const updatedUser = await updateWorkerProfileApi(token, { status: nextStatus })
      updateUser(updatedUser)
    } catch {
      // Giữ nguyên trạng thái nếu lỗi mạng
    }
  }

  const handleMenuClick = (menuId) => {
    setIsMobileSidebarOpen(false)
    if (onSelectMenu) {
      onSelectMenu(menuId)
      return
    }
    if (menuId === 'profile_services') {
      onNavigate?.('tasker-profile', { isOwnerView: true })
    } else if (menuId === 'requests') {
      onNavigate?.('tasker-requests')
    } else if (menuId === 'overview') {
      onNavigate?.('tasker-dashboard')
    } else if (menuId === 'messages') {
      onNavigate?.('messages')
    } else {
      onNavigate?.('tasker-dashboard', { tab: menuId })
    }
  }

  return (
    <div
      className={`bg-surface font-body-md text-on-surface antialiased flex ${
        activeMenu === 'messages' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* 1. Shared Left Sidebar with Mobile Drawer support */}
      <TaskerSidebar
        activeMenu={activeMenu}
        onSelectMenu={handleMenuClick}
        isOnline={resolvedOnline}
        onToggleOnline={handleToggleStatus}
        onNavigate={onNavigate}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Right Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-surface ${
          activeMenu === 'messages' ? 'h-full overflow-hidden' : ''
        }`}
      >
        {/* Shared Top Header Bar */}
        <header className="shrink-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-variant/30 px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile Drawer */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
              aria-label="Mở menu điều hướng"
            >
              <Icon name="menu" size={22} />
            </button>

            <h1 className="font-headline-md text-sm sm:text-lg font-extrabold text-on-surface tracking-tight truncate max-w-[130px] sm:max-w-none">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 font-label-sm text-xs font-extrabold border border-amber-300/60 shrink-0">
              <Icon name="workspace_premium" size={14} className="text-amber-700" />
              <span>Elite Tasker • {rating}★</span>
            </span>
          </div>

          {/* Right Controls: Chế độ Client Button + Notification + User Identity */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon="swap_horiz"
              onClick={() => onNavigate && onNavigate('home')}
              className="rounded-full text-primary font-bold text-xs py-1.5 px-2.5 sm:px-3"
            >
              <span className="hidden sm:inline">Chế độ Client</span>
              <span className="sm:hidden">Client</span>
            </Button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => handleMenuClick('requests')}
              className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors shrink-0"
              title="Thông báo công việc"
            >
              <Icon name="notifications" size={18} />
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* User Identity */}
            <div
              onClick={() => onNavigate && onNavigate('tasker-profile', { isOwnerView: true })}
              className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2 border-l border-surface-variant/40 cursor-pointer group shrink-0"
            >
              <div className="text-right hidden sm:block">
                <p className="font-label-sm text-xs font-extrabold text-on-surface group-hover:text-primary transition-colors">
                  {displayName}
                </p>
                <p className="font-caption text-[11px] text-primary font-semibold">
                  Đối tác chuyên nghiệp
                </p>
              </div>
              <div className="relative shrink-0">
                <img
                  src={DEFAULT_AVATAR}
                  alt={displayName}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-primary/30"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary border-2 border-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Inner Content */}
        <main
          className={
            activeMenu === 'messages'
              ? 'p-0 sm:p-3 md:p-4 lg:p-5 w-full flex-1 min-h-0 flex flex-col overflow-hidden'
              : 'p-3.5 sm:p-6 max-w-[1200px] w-full mx-auto space-y-4 sm:space-y-6 flex-1'
          }
        >
          {children}
        </main>
      </div>
    </div>
  )
}
