import Icon from '../common/Icon'

/**
 * MessageInput Component
 * Fixed bottom bar with attachment/emoji triggers, text input field, and send action
 */
export default function MessageInput({
  value = '',
  onChange,
  onSend,
  disabled = false,
  onAttach,
  onEmoji,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend?.(value.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="p-2.5 sm:p-4 bg-surface-container-lowest border-t border-surface-variant/30 flex-none pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
        {/* Attachment & Emoji actions */}
        <div className="flex items-center text-on-surface-variant">
          <button
            type="button"
            onClick={onAttach}
            className="p-1.5 sm:p-2 hover:text-primary hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer"
            title="Đính kèm ảnh / tệp"
          >
            <Icon name="attach_file" size={19} />
          </button>
          <button
            type="button"
            onClick={onEmoji}
            className="p-1.5 sm:p-2 hover:text-primary hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer"
            title="Chèn biểu tượng cảm xúc"
          >
            <Icon name="sentiment_satisfied" size={19} />
          </button>
        </div>

        {/* Text Input Box */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-surface-container-low border border-surface-variant/40 text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-60"
          />
        </div>

        {/* Send Action Button */}
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="flex-none inline-flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-container active:scale-95 text-on-primary text-xs sm:text-sm font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
        >
          <span className="hidden sm:inline">Gửi</span>
          <Icon name="send" size={16} />
        </button>
      </form>
    </div>
  )
}
