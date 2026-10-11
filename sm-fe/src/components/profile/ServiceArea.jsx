import Icon from '../common/Icon'
import DistrictMultiSelector from '../common/DistrictMultiSelector'

/**
 * Service Area & Coverage Map component for Tasker Profile
 * Reuses shared DistrictMultiSelector (Province + District without Ward).
 */
export default function ServiceArea({
  districts = [],
  description = 'Sẵn sàng nhận việc và di chuyển nhanh chóng trong các quận/huyện đã đăng ký hoạt động.',
  editable = false,
  onAddDistrict,
  onRemoveDistrict,
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-surface-variant/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <Icon name="map" size={24} className="text-primary" />
            <span>Khu vực hoạt động &amp; Phạm vi phục vụ</span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-primary font-label-sm text-label-sm font-semibold">
          <Icon name="electric_moped" size={18} />
          <span>Đến nơi sau 30-45 phút</span>
        </div>
      </div>

      {/* Shared Province & District Picker (without Ward) */}
      <DistrictMultiSelector
        districts={districts}
        readOnly={!editable}
        onAddDistrict={onAddDistrict}
        onRemoveDistrict={onRemoveDistrict}
      />
    </div>
  )
}
