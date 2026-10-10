import { useState } from 'react'
import Icon from '../common/Icon'
import Button from '../common/Button'
import TaskSearchInput from '../common/TaskSearchInput'

/**
 * Interactive Hero Search & Post Card
 * Uses shared TaskSearchInput with real-time autocomplete dropdown and streamlined post task CTA
 */
export default function HeroSearch({ onSearch }) {
  const [taskQuery, setTaskQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)

  const quickPills = [
    { label: 'Lắp tủ IKEA', query: 'Lắp ráp tủ quần áo 3 cánh IKEA', category: 'Nội thất & Lắp ráp', icon: 'shelves' },
    { label: 'Dọn căn hộ', query: 'Dọn dẹp căn hộ 2 phòng ngủ', category: 'Vệ sinh nhà cửa', icon: 'cleaning_services' },
    { label: 'Vận chuyển trọ', query: 'Vận chuyển trọ sinh viên', category: 'Vận chuyển', icon: 'local_shipping' },
    { label: 'Treo TV', query: 'Khoan tường treo TV 55 - 75 inch', category: 'Điện & Lắp đặt', icon: 'tv' },
  ]

  const handleSubmit = (e) => {
    e?.preventDefault()
    const finalTask = selectedTask || {
      title: taskQuery.trim() || 'Lắp ráp đồ nội thất gia đình',
      categoryName: 'Dịch vụ đời sống',
    }
    if (onSearch) {
      onSearch({
        taskQuery: taskQuery.trim(),
        selectedTask: finalTask,
      })
    }
  }

  return (
    <div className="flex flex-col gap-3 max-w-2xl relative">
      {/* Streamlined Search & Post Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest p-2 sm:p-2.5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 border border-surface-variant/40 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all relative z-20"
      >
        <TaskSearchInput
          variant="hero"
          icon="edit_note"
          value={taskQuery}
          onChange={(val) => {
            setTaskQuery(val)
            setSelectedTask(null)
          }}
          onSelectTask={(task) => {
            setSelectedTask(task)
          }}
          className="flex-1 min-w-0"
        />

        {/* Post Task Button placed right beside the input */}
        <Button
          type="submit"
          variant="primaryContainer"
          size="lg"
          icon="send"
          iconPosition="right"
          className="rounded-xl px-6 py-3.5 whitespace-nowrap shadow-md hover:shadow-lg font-bold flex-shrink-0 cursor-pointer"
        >
          Đăng việc ngay
        </Button>
      </form>

      {/* Trust reassurance note */}
      <div className="flex items-center gap-1.5 text-on-surface-variant font-caption text-caption px-1">
        <Icon name="verified" size={16} className="text-primary flex-shrink-0" />
        <span>Thợ tự do cạnh tranh lành mạnh, bạn chọn mức giá tốt nhất</span>
      </div>

      {/* Quick Pill Tags */}
      <div className="flex flex-wrap items-center gap-2 pt-1 px-1">
        <span className="font-label-sm text-label-sm text-outline font-semibold">
          Phổ biến:
        </span>
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setTaskQuery(pill.query)
              setSelectedTask({
                title: pill.query,
                categoryName: pill.category,
                icon: pill.icon,
              })
            }}
            className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary transition-colors font-label-sm text-label-sm shadow-sm cursor-pointer"
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  )
}
