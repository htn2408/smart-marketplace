import Icon from '../common/Icon'

/**
 * Services and Estimated Rates List
 */
export default function ServicesRates() {
  const services = [
    {
      id: 'furniture',
      title: 'Lắp ráp đồ nội thất',
      rate: '~200k - 240k/h',
      subtext: 'hoặc theo độ phức tạp',
    },
    {
      id: 'drilling',
      title: 'Khoan tường treo rèm, TV & Gương lớn',
      rate: '~190k - 230k/h',
      subtext: 'hoặc theo độ phức tạp',
    },
    {
      id: 'electric_water',
      title: 'Sửa chữa điện dân dụng & Đường nước vặt',
      rate: '~200k - 250k/h',
      subtext: 'hoặc theo độ phức tạp',
    },
    {
      id: 'smart_lock',
      title: 'Khóa thông minh Smart Lock & Gia dụng',
      rate: '~220k - 280k/h',
      subtext: 'hoặc theo độ phức tạp',
    },
  ]

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-surface-variant/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <Icon name="tune" size={24} className="text-primary" />
            <span>Lĩnh vực chuyên môn &amp; Khoảng thù lao mong muốn</span>
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Khoảng giá tham khảo thợ thường nhận (Khách hàng chủ động đề xuất ngân
            sách theo yêu cầu)
          </p>
        </div>
        <span className="font-label-sm text-label-sm text-primary bg-primary-fixed/30 px-3 py-1.5 rounded-full font-semibold self-start sm:self-auto">
          Mở cho thương lượng &amp; đề xuất
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="p-4 sm:p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-transparent hover:border-primary/10"
          >
            <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
              {svc.title}
            </h3>

            <div className="flex flex-col sm:items-end shrink-0">
              <span className="font-label-md text-label-md font-bold text-primary">
                Kỳ vọng: {svc.rate}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                {svc.subtext}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
