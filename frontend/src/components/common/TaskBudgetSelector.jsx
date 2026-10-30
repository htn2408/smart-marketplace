import Icon from './Icon'

/**
 * TaskBudgetSelector Component
 * Reusable Budget & Price Proposal Selector for TaskDetail and BookingSidebar
 * Adheres strictly to rule.md (DRY)
 */
export default function TaskBudgetSelector({
  amount = 450000,
  onChangeAmount,
  allowNegotiate = true,
  onChangeAllowNegotiate,
  min = 100000,
  max = 2000000,
  step = 20000,
  error = '',
  compact = false,
  stepTitle = 'Bước 5: Thù lao đề xuất',
  title = 'Đề xuất mức giá bạn mong muốn',
  subtitle = 'Tasker sẽ dựa vào mức giá này để nhận việc hoặc gửi báo giá tối ưu.',
  showNegotiateOption = true,
  id = 'step-5',
  className = '',
}) {
  const handleSliderChange = (e) => {
    onChangeAmount?.(Number(e.target.value))
  }

  const containerPadding = compact ? 'p-4 sm:p-5' : 'p-4 sm:p-6 lg:p-8'
  const displayPadding = compact ? 'p-3.5 sm:p-4 mb-3' : 'p-3.5 sm:p-5 lg:p-6 mb-4 sm:mb-5'
  const displayHeroClass = compact
    ? 'text-2xl sm:text-3xl font-extrabold text-primary tracking-tight'
    : 'text-2xl sm:text-3xl lg:text-display-hero font-extrabold text-primary tracking-tight'

  return (
    <div
      id={id}
      className={`bg-surface-container-lowest rounded-xl shadow-sm border transition-colors ${
        error
          ? 'border-error/60 ring-1 ring-error/20'
          : 'border-surface-variant/30'
      } ${containerPadding} ${className}`}
    >
      {/* Header section (if title or stepTitle exists) */}
      {(stepTitle || title) && (
        <div className={compact ? 'mb-3' : 'mb-3 sm:mb-5'}>
          {stepTitle && (
            <span className="font-label-sm text-xs sm:text-label-sm font-semibold uppercase tracking-wider text-primary">
              {stepTitle}
            </span>
          )}
          {title && (
            <h2 className={`font-bold text-on-surface ${compact ? 'text-base sm:text-lg' : 'text-base sm:text-lg lg:text-headline-sm'}`}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Amount display card */}
      <div className={`bg-surface-container-low rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${displayPadding}`}>
        <div>
          <span className="font-caption text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
            Mức giá bạn chi trả
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={displayHeroClass}>
              {Number(amount || 0).toLocaleString('vi-VN')}
            </span>
            <span className="font-headline-md text-base sm:text-headline-md text-primary font-bold">
              VNĐ
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal roller / slider */}
      <div className="px-1 pt-1 pb-2">
        <div className="relative py-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={amount || min}
            onChange={handleSliderChange}
            className="w-full h-3 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between items-center text-on-surface-variant font-caption text-[11px] sm:text-xs mt-2 font-medium px-1">
            <span>{min.toLocaleString('vi-VN')} đ</span>
            <span>{max.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
            <Icon name="error" size={15} />
            <span>{error}</span>
          </p>
        )}

        {/* Note / Tip */}
        <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs text-on-surface">
          <Icon name="info" size={17} className="text-primary shrink-0" />
          <span>
            <strong className="text-primary font-semibold">Lưu ý:</strong> Nên để giá hợp lý hoặc cao hơn nếu bạn cần tìm thợ nhận việc gấp.
          </span>
        </div>
      </div>

      {/* Optional: Cho phép Tasker thương lượng */}
      {showNegotiateOption && (
        <label className="flex items-start gap-3 mt-3 p-3 rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors select-none">
          <input
            type="checkbox"
            checked={Boolean(allowNegotiate)}
            onChange={(e) => onChangeAllowNegotiate?.(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-primary rounded cursor-pointer"
          />
          <div>
            <span className="font-label-md text-xs sm:text-sm font-semibold text-on-surface">
              Cho phép Tasker đề xuất thương lượng thù lao
            </span>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5 leading-snug">
              Tasker có thể gửi báo giá kèm lý do cụ thể nếu công việc phát sinh thêm chi tiết hoặc đồ nghề đặc thù.
            </p>
          </div>
        </label>
      )}
    </div>
  )
}
