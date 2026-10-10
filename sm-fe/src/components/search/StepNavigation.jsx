import Icon from '../common/Icon'

/**
 * Multi-step Navigation Bar for Search / Booking Flow
 */
export default function StepNavigation({ totalFound = 6 }) {
  return (
    <section className="w-full bg-surface-container-lowest shadow-sm border-b border-surface-variant/30">
      <div className="max-w-[1240px] mx-auto px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Step items container */}
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {/* Step 1 */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm">
                <Icon name="check" size={18} />
              </span>
              <div className="flex flex-col">
                <span className="font-caption text-caption text-on-surface-variant font-medium">
                  Bước 1
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Chi tiết công việc
                </span>
              </div>
            </div>

            <div className="w-8 sm:w-12 h-0.5 bg-primary-container shrink-0" />

            {/* Step 2 (Active) */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shadow-md">
                2
              </span>
              <div className="flex flex-col">
                <span className="font-caption text-caption text-primary font-bold uppercase tracking-wider">
                  Đang chọn
                </span>
                <span className="font-label-md text-label-md text-primary font-bold">
                  Gợi ý thợ phù hợp
                </span>
              </div>
            </div>

            <div className="w-8 sm:w-12 h-0.5 bg-surface-variant shrink-0" />

            {/* Step 3 */}
            <div className="flex items-center gap-2.5 shrink-0 opacity-60">
              <span className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm">
                3
              </span>
              <div className="flex flex-col">
                <span className="font-caption text-caption text-on-surface-variant font-medium">
                  Bước 3
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                  Xác nhận &amp; Nghiệm thu
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Live Watch Indicator */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant font-label-sm text-label-sm self-start md:self-auto">
            <Icon name="person_search" size={18} className="text-primary" />
            <span>
              Tìm thấy <strong>{totalFound} thợ</strong> đáp ứng yêu cầu
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
