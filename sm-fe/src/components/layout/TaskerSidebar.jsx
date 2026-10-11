import Icon from '../common/Icon'
import { TASKER_DASHBOARD_MOCK } from '../../constants/mockData'

/**
 * TaskerSidebar Component - Thanh điều hướng bên trái cho Bảng điều khiển Thợ (Verdant Trust Theme)
 * Đặt tại src/components/layout/ theo chuẩn rule.md
 */
export default function TaskerSidebar({
  activeMenu = 'overview',
  onSelectMenu,
  isOnline = true,
  onToggleOnline,
  onNavigate,
}) {
  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-surface-variant/40 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen select-none">
      {/* Top Section: Brand + Status Toggle + Navigation */}
      <div className="p-5 space-y-6">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate && onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group px-1"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container transition-colors">
            <Icon name="handyman" size={22} />
          </div>
          <div>
            <div className="font-headline-md text-lg font-extrabold text-primary tracking-tight leading-none">
              TaskMate
            </div>
            <span className="font-label-sm text-[11px] text-outline font-semibold">
              Đối tác Thợ • Pro
            </span>
          </div>
        </div>

        {/* Sẵn sàng nhận việc Toggle Card */}
        <div className="bg-surface-container-low/80 border border-surface-variant/40 rounded-2xl p-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-primary animate-pulse' : 'bg-outline'
              }`}
            />
            <span className="font-label-sm text-xs font-bold text-on-surface">
              {isOnline ? 'Sẵn sàng nhận việc' : 'Đang tạm nghỉ'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isOnline}
            onClick={onToggleOnline}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              isOnline ? 'bg-primary' : 'bg-outline-variant'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isOnline ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {TASKER_DASHBOARD_MOCK.sidebarNav.map((item) => {
            const isActive = activeMenu === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMenu && onSelectMenu(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-label-md text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    name={item.icon}
                    size={20}
                    className={isActive ? 'text-on-primary' : 'text-outline'}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeType === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Section: Support Hotline Card & Back to User Mode */}
      <div className="p-4 space-y-3 border-t border-surface-variant/30">
        <div className="bg-surface-container-low rounded-2xl p-3.5 border border-surface-variant/40">
          <div className="flex items-center gap-2 text-primary font-label-sm text-xs font-bold mb-1">
            <Icon name="support_agent" size={18} />
            <span>Hỗ trợ Đối tác 24/7</span>
          </div>
          <p className="font-caption text-[11px] text-on-surface-variant leading-relaxed mb-2">
            Cần trợ giúp xử lý sự cố lịch hẹn hoặc giải ngân Escrow?
          </p>
          <a
            href="tel:19006868"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-primary hover:underline"
          >
            <span>Gọi ngay hotline</span>
            <Icon name="arrow_forward" size={14} />
          </a>
        </div>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('home')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
        >
          <Icon name="swap_horiz" size={16} />
          <span>Chuyển sang giao diện Khách</span>
        </button>
      </div>
    </aside>
  )
}
