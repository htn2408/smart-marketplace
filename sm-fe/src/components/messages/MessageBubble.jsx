import Icon from '../common/Icon'

/**
 * MessageBubble Component
 * Renders an individual message item (sent or received) with time and read receipt
 */
export default function MessageBubble({ message, partnerAvatar, partnerName }) {
  const { content, createdAt, isOwn, isRead } = message

  if (isOwn) {
    return (
      <div className="flex flex-col items-end max-w-xl sm:max-w-2xl ml-auto animate-in fade-in duration-150">
        <span className="text-[11px] text-outline font-medium mr-1.5 mb-0.5">
          Bạn • {createdAt}
        </span>
        <div className="p-3.5 rounded-2xl rounded-br-xs bg-primary text-on-primary text-sm shadow-2xs leading-relaxed break-words max-w-full">
          {content}
        </div>
        <div className="flex items-center gap-1 mt-1 mr-1 text-[11px] text-outline font-medium">
          <span>{isRead ? 'Đã xem' : 'Đã gửi'}</span>
          <Icon
            name={isRead ? 'done_all' : 'check'}
            size={14}
            className={isRead ? 'text-primary' : 'text-outline'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2.5 max-w-xl sm:max-w-2xl animate-in fade-in duration-150">
      <img
        src={partnerAvatar}
        alt={partnerName || 'Đối tác'}
        className="w-8 h-8 rounded-full object-cover flex-none mb-1 border border-surface-variant/40"
      />
      <div className="min-w-0">
        <span className="text-[11px] text-outline font-medium ml-1.5 mb-0.5 block truncate">
          {partnerName} • {createdAt}
        </span>
        <div className="p-3.5 rounded-2xl rounded-bl-xs bg-surface-container-lowest border border-surface-variant/40 text-sm text-on-surface shadow-2xs leading-relaxed break-words">
          {content}
        </div>
      </div>
    </div>
  )
}
