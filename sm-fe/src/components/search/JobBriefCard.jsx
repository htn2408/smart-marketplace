import Icon from '../common/Icon'
import Button from '../common/Button'
import Badge from '../common/Badge'

/**
 * Job Brief summary card on SearchTasker page
 */
export default function JobBriefCard({
  jobId = '#TM-89420',
  title = 'Lắp ráp tủ quần áo 3 cánh IKEA PAX (kèm khoan neo tường an toàn)',
  location = 'Thảo Điền, TP. Thủ Đức',
  time = 'Ngày mai, 09:00 - 12:00',
  budget = '450.000₫',
  postedTime = '18 phút trước',
  matchCount = 6,
  onEdit,
  onViewDetails,
}) {
  return (
    <section className="max-w-[1240px] mx-auto px-6 pt-6 pb-4 w-full">
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-variant/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md bg-surface-container-high text-on-surface-variant font-caption text-caption font-semibold tracking-wide">
                {jobId}
              </span>
              <Badge variant="primary" size="sm">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Hệ thống đã tìm thấy {matchCount} thợ phù hợp gần bạn
              </Badge>
              <span className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
                <Icon name="schedule" size={16} />
                Đăng {postedTime}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
              {title}
            </h1>

            {/* Metadata list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-on-surface-variant font-body-sm text-body-sm">
              <div className="flex items-center gap-2">
                <Icon name="location_on" size={20} className="text-primary" />
                <span>{location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="calendar_month" size={20} className="text-primary" />
                <span>{time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="payments" size={20} className="text-primary" />
                <span>
                  Ngân sách dự kiến:{' '}
                  <strong className="text-on-surface font-semibold text-body-md">
                    {budget}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 lg:border-l lg:border-surface-variant lg:pl-6 shrink-0">
            <Button
              variant="tonal"
              size="md"
              icon="edit_document"
              onClick={onEdit}
            >
              Chỉnh sửa bài
            </Button>
            <Button
              variant="tonal"
              size="md"
              icon="visibility"
              className="text-on-surface-variant"
              onClick={onViewDetails}
            >
              Xem chi tiết
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
