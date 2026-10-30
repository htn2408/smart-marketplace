import Icon from '../common/Icon'
import Badge from '../common/Badge'

/**
 * ChatHeader Component
 * Top bar of the active chat pane showing partner profile, online status, and action buttons
 */
export default function ChatHeader({
  conversation,
  onBack,
  onCall,
  onReport,
  onViewTask,
  onViewProfile,
  canViewProfile = false,
}) {
  if (!conversation) return null

  const { partner, taskTitle, taskId } = conversation

  return (
    <div className="h-16 px-3.5 sm:px-4 lg:px-6 border-b border-surface-variant/30 flex-none flex items-center justify-between bg-surface-container-lowest z-10 shadow-xs">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer shrink-0"
          title="Quay lại danh sách"
        >
          <Icon name="arrow_back" size={20} />
        </button>

        {/* Partner Avatar + Active Status Dot */}
        <div
          onClick={canViewProfile ? () => onViewProfile?.(partner) : undefined}
          title={canViewProfile ? `Xem trang cá nhân của ${partner.name}` : undefined}
          className={`relative flex-none ${
            canViewProfile ? 'cursor-pointer group' : ''
          }`}
        >
          <img
            src={partner.avatar}
            alt={partner.name}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-primary/20 transition-all ${
              canViewProfile ? 'group-hover:ring-primary group-hover:scale-105 shadow-xs' : ''
            }`}
          />
          {partner.isOnline && (
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Đang hoạt động"
            />
          )}
        </div>

        {/* Partner Info Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2
              onClick={canViewProfile ? () => onViewProfile?.(partner) : undefined}
              title={canViewProfile ? `Xem trang cá nhân của ${partner.name}` : undefined}
              className={`font-headline-sm text-sm sm:text-base font-bold text-on-surface truncate ${
                canViewProfile ? 'cursor-pointer hover:text-primary transition-colors' : ''
              }`}
            >
              {partner.name}
            </h2>

            {partner.role && (
              <Badge
                variant="primary"
                size="xs"
                icon="verified"
                onClick={canViewProfile ? () => onViewProfile?.(partner) : undefined}
                className={`hidden sm:inline-flex ${canViewProfile ? 'cursor-pointer hover:opacity-85' : ''}`}
                title={canViewProfile ? `Xem trang cá nhân của ${partner.name}` : undefined}
              >
                {partner.role}
              </Badge>
            )}

            {partner.rating && (
              <span className="hidden sm:inline-flex text-xs font-bold text-amber-700 items-center gap-0.5 shrink-0">
                <Icon name="star" size={14} filled className="text-amber-600" />
                <span>{partner.rating}</span>
                {partner.completedJobs && (
                  <span className="font-normal text-on-surface-variant text-[11px]">
                    ({partner.completedJobs} việc)
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5 truncate">
            {partner.isOnline ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1 shrink-0 text-[11px] sm:text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Đang hoạt động</span>
              </span>
            ) : (
              <span className="text-outline shrink-0 text-[11px] sm:text-xs">Ngoại tuyến</span>
            )}
            {partner.responseSpeed && (
              <>
                <span>•</span>
                <span className="truncate text-[11px] sm:text-xs">{partner.responseSpeed}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
        {taskTitle && (
          <button
            type="button"
            onClick={onViewTask}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-primary border border-surface-variant/40 transition-colors cursor-pointer"
            title="Xem chi tiết đơn việc đính kèm"
          >
            <Icon name="description" size={15} />
            <span className="truncate max-w-[140px]">#{taskId?.slice(0, 8)}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCall}
          className="p-1.5 sm:p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer"
          title="Gọi điện trao đổi"
        >
          <Icon name="call" size={18} className="sm:scale-110" />
        </button>

        <button
          type="button"
          onClick={onReport}
          className="p-1.5 sm:p-2 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-xl transition-colors cursor-pointer"
          title="Báo cáo vi phạm"
        >
          <Icon name="report" size={18} className="sm:scale-110" />
        </button>
      </div>
    </div>
  )
}
