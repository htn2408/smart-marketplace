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
}) {
  if (!conversation) return null

  const { partner, taskTitle, taskId } = conversation

  return (
    <div className="h-16 px-4 lg:px-6 border-b border-surface-variant/30 flex-none flex items-center justify-between bg-surface-container-lowest z-10 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
          title="Quay lại danh sách"
        >
          <Icon name="arrow_back" size={20} />
        </button>

        {/* Partner Avatar + Active Status Dot */}
        <div className="relative flex-none">
          <img
            src={partner.avatar}
            alt={partner.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
          />
          {partner.isOnline && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Đang hoạt động"
            />
          )}
        </div>

        {/* Partner Info Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface truncate">
              {partner.name}
            </h2>

            {partner.role && (
              <Badge variant="primary" size="xs" icon="verified">
                {partner.role}
              </Badge>
            )}

            {partner.rating && (
              <span className="text-xs font-bold text-amber-700 flex items-center gap-0.5">
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

          <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
            {partner.isOnline ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Đang hoạt động</span>
              </span>
            ) : (
              <span className="text-outline">Ngoại tuyến</span>
            )}
            {partner.responseSpeed && (
              <>
                <span>•</span>
                <span className="truncate">{partner.responseSpeed}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer"
          title="Gọi điện trao đổi"
        >
          <Icon name="call" size={20} />
        </button>

        <button
          type="button"
          onClick={onReport}
          className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-xl transition-colors cursor-pointer"
          title="Báo cáo vi phạm"
        >
          <Icon name="report" size={20} />
        </button>
      </div>
    </div>
  )
}
