import Icon from './Icon'
import { calculateDuration } from '../../utils/formatters'

/**
 * TaskScheduleSelector Component
 * Reusable Schedule Date & Start-End Duration Selector for TaskDetail and BookingSidebar
 * Adheres strictly to rule.md (DRY)
 */
export default function TaskScheduleSelector({
  selectedDate = 'tomorrow',
  onChangeSelectedDate,
  customDate = '',
  onChangeCustomDate,
  startTime = '08:30',
  onChangeStartTime,
  endTime = '11:30',
  onChangeEndTime,
  errors = {},
  compact = false,
  stepTitle = 'Bước 6: Lịch hẹn & Thời lượng',
  title = 'Khi nào bạn muốn bắt đầu?',
  id = 'step-6',
  className = '',
}) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const formatDateTitle = (date) => {
    const d = String(date.getDate()).padStart(2, '0')
    const m = date.getMonth() + 1
    return `${d} Th${m}`
  }

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const dateOptions = [
    {
      id: 'today',
      title: 'Hôm nay (Gấp)',
      sub: 'Có thợ đến sau 30p',
      icon: 'bolt',
      iconColor: 'text-secondary',
    },
    {
      id: 'tomorrow',
      title: `Ngày mai, ${formatDateTitle(tomorrow)}`,
      sub: 'Được chọn nhiều nhất',
      icon: 'event_available',
      iconColor: 'text-primary',
    },
    {
      id: 'other',
      title: 'Chọn ngày khác',
      sub: selectedDate === 'other' ? customDate || 'Lên lịch linh hoạt' : 'Lên lịch linh hoạt',
      icon: 'calendar_month',
      iconColor: 'text-on-surface-variant',
    },
  ]

  const durationInfo = calculateDuration(startTime, endTime)

  const applyDurationPreset = (hoursToAdd) => {
    if (!startTime) return
    const [sh, sm] = startTime.split(':').map(Number)
    const newEndHour = (sh + hoursToAdd) % 24
    const formatted = `${String(newEndHour).padStart(2, '0')}:${String(sm).padStart(2, '0')}`
    onChangeEndTime?.(formatted)
  }

  const containerPadding = compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
  const hasScheduleError = errors.customDate || errors.startTime || errors.scheduleTime

  return (
    <div
      id={id}
      className={`bg-surface-container-lowest rounded-xl shadow-sm border transition-colors ${
        hasScheduleError
          ? 'border-error/60 ring-1 ring-error/20'
          : 'border-surface-variant/30'
      } ${containerPadding} ${className}`}
    >
      {/* Header section */}
      {(stepTitle || title) && (
        <div className={compact ? 'mb-3' : 'mb-4'}>
          {stepTitle && (
            <span className="font-label-sm text-xs sm:text-label-sm font-semibold uppercase tracking-wider text-primary">
              {stepTitle}
            </span>
          )}
          {title && (
            <h2 className={`font-headline-sm font-bold text-on-surface ${compact ? 'text-base sm:text-lg' : 'text-headline-sm'}`}>
              {title}
            </h2>
          )}
        </div>
      )}

      {/* 1. Date options */}
      <div className={compact ? 'mb-4' : 'mb-6'}>
        <label className="block font-label-sm text-xs sm:text-label-sm font-semibold text-on-surface mb-2">
          Chọn ngày làm việc:
        </label>
        <div className={`grid gap-2.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {dateOptions.map((opt) => {
            const isActive = selectedDate === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeSelectedDate?.(opt.id)}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-fixed/30 ring-2 ring-primary shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <Icon
                  name={opt.icon}
                  size={compact ? 20 : 24}
                  className={isActive ? 'text-primary' : opt.iconColor}
                />
                <div className="min-w-0">
                  <p className={`font-label-md text-xs sm:text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                    {opt.title}
                  </p>
                  <p className="font-caption text-[11px] text-on-surface-variant truncate">
                    {opt.sub}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Dynamic Date Picker when "Chọn ngày khác" is chosen */}
        {selectedDate === 'other' && (
          <div className="mt-2.5 p-3.5 rounded-xl bg-surface-container-low border border-primary/20 flex items-center gap-3 animate-in fade-in duration-200">
            <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0">
              <Icon name="calendar_today" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor="custom-date-picker"
                className="block text-[11px] font-bold text-primary uppercase tracking-wider mb-0.5"
              >
                Chọn ngày làm việc cụ thể:
              </label>
              <input
                id="custom-date-picker"
                type="date"
                min={todayIso}
                value={customDate || todayIso}
                onChange={(e) => onChangeCustomDate?.(e.target.value)}
                className={`bg-surface-container-lowest px-3 py-1.5 rounded-lg font-label-md text-xs sm:text-sm text-on-surface outline-none border w-full max-w-xs cursor-pointer shadow-sm ${
                  errors.customDate
                    ? 'border-error ring-1 ring-error/20 focus:border-error'
                    : 'border-surface-variant/40 focus:border-primary'
                }`}
              />
              {errors.customDate && (
                <p className="mt-1 flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                  <Icon name="error" size={14} />
                  <span>{errors.customDate}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Duration: Start Time - End Time */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
          <label className="block font-label-sm text-xs sm:text-label-sm font-semibold text-on-surface">
            Thời lượng dự kiến (Start – End):
          </label>
          <span className="font-label-sm text-[11px] sm:text-xs font-bold text-primary bg-primary-fixed/30 px-2 py-0.5 rounded-full self-start sm:self-auto">
            Ước tính: {durationInfo.hours}h {durationInfo.minutes > 0 ? `${durationInfo.minutes}m` : ''} ({durationInfo.totalMinutes} phút)
          </span>
        </div>

        {/* Start - End Time Input Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
          {/* Start Time */}
          <div
            className={`p-3 rounded-xl bg-surface-container-low border flex items-center gap-2.5 ${
              errors.startTime || errors.scheduleTime
                ? 'border-error ring-1 ring-error/20'
                : 'border-surface-variant/30'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0">
              <Icon name="schedule" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor="start-time-input"
                className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5"
              >
                Giờ bắt đầu (Start)
              </label>
              <input
                id="start-time-input"
                type="time"
                value={startTime}
                onChange={(e) => onChangeStartTime?.(e.target.value)}
                className="bg-transparent font-label-md text-sm sm:text-base font-bold text-on-surface outline-none w-full cursor-pointer"
              />
            </div>
          </div>

          {/* End Time */}
          <div
            className={`p-3 rounded-xl bg-surface-container-low border flex items-center gap-2.5 ${
              errors.scheduleTime
                ? 'border-error ring-1 ring-error/20'
                : 'border-surface-variant/30'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm shrink-0">
              <Icon name="timelapse" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor="end-time-input"
                className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5"
              >
                Giờ kết thúc (End)
              </label>
              <input
                id="end-time-input"
                type="time"
                value={endTime}
                onChange={(e) => onChangeEndTime?.(e.target.value)}
                className="bg-transparent font-label-md text-sm sm:text-base font-bold text-on-surface outline-none w-full cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Error hints */}
        {(errors.startTime || errors.scheduleTime) && (
          <div className="mb-2.5 space-y-1">
            {errors.startTime && (
              <p className="flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                <Icon name="error" size={14} />
                <span>{errors.startTime}</span>
              </p>
            )}
            {errors.scheduleTime && (
              <p className="flex items-center gap-1.5 text-error font-body-sm text-xs font-semibold">
                <Icon name="error" size={14} />
                <span>{errors.scheduleTime}</span>
              </p>
            )}
          </div>
        )}

        {/* Quick Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="font-label-sm text-[11px] text-outline font-semibold">
            Gợi ý (+):
          </span>
          <button
            type="button"
            onClick={() => applyDurationPreset(1)}
            className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary transition-colors font-label-sm text-[11px] font-semibold cursor-pointer"
          >
            + 1h
          </button>
          <button
            type="button"
            onClick={() => applyDurationPreset(2)}
            className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary transition-colors font-label-sm text-[11px] font-semibold cursor-pointer"
          >
            + 2h (Lắp tủ)
          </button>
          <button
            type="button"
            onClick={() => applyDurationPreset(3)}
            className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary transition-colors font-label-sm text-[11px] font-semibold cursor-pointer"
          >
            + 3h
          </button>
          <button
            type="button"
            onClick={() => applyDurationPreset(4)}
            className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary transition-colors font-label-sm text-[11px] font-semibold cursor-pointer"
          >
            + 4h (Nửa ngày)
          </button>
        </div>
      </div>
    </div>
  )
}
