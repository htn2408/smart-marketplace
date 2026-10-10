import { useState } from 'react'
import Icon from '../common/Icon'
import Button from '../common/Button'
import StarRating from '../common/StarRating'

/**
 * Reviews List & Rating Breakdown component for Tasker Profile
 */
export default function ReviewsList() {
  const [activeFilter, setActiveFilter] = useState('all')

  const filterChips = [
    { id: 'all', label: 'Tất cả (324)' },
    { id: 'ikea', label: 'Lắp tủ IKEA (180)' },
    { id: 'drill', label: 'Khoan tường (85)' },
    { id: 'punctual', label: 'Đúng giờ (140)' },
    { id: 'photos', label: 'Có hình ảnh (48)' },
  ]

  const ratingBars = [
    { stars: '5 sao', pct: '92%', count: 92, color: 'bg-primary' },
    { stars: '4 sao', pct: '6%', count: 6, color: 'bg-primary/70' },
    { stars: '3 sao', pct: '2%', count: 2, color: 'bg-secondary' },
    { stars: '2 sao', pct: '0%', count: 0, color: 'bg-outline-variant' },
    { stars: '1 sao', pct: '0%', count: 0, color: 'bg-outline-variant' },
  ]

  const reviews = [
    {
      id: 1,
      initials: 'HL',
      initialsBg: 'bg-primary-fixed text-on-primary-fixed',
      author: 'Hoàng Linh',
      meta: 'Chung cư The Sun Avenue, An Phú • 2 ngày trước',
      rating: 5,
      jobType: 'Lắp ráp giường ngủ bọc nệm & bàn làm việc IKEA',
      jobIcon: 'handyman',
      text: 'Bạn Tuấn đến đúng giờ hẹn từng phút, chào hỏi cực kỳ lễ phép. Đồ đạc của mình khá cồng kềnh nhưng bạn ráp rất nhanh, chuẩn xác từng con ốc. Sau khi xong còn dùng máy gom bụi vệ sinh sạch sàn nhà rồi mới xin phép ra về. Chắc chắn sẽ tiếp tục ủng hộ bạn những lần sau!',
    },
    {
      id: 2,
      initials: 'MD',
      initialsBg: 'bg-secondary-fixed text-on-secondary-fixed',
      author: 'Mark Davies',
      meta: 'Thao Dien Pearl, D2 • 1 tuần trước',
      rating: 5,
      jobType: 'TV wall-mounting & Heavy art frames',
      jobIcon: 'tv',
      text: 'Tuan speaks great English and understands exactly what needed to be done. He brought a laser leveler to mount my heavy paintings and 75-inch TV. Super meticulous, checked behind the concrete wall for electrical wiring before drilling. Highly recommended for any expat in Saigon.',
    },
    {
      id: 3,
      initials: 'TH',
      initialsBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
      author: 'Trần Minh Hoàng',
      meta: 'Đảo Kim Cương, Bình Trưng Tây • 2 tuần trước',
      rating: 5,
      jobType: 'Thay van cấp nước nóng lạnh & Khóa điện tử vân tay',
      jobIcon: 'plumbing',
      text: 'Khóa điện tử nhà mình bị lệch then chốt do cửa gỗ hơi xệ, thợ của hãng đến sửa không được nhưng Tuấn đến căn chỉnh lại bản lề rồi đục chỉnh lại mộng khóa vừa khít chỉ sau 40 phút. Giá cả minh bạch đúng theo giờ trên ứng dụng.',
    },
  ]

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-surface-variant/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <Icon
              name="star"
              size={24}
              className="text-secondary"
              filled={true}
            />
            <span>Đánh giá từ khách hàng đã nghiệm thu</span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            100% đánh giá từ khách hàng có hóa đơn đặt việc thực tế trên TaskMate
          </p>
        </div>
      </div>

      {/* Rating Summary Metric Bar Block */}
      <div className="p-6 rounded-xl bg-surface-container-low grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Numerical Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center gap-1 md:pr-4">
          <span className="font-display-hero text-[48px] leading-tight font-extrabold text-on-surface">
            4.98
          </span>
          <StarRating score={4.98} size={20} starsCount={5} showScore={false} />
          <span className="font-caption text-caption text-on-surface-variant mt-1">
            324 khách hàng đã chấm điểm
          </span>
        </div>

        {/* Progress Bars */}
        <div className="md:col-span-8 flex flex-col gap-2">
          {ratingBars.map((bar, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 font-caption text-caption"
            >
              <span className="w-12 text-on-surface font-semibold shrink-0">
                {bar.stars}
              </span>
              <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className={`h-full ${bar.color} rounded-full`}
                  style={{ width: bar.pct }}
                />
              </div>
              <span className="w-10 text-right text-on-surface-variant font-medium shrink-0">
                {bar.pct}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Filters Chip Strip */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.id
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveFilter(chip.id)}
              className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface font-medium hover:bg-surface-container-high'
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* Review List */}
      <div className="flex flex-col gap-6 pt-2">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="flex flex-col gap-3 p-4 rounded-xl bg-surface-container-low border border-surface-variant/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${rev.initialsBg}`}
                >
                  {rev.initials}
                </div>
                <div>
                  <h4 className="font-label-md text-label-md font-bold text-on-surface">
                    {rev.author}
                  </h4>
                  <p className="font-caption text-caption text-on-surface-variant">
                    {rev.meta}
                  </p>
                </div>
              </div>
              <StarRating
                score={rev.rating}
                size={16}
                starsCount={5}
                showScore={false}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-lowest text-primary font-caption text-caption w-fit font-medium border border-surface-variant/30">
              <Icon name={rev.jobIcon} size={14} />
              <span>Công việc: {rev.jobType}</span>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              "{rev.text}"
            </p>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <Button
        variant="tonal"
        size="md"
        icon="expand_more"
        iconPosition="right"
        fullWidth
        className="mt-2"
      >
        Xem thêm 321 đánh giá khác
      </Button>
    </div>
  )
}
