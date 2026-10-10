import Icon from '../common/Icon'

/**
 * Service Area & Coverage Map component for Tasker Profile
 */
export default function ServiceArea() {
  const districts = [
    { name: 'TP. Thủ Đức (Quận 2, Quận 9 cũ)', active: true },
    { name: 'Quận Bình Thạnh', active: false },
    { name: 'Quận 1', active: false },
    { name: 'Quận 3', active: false },
    { name: 'Quận Phú Nhuận', active: false },
    { name: 'Quận 7 (Khu Phú Mỹ Hưng)', active: false },
    { name: 'Quận 10 & Quận 4', active: false },
  ]

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-surface-variant/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <Icon name="map" size={24} className="text-primary" />
            <span>Khu vực hoạt động &amp; Phạm vi phục vụ</span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Cư trú tại Phường An Phú, TP. Thủ Đức. Sẵn sàng di chuyển nhanh
            chóng trong bán kính 15km
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-primary font-label-sm text-label-sm font-semibold">
          <Icon name="electric_moped" size={18} />
          <span>Đến nơi sau 30-45 phút</span>
        </div>
      </div>

      {/* District Pill Chips */}
      <div className="flex flex-wrap gap-2">
        {districts.map((item, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-label-sm text-label-sm ${
              item.active
                ? 'bg-primary-fixed/40 text-on-primary-fixed-variant font-semibold'
                : 'bg-surface-container-high text-on-surface font-medium'
            }`}
          >
            {item.active && (
              <Icon name="near_me" size={16} className="text-primary" />
            )}
            {item.name}
          </span>
        ))}
      </div>
    </div>
  )
}
