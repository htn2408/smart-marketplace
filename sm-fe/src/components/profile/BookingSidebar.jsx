import { useState } from 'react'
import Icon from '../common/Icon'
import Button from '../common/Button'
import Badge from '../common/Badge'

/**
 * Interactive Booking & Offer Sidebar for Tasker Profile
 */
export default function BookingSidebar({
  taskerName = 'Tuấn',
  initialRate = 200000,
  onSubmitOffer,
}) {
  const [serviceType, setServiceType] = useState('ikea')
  const [jobDetail, setJobDetail] = useState(
    'Lắp ráp tủ quần áo PAX 2 buồng + 1 bàn Micke'
  )
  const [selectedDate, setSelectedDate] = useState('today')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('08:30 - 10:30')
  const [pricingType, setPricingType] = useState('package') // 'package' | 'hourly'
  const [packagePrice, setPackagePrice] = useState('450.000')
  const [allowRenegotiate, setAllowRenegotiate] = useState(true)

  const dateOptions = [
    { id: 'today', label: 'Hôm nay', sub: '24 Th10' },
    { id: 'tomorrow', label: 'Ngày mai', sub: '25 Th10' },
    { id: 'saturday', label: 'Thứ Bảy', sub: '26 Th10' },
  ]

  const timeSlots = ['08:30 - 10:30', '14:00 - 16:00', '18:00 - 20:00']

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmitOffer) {
      onSubmitOffer({
        serviceType,
        jobDetail,
        selectedDate,
        selectedTimeSlot,
        pricingType,
        packagePrice,
        allowRenegotiate,
      })
    } else {
      alert(`Đã gửi đề xuất việc "${jobDetail}" cho ${taskerName} thành công!`)
    }
  }

  return (
    <div className="lg:col-span-4 sticky top-24">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-xl p-6 shadow-md flex flex-col gap-5 border border-surface-variant/30"
      >
        {/* Header */}
        <div className="flex flex-col gap-1.5 pb-2 border-b border-surface-container-high">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Gửi đề xuất việc &amp; Thù lao
            </h3>
            <Badge variant="primary" icon="handshake" size="xs">
              Thương lượng
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-caption text-caption bg-surface-container-low px-2.5 py-1.5 rounded-lg mt-1">
            <Icon name="info" size={16} className="text-primary" />
            <span>
              {taskerName} thường nhận việc từ{' '}
              <strong>~{initialRate.toLocaleString('vi-VN')}₫/h</strong> (Mở cho
              thương lượng)
            </span>
          </div>
        </div>

        {/* 1. Job Selection */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-label-sm text-label-sm font-bold text-on-surface"
            htmlFor="offerJobInput"
          >
            1. Chọn hoặc nhập công việc bạn cần {taskerName} làm
          </label>
          <div className="relative">
            <select
              id="offerJobInput"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg py-2.5 px-3 pr-10 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary cursor-pointer border border-transparent focus:border-primary/20"
            >
              <option value="ikea">Lắp ráp đồ nội thất IKEA &amp; Gia đình</option>
              <option value="drill">Khoan tường treo rèm, TV &amp; Gương lớn</option>
              <option value="electric">
                Sửa chữa điện gia dụng &amp; Đường nước vặt
              </option>
              <option value="lock">Lắp khóa cửa thông minh Smart Lock</option>
              <option value="other">Công việc sửa chữa tiện ích khác...</option>
            </select>
            <Icon
              name="arrow_drop_down"
              size={20}
              className="absolute right-3 top-3 text-on-surface-variant pointer-events-none"
            />
          </div>
          <input
            type="text"
            value={jobDetail}
            onChange={(e) => setJobDetail(e.target.value)}
            placeholder="Mô tả chi tiết (ví dụ: Lắp tủ IKEA 2 cánh + treo 1 TV 55 inch)"
            className="w-full bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg py-2 px-3 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary border border-transparent focus:border-primary/20"
          />
        </div>

        {/* 2. Date & Time Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-label-sm font-bold text-on-surface">
            2. Chọn ngày &amp; khung giờ bạn muốn làm
          </label>
          <div className="grid grid-cols-3 gap-2">
            {dateOptions.map((opt) => {
              const isSelected = selectedDate === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDate(opt.id)}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`font-caption text-caption ${
                      isSelected ? 'opacity-90' : 'text-on-surface-variant'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="font-label-sm text-label-sm font-bold">
                    {opt.sub}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-1">
            {timeSlots.map((slot) => {
              const isSelected = selectedTimeSlot === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`py-1.5 px-2 rounded-lg font-label-sm text-label-sm text-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-surface-container-high text-on-surface font-bold ring-2 ring-primary'
                      : 'bg-surface-container-low text-on-surface font-medium hover:bg-surface-container'
                  }`}
                >
                  {slot}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Budget Proposal */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-surface-container-low ring-1 ring-primary/20">
          <label className="font-label-sm text-label-sm font-bold text-on-surface">
            3. Đề xuất mức thù lao của bạn:
          </label>

          {/* Pricing Model Toggle */}
          <div className="grid grid-cols-2 p-1 rounded-lg bg-surface-container gap-1">
            <button
              type="button"
              onClick={() => setPricingType('package')}
              className={`py-1.5 rounded-md font-label-sm text-label-sm text-center cursor-pointer transition-all ${
                pricingType === 'package'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
            >
              Trả trọn gói việc này
            </button>
            <button
              type="button"
              onClick={() => setPricingType('hourly')}
              className={`py-1.5 rounded-md font-label-sm text-label-sm text-center cursor-pointer transition-all ${
                pricingType === 'hourly'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
            >
              Trả theo giờ
            </button>
          </div>

          {/* Amount input */}
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <input
                type="text"
                value={packagePrice}
                onChange={(e) => setPackagePrice(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface font-headline-md text-headline-md font-bold rounded-lg py-2 pl-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-3 top-3 text-body-sm font-semibold text-on-surface-variant">
                VNĐ
              </span>
            </div>
            <span className="text-body-sm text-on-surface-variant font-medium">
              {pricingType === 'package' ? 'trọn gói' : '/giờ'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-primary-fixed/30 text-on-primary-fixed-variant flex items-start gap-2">
            <Icon
              name="lightbulb"
              size={18}
              className="text-primary shrink-0 mt-0.5"
            />
            <p className="font-caption text-caption leading-tight">
              <strong>Mức thù lao gợi ý cho công việc này:</strong> 400.000₫ –
              500.000₫ để thợ nhận ngay không cần trả giá lại.
            </p>
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allowRenegotiate}
              onChange={(e) => setAllowRenegotiate(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <span className="font-caption text-caption text-on-surface">
              Cho phép Tasker đề xuất lại mức giá nếu công việc phát sinh
            </span>
          </label>
        </div>

        {/* Total Summary */}
        <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-label-md text-label-md font-bold text-on-surface">
            <span>Mức thù lao bạn đề xuất:</span>
            <span className="text-primary font-extrabold text-[18px]">
              {packagePrice}₫ {pricingType === 'hourly' && '/h'}
            </span>
          </div>
          <p className="font-caption text-caption text-on-surface-variant">
            Tạm giữ an toàn qua TaskMate Pledge, chỉ thanh toán cho {taskerName} khi
            bạn nghiệm thu hài lòng 100%.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          icon="send"
          iconPosition="left"
          fullWidth
        >
          Gửi đề xuất việc cho {taskerName}
        </Button>

        {/* Assurance notes */}
        <div className="flex flex-col gap-2 text-center">
          <p className="font-caption text-caption text-on-surface-variant">
            <Icon
              name="bolt"
              size={14}
              className="align-middle text-primary mr-1"
            />
            {taskerName} sẽ phản hồi trong vòng <strong>5 phút</strong>. Bạn
            hoàn toàn chưa bị trừ tiền.
          </p>
          <div className="flex items-center justify-center gap-1.5 font-caption text-caption text-tertiary">
            <Icon name="verified_user" size={16} className="text-primary" />
            <span>TaskMate Happiness Pledge bảo vệ khách hàng 100%</span>
          </div>
        </div>
      </form>

      {/* Flexible mechanism callout */}
      <div className="mt-4 p-4 rounded-xl bg-primary/10 text-on-surface flex items-start gap-3 border border-primary/20">
        <Icon
          name="handshake"
          size={24}
          className="text-primary shrink-0 mt-0.5"
        />
        <div className="flex flex-col">
          <h5 className="font-label-sm text-label-sm font-bold text-primary">
            Cơ chế đề xuất linh hoạt
          </h5>
          <p className="font-caption text-caption text-on-surface-variant mt-0.5">
            Bạn được tự do đưa ra ngân sách phù hợp. Nếu {taskerName} đồng ý hoặc
            thương lượng lại, bạn vẫn có quyền quyết định có chấp thuận hay
            không.
          </p>
        </div>
      </div>
    </div>
  )
}
