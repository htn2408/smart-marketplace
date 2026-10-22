import Icon from '../common/Icon'
import ConversationItem from './ConversationItem'

/**
 * ConversationList Component
 * Left panel showing search, filter tabs, and scrollable conversation list
 */
export default function ConversationList({
  conversations = [],
  selectedId,
  onSelect,
  searchQuery = '',
  onSearchChange,
  activeTab = 'all',
  onTabChange,
  onMarkAllRead,
  onViewProfile,
  isClientRole = false,
}) {
  const totalCount = conversations.length
  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
  const inProgressTotal = conversations.filter((c) => c.status === 'IN_PROGRESS').length

  return (
    <aside className="w-full md:w-[350px] lg:w-[380px] flex-none flex flex-col border-r border-surface-variant/40 bg-surface-container-lowest min-h-0 h-full">
      {/* Top Header & Search */}
      <div className="p-4 border-b border-surface-variant/30 flex-none space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
            <span>Tin nhắn</span>
            {unreadTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {unreadTotal} mới
              </span>
            )}
          </h2>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
              title="Đánh dấu tất cả là đã đọc"
            >
              <Icon name="done_all" size={20} />
            </button>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Icon
            name="search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Tìm thợ, khách hoặc mã việc..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container-low border border-surface-variant/40 text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5"
              title="Xóa tìm kiếm"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onTabChange?.('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span>Tất cả</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-surface-container text-outline'
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'unread'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span>Chưa đọc</span>
            {unreadTotal > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'unread' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                }`}
              >
                {unreadTotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'in_progress'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span>Đang tiến hành</span>
            {inProgressTotal > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'in_progress'
                    ? 'bg-white/20 text-white'
                    : 'bg-primary-fixed/50 text-primary'
                }`}
              >
                {inProgressTotal}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-surface-variant/20">
        {conversations.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Icon name="chat_bubble_outline" size={36} className="text-outline/60 mx-auto" />
            <p className="text-xs font-semibold text-on-surface-variant">
              Không tìm thấy cuộc trò chuyện nào phù hợp.
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isPartnerTasker = (
              conv.partner?.rawRole === 'TASKER' ||
              conv.partner?.role === 'Tasker' ||
              conv.partner?.role === 'TASKER' ||
              (conv.partner?.role || '').toLowerCase().includes('tasker')
            )
            return (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === selectedId}
                onClick={() => onSelect?.(conv.id)}
                onViewProfile={onViewProfile}
                canViewProfile={isClientRole && isPartnerTasker}
              />
            )
          })
        )}
      </div>
    </aside>
  )
}
