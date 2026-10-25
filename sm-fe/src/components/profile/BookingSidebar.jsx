import { useState } from 'react'
import Icon from '../common/Icon'
import Button from '../common/Button'
import Badge from '../common/Badge'
import TaskScheduleSelector from '../common/TaskScheduleSelector'
import TaskBudgetSelector from '../common/TaskBudgetSelector'
import { formatCurrency } from '../../utils/formatters'

/**
 * Interactive Booking & Offer Sidebar for Tasker Profile
 */
export default function BookingSidebar({
  taskerName = 'Tuấn',
  initialRate = 200000,
  taskerSkills = [],
  onSubmitOffer,
}) {
  const defaultSkillId = taskerSkills?.[0]?.skillId || taskerSkills?.[0]?.id || ''
  const defaultSkillName = taskerSkills?.[0]?.skillName || taskerSkills?.[0]?.name || ''

  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [customJobDetail, setCustomJobDetail] = useState('')

  const activeSkillId = selectedSkillId || defaultSkillId
  const activeSkill = (taskerSkills || []).find((s) => (s.skillId || s.id) === activeSkillId)
  const activeSkillName = activeSkill?.skillName || activeSkill?.name || defaultSkillName

  const [selectedDate, setSelectedDate] = useState('tomorrow')
  const [customDate, setCustomDate] = useState('')
  const [startTime, setStartTime] = useState('08:30')
  const [endTime, setEndTime] = useState('10:30')
  const [amount, setAmount] = useState(450000)
  const [allowRenegotiate, setAllowRenegotiate] = useState(true)

  const handleSkillChange = (e) => {
    setSelectedSkillId(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalJobDetail = customJobDetail.trim() || activeSkillName || 'Công việc gia đình'
    const offerData = {
      serviceType: activeSkillId || 'general',
      skillId: activeSkillId,
      skillName: activeSkillName || finalJobDetail,
      jobDetail: finalJobDetail,
      selectedDate,
      customDate,
      startTime,
      endTime,
      selectedTimeSlot: `${startTime} - ${endTime}`,
      amount,
      packagePrice: formatCurrency(amount),
      allowRenegotiate,
    }

    if (onSubmitOffer) {
      onSubmitOffer(offerData)
    } else {
      alert(`Đã gửi đề xuất việc "${finalJobDetail}" cho ${taskerName} thành công!`)
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
            1. Chọn công việc bạn cần {taskerName} làm
          </label>
          <div className="relative">
            <select
              id="offerJobInput"
              value={activeSkillId}
              onChange={handleSkillChange}
              className="w-full appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg py-2.5 px-3 pr-10 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary cursor-pointer border border-transparent focus:border-primary/20"
            >
              {taskerSkills && taskerSkills.length > 0 ? (
                taskerSkills.map((s) => {
                  const sId = s.skillId || s.id
                  const sName = s.skillName || s.name
                  return (
                    <option key={sId} value={sId}>
                      {sName}
                    </option>
                  )
                })
              ) : (
                <>
                  <option value="ikea">Lắp ráp đồ nội thất IKEA &amp; Gia đình</option>
                  <option value="drill">Khoan tường treo rèm, TV &amp; Gương lớn</option>
                  <option value="electric">
                    Sửa chữa điện gia dụng &amp; Đường nước vặt
                  </option>
                  <option value="lock">Lắp khóa cửa thông minh Smart Lock</option>
                  <option value="other">Công việc sửa chữa tiện ích khác...</option>
                </>
              )}
            </select>
            <Icon
              name="arrow_drop_down"
              size={20}
              className="absolute right-3 top-3 text-on-surface-variant pointer-events-none"
            />
          </div>
          <input
            type="text"
            value={customJobDetail}
            onChange={(e) => setCustomJobDetail(e.target.value)}
            placeholder="Nhập nội dung công việc..."
            className="w-full bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg py-2 px-3 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary border border-transparent focus:border-primary/20"
          />
        </div>

        {/* 2. Date & Time Selection (Reused TaskScheduleSelector) */}
        <TaskScheduleSelector
          compact
          id="booking-schedule"
          stepTitle="2. Chọn ngày & khung giờ bạn muốn làm"
          title=""
          selectedDate={selectedDate}
          onChangeSelectedDate={setSelectedDate}
          customDate={customDate}
          onChangeCustomDate={setCustomDate}
          startTime={startTime}
          onChangeStartTime={setStartTime}
          endTime={endTime}
          onChangeEndTime={setEndTime}
        />

        {/* 3. Budget Proposal (Reused TaskBudgetSelector) */}
        <TaskBudgetSelector
          compact
          id="booking-budget"
          stepTitle="3. Đề xuất mức thù lao của bạn:"
          title=""
          subtitle=""
          amount={amount}
          onChangeAmount={setAmount}
          allowNegotiate={allowRenegotiate}
          onChangeAllowNegotiate={setAllowRenegotiate}
        />

        {/* Total Summary */}
        <div className="p-3.5 rounded-lg bg-surface-container flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-label-md text-label-md font-bold text-on-surface">
            <span>Mức thù lao bạn đề xuất:</span>
            <span className="text-primary font-extrabold text-[18px]">
              {formatCurrency(amount)}
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
          icon="arrow_forward"
          iconPosition="right"
          fullWidth
        >
          Tiếp tục: Địa chỉ &amp; Hình ảnh
        </Button>
        <p className="font-caption text-xs text-on-surface-variant text-center -mt-2">
          Bước tiếp theo: Thêm vị trí &amp; ảnh chụp hiện trường để gửi trực tiếp cho {taskerName}.
        </p>

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
