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
        activeMenu === 'messages' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* 1. Shared Left Sidebar */}
      <TaskerSidebar
        activeMenu={activeMenu}
        onSelectMenu={handleMenuClick}
        isOnline={resolvedOnline}
        onToggleOnline={handleToggleStatus}
        onNavigate={onNavigate}
      />

      {/* 2. Right Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-surface ${
          activeMenu === 'messages' ? 'h-full overflow-hidden' : ''
        }`}
      >
        {/* Shared Top Header Bar */}
        <header className="shrink-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-variant/30 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-headline-md text-lg font-extrabold text-on-surface tracking-tight">
              {title}
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 font-label-sm text-xs font-extrabold border border-amber-300/60">
              <Icon name="workspace_premium" size={15} className="text-amber-700" />
              <span>Elite Tasker • {rating}★</span>
            </span>
          </div>

          {/* Right Controls: Chế độ Client Button + Notification + User Identity */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              icon="swap_horiz"
              onClick={() => onNavigate && onNavigate('home')}
              className="rounded-full text-primary font-bold text-xs"
            >
              Chế độ Client
            </Button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => handleMenuClick('requests')}
              className="relative w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
              title="Thông báo công việc"
            >
              <Icon name="notifications" size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* User Identity */}
            <div
              onClick={() => onNavigate && onNavigate('tasker-profile', { isOwnerView: true })}
              className="flex items-center gap-2.5 pl-2 border-l border-surface-variant/40 cursor-pointer group"
            >
              <div className="text-right hidden sm:block">
                <p className="font-label-sm text-xs font-extrabold text-on-surface group-hover:text-primary transition-colors">
                  {displayName}
                </p>
                <p className="font-caption text-[11px] text-primary font-semibold">
                  Đối tác chuyên nghiệp
                </p>
              </div>
              <div className="relative">
                <img
                  src={DEFAULT_AVATAR}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary border-2 border-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Inner Content */}
        <main
          className={
            activeMenu === 'messages'
              ? 'p-2 sm:p-4 lg:p-5 w-full flex-1 min-h-0 flex flex-col overflow-hidden'
              : 'p-6 max-w-[1200px] w-full mx-auto space-y-6 flex-1'
          }
        >
          {children}
        </main>
      </div>
    </div>
  )
}
