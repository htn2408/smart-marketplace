import Icon from '../common/Icon'

/**
 * ConversationItem Component
 * Renders an individual conversation snippet in the left sidebar list
 */
export default function ConversationItem({ conversation, isActive = false, onClick }) {
  const { partner, lastMessage, lastMessageTime, unreadCount, taskTitle } = conversation

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={`relative p-3.5 cursor-pointer transition-colors select-none border-l-4 ${
        isActive
          ? 'bg-primary-fixed/20 border-primary'
          : 'border-transparent hover:bg-surface-container-low/70 bg-surface-container-lowest'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Partner Avatar + Online Indicator */}
        <div className="relative flex-none">
          <img
            src={partner.avatar}
            alt={partner.name}
            className={`w-12 h-12 rounded-full object-cover transition-all ${
              isActive ? 'ring-2 ring-primary/40' : 'border border-surface-variant/40'
            }`}
          />
          {partner.isOnline ? (
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs"
              title="Đang trực tuyến"
            />
          ) : (
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-outline/50 ring-2 ring-white"
              title="Ngoại tuyến"
            />
          )}
        </div>

        {/* Conversation Preview Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h3
              className={`text-sm truncate ${
                isActive || unreadCount > 0
                  ? 'font-extrabold text-on-surface'
                  : 'font-semibold text-on-surface'
              }`}
            >
              {partner.name}
            </h3>
            <span
              className={`text-xs shrink-0 ${
                unreadCount > 0 ? 'font-bold text-primary' : 'text-outline font-medium'
              }`}
            >
              {lastMessageTime}
            </span>
          </div>

          {/* Associated Task Tag (if available) */}
          {taskTitle && (
            <div className="flex items-center gap-1 text-[11px] text-primary font-semibold truncate mb-1">
              <Icon name="handyman" size={13} className="shrink-0" />
              <span className="truncate">{taskTitle}</span>
            </div>
          )}

          {/* Last Message Snippet & Unread Badge */}
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-xs truncate ${
                unreadCount > 0
                  ? 'font-bold text-on-surface'
                  : 'text-on-surface-variant font-normal'
              }`}
            >
              {lastMessage || 'Chưa có tin nhắn'}
            </p>
            {unreadCount > 0 && (
              <span className="flex-none px-1.5 py-0.5 min-w-[18px] text-center rounded-full bg-primary text-on-primary text-[10px] font-extrabold shadow-xs">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
