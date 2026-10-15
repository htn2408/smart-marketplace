import { useState, useMemo } from 'react'
import TaskerLayout from '../components/layout/TaskerLayout'
import Icon from '../components/common/Icon'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'

/**
 * Danh sách yêu cầu & lịch hẹn mẫu chuẩn hoá theo thiết kế TaskMate
 */
const INITIAL_REQUESTS = [
  {
    id: 'REQ-01',
    code: '#TM-89421',
    title: 'Lắp quạt trần tại nhà',
    category: 'Điện gia dụng',
    icon: 'mode_fan',
    clientName: 'Nguyễn Minh Anh',
    clientRating: '5.0',
    clientPhone: '0982 345 671',
    price: 250000,
    priceNote: 'Báo giá dịch vụ trọn gói',
    time: '14/10/2026 • 09:00',
    dateIso: '2026-10-14',
    hourSlot: '09:00 - 10:30',
    location: 'Cầu Giấy, Hà Nội',
    distance: 'cách bạn 2.4 km',
    addressDetail: 'Số 18 Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    note: 'Trần bê tông có sẵn móc treo và đường điện chờ',
    status: 'NEW', // NEW, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    statusNote: 'Khách yêu cầu xác nhận trước 20:00 tối nay',
  },
  {
    id: 'REQ-02',
    code: '#TM-89422',
    title: 'Sửa đường ống nước bồn rửa chén rò rỉ',
    category: 'Sửa điện nước',
    icon: 'plumbing',
    clientName: 'Lê Hoàng Yến',
    clientRating: '4.9',
    clientPhone: '0913 888 234',
    price: 320000,
    priceNote: 'Bao gồm công thợ & phụ kiện nhỏ',
    time: '15/10/2026 • 14:00',
    dateIso: '2026-10-15',
    hourSlot: '14:00 - 15:30',
    location: 'Đống Đa, Hà Nội',
    distance: 'cách bạn 4.1 km',
    addressDetail: 'Phòng 402, Nhà A3 TT Kim Liên, Đống Đa, Hà Nội',
    note: 'Cần mang thêm ống ruột gà phi 34 và băng tan cao su non',
    noteWarning: true,
    status: 'NEW',
    statusNote: 'Yêu cầu đến đúng hẹn vì khách bận giờ hành chính',
  },
  {
    id: 'REQ-03',
    code: '#TM-88231',
    title: 'Lắp ráp bàn làm việc gỗ tự nhiên & ghế công thái học',
    category: 'Lắp ráp nội thất',
    icon: 'handyman',
    clientName: 'Trần Văn Nam',
    clientRating: '4.8',
    clientPhone: '0977 123 456',
    price: 180000,
    priceNote: 'Đã thanh toán Escrow an toàn',
    time: '16/10/2026 • 08:30 Sáng',
    dateIso: '2026-10-16',
    hourSlot: '08:30 - 10:30',
    location: 'Nam Từ Liêm, Hà Nội',
    distance: 'chung cư Vinhomes Smart City',
    addressDetail: 'Tòa S2.03 Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội',
    note: 'Kiện hàng nguyên thùng để tại phòng khách tầng 15',
    status: 'CONFIRMED',
    statusNote: 'Khách đã đặt cọc trực tuyến qua cổng TaskMate',
  },
  {
    id: 'REQ-04',
    code: '#TM-88190',
    title: 'Thay thế ổ cắm điện & aptomat chống giật Panasonic',
    category: 'Sửa chữa điện gia dụng',
    icon: 'electric_bolt',
    clientName: 'Vũ Quỳnh Trang',
    clientRating: '5.0',
    clientPhone: '0904 999 888',
    price: 200000,
    priceNote: 'Tiền công đã chốt',
    time: 'Hôm nay • 10:00 (Đang làm việc)',
    dateIso: '2026-10-15',
    hourSlot: '10:00 - 11:30',
    location: 'Phố Giảng Võ, Ba Đình, Hà Nội',
    distance: 'cách bạn 1.8 km',
    addressDetail: 'Số 62 ngõ 187 Giảng Võ, Ba Đình, Hà Nội',
    note: 'Aptomat cũ nhảy liên tục khi bật bình nóng lạnh',
    status: 'IN_PROGRESS',
    statusNote: 'Thời gian thực tế: 35 phút',
  },
]

/**
 * RequireAndCalendar Component - Trang Quản lý Yêu cầu & Lịch hẹn của Tasker
 * Tuân thủ chuẩn rule.md: Tái sử dụng TaskerLayout, Icon, Button, Badge và theme Verdant Trust.
 */
export default function RequireAndCalendar({ onNavigate }) {
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [filterTab, setFilterTab] = useState('all') // all, new, confirmed, in_progress, completed, cancelled
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  // Hiển thị toast thông báo nhanh
  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Thao tác với yêu cầu: Chấp nhận
  const handleAccept = (taskId) => {
    setRequests((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: 'CONFIRMED',
              statusNote: 'Bạn đã chấp nhận đơn. Hãy chuẩn bị đồ nghề!',
            }
          : item
      )
    )
    showToast('Đã chấp nhận đơn việc thành công!')
  }

  // Thao tác với yêu cầu: Từ chối
  const handleDecline = (taskId) => {
    setRequests((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: 'CANCELLED',
              statusNote: 'Bạn đã từ chối yêu cầu này.',
            }
          : item
      )
    )
    showToast('Đã từ chối đơn công việc.')
  }

  // Thao tác: Bắt đầu di chuyển
  const handleStartMoving = (taskId) => {
    setRequests((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: 'IN_PROGRESS',
              statusNote: 'Đang di chuyển đến nhà khách',
            }
          : item
      )
    )
    showToast('Đã cập nhật: Bạn đang di chuyển đến địa điểm!')
  }

  // Thao tác: Hoàn thành & Nghiệm thu
  const handleComplete = (taskId) => {
    setRequests((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: 'COMPLETED',
              statusNote: 'Công việc hoàn thành xuất sắc!',
            }
          : item
      )
    )
    showToast('Đã xác nhận hoàn thành công việc. Tiền công đang giải ngân!')
  }

  // Tính toán số liệu thống kê (Metrics) động theo state
  const metrics = useMemo(() => {
    const newCount = requests.filter((r) => r.status === 'NEW').length
    const confirmedCount = requests.filter((r) => r.status === 'CONFIRMED').length
    const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS').length
    const completedCount = requests.filter((r) => r.status === 'COMPLETED').length + 12 // 12 lịch đã hoàn thành trước đó
    return {
      newCount,
      confirmedCount,
      inProgressCount,
      completedCount,
    }
  }, [requests])

  // Lọc danh sách theo filterTab
  const filteredRequests = useMemo(() => {
    if (filterTab === 'all') return requests
    if (filterTab === 'new') return requests.filter((r) => r.status === 'NEW')
    if (filterTab === 'confirmed') return requests.filter((r) => r.status === 'CONFIRMED')
    if (filterTab === 'in_progress') return requests.filter((r) => r.status === 'IN_PROGRESS')
    if (filterTab === 'completed') return requests.filter((r) => r.status === 'COMPLETED')
    if (filterTab === 'cancelled') return requests.filter((r) => r.status === 'CANCELLED')
    return requests
  }, [requests, filterTab])

  // Định dạng tiền tệ VND
  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('vi-VN') + 'đ'
  }

  return (
    <TaskerLayout
      activeMenu="requests"
      onNavigate={onNavigate}
      title="Yêu cầu & Lịch hẹn"
    >
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-primary text-on-primary px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-primary-container">
            <Icon name="check_circle" size={20} />
            <span className="font-label-md text-sm font-bold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Banner Header: Tiêu đề & Nút bật Lịch hẹn */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 lg:p-8 shadow-sm border border-surface-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/5 pointer-events-none blur-3xl" />
        <div className="flex flex-col gap-1.5 z-10 max-w-xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="font-label-sm text-xs text-primary uppercase tracking-wider font-extrabold">
              Khu vực làm việc • Hà Nội
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
            Yêu cầu &amp; Lịch hẹn
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant">
            Quản lý yêu cầu đặt dịch vụ, sắp xếp thứ tự thực hiện và điều phối lịch làm việc của bạn trong tuần.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 self-start md:self-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            icon="event_available"
            onClick={() => setIsCalendarModalOpen(true)}
            className="rounded-2xl bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-variant/40 font-bold shadow-sm"
          >
            Xem chế độ Lịch
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            icon="tune"
            onClick={() => showToast('Đang áp dụng bộ lọc ưu tiên khoảng cách gần nhất!')}
            className="rounded-2xl px-3.5 shadow-sm"
            title="Lọc nhanh vị trí & thời gian"
          />
        </div>
      </section>

      {/* 4 Bento Metrics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {/* Metric 1: Yêu cầu mới */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 shadow-sm border border-surface-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-md text-sm font-semibold text-on-surface-variant">
              Yêu cầu mới
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Icon name="notifications_active" size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-hero text-3xl font-extrabold text-amber-800 tracking-tight">
                {String(metrics.newCount).padStart(2, '0')}
              </span>
              <span className="inline-flex items-center text-amber-900 font-label-sm text-xs font-extrabold bg-amber-200/60 px-2 py-0.5 rounded-lg">
                Mới
              </span>
            </div>
            <p className="font-caption text-xs text-amber-800 font-semibold mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              <span>Chờ phản hồi (Ưu tiên 15p)</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Lịch sắp tới */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 shadow-sm border border-surface-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-md text-sm font-semibold text-on-surface-variant">
              Lịch sắp tới
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary">
              <Icon name="calendar_month" size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-hero text-3xl font-extrabold text-primary tracking-tight">
                {String(metrics.confirmedCount).padStart(2, '0')}
              </span>
              <span className="font-label-sm text-xs font-semibold text-on-surface-variant">
                lịch đặt
              </span>
            </div>
            <p className="font-caption text-xs text-primary font-semibold mt-2 flex items-center gap-1">
              <Icon name="verified" size={15} />
              <span>Đã xác nhận &amp; cọc Escrow</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Đang thực hiện */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 shadow-sm border border-surface-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-md text-sm font-semibold text-on-surface-variant">
              Đang thực hiện
            </span>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
              <Icon name="build_circle" size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-hero text-3xl font-extrabold text-on-surface tracking-tight">
                {String(metrics.inProgressCount).padStart(2, '0')}
              </span>
              <span className="font-label-sm text-xs font-semibold text-on-surface-variant">
                đang chạy
              </span>
            </div>
            <p className="font-caption text-xs text-on-surface-variant font-medium mt-2 flex items-center gap-1">
              <Icon name="timer" size={15} className="text-primary" />
              <span>Ba Đình, Hà Nội</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Đã hoàn thành */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 shadow-sm border border-surface-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-md text-sm font-semibold text-on-surface-variant">
              Đã hoàn thành
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="task_alt" size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-hero text-3xl font-extrabold text-on-surface tracking-tight">
                {metrics.completedCount}
              </span>
              <span className="font-label-sm text-xs font-bold text-primary">
                Tháng 10
              </span>
            </div>
            <p className="font-caption text-xs text-on-surface-variant font-medium mt-2 flex items-center gap-1">
              <Icon name="thumb_up" size={15} className="text-primary" />
              <span>Đánh giá 100% hài lòng</span>
            </p>
          </div>
        </div>
      </section>

      {/* Main List Section */}
      <section className="space-y-5">
        {/* Filter Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-md text-xl font-extrabold text-on-surface tracking-tight">
              Danh sách yêu cầu dịch vụ
            </h2>
            <p className="font-caption text-xs text-on-surface-variant">
              Tự động sắp xếp theo thứ tự ưu tiên thời gian và khoảng cách địa lý gần bạn nhất
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'all', label: 'Tất cả', count: requests.length },
              { id: 'new', label: 'Yêu cầu mới', count: metrics.newCount, color: 'bg-amber-100 text-amber-900' },
              { id: 'confirmed', label: 'Đã xác nhận', count: metrics.confirmedCount, color: 'bg-primary-fixed text-primary' },
              { id: 'in_progress', label: 'Đang thực hiện', count: metrics.inProgressCount },
              { id: 'completed', label: 'Hoàn thành' },
              { id: 'cancelled', label: 'Đã hủy' },
            ].map((tab) => {
              const isActive = filterTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-label-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border border-surface-variant/30'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.color || 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Requests Cards List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-surface-variant/30 space-y-3">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mx-auto">
                <Icon name="inbox" size={32} />
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Không có yêu cầu nào trong mục này
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant max-w-sm mx-auto">
                Hệ thống sẽ tự động ghép nối và gửi thông báo khi khách hàng đăng công việc mới phù hợp với kỹ năng của bạn.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterTab('all')}
                className="mt-2 text-xs"
              >
                Xem tất cả yêu cầu
              </Button>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isNew = req.status === 'NEW'
              const isConfirmed = req.status === 'CONFIRMED'
              const isInProgress = req.status === 'IN_PROGRESS'
              const isCompleted = req.status === 'COMPLETED'
              const isCancelled = req.status === 'CANCELLED'

              return (
                <div
                  key={req.id}
                  className={`bg-surface-container-lowest rounded-3xl p-5 lg:p-6 shadow-sm border transition-all space-y-4 hover:shadow-md ${
                    isInProgress
                      ? 'border-l-4 border-l-primary border-surface-variant/30'
                      : 'border-surface-variant/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    {/* Job Icon */}
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                      <Icon name={req.icon || 'handyman'} size={24} />
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0 space-y-3 w-full">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              onClick={() => setSelectedTaskDetail(req)}
                              className="font-headline-sm text-base lg:text-lg font-bold text-on-surface tracking-tight hover:text-primary transition-colors cursor-pointer"
                            >
                              {req.title}
                            </h3>
                            <Badge variant="primary" size="sm">
                              {req.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-body-sm text-xs text-on-surface-variant">
                              Khách hàng:
                            </span>
                            <span className="font-label-md text-xs font-bold text-on-surface">
                              {req.clientName}
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-label-sm text-[11px] font-extrabold">
                              <Icon name="star" size={13} className="text-amber-600" />
                              {req.clientRating}
                            </span>
                          </div>
                        </div>

                        {/* Price Display */}
                        <div className="flex flex-col items-start md:items-end">
                          <span className="font-headline-md text-lg lg:text-xl font-extrabold text-primary tracking-tight">
                            {formatCurrency(req.price)}
                          </span>
                          <span className="font-caption text-xs text-on-surface-variant font-medium">
                            {req.priceNote}
                          </span>
                        </div>
                      </div>

                      {/* Specs Row */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 py-2.5 px-3.5 rounded-2xl bg-surface-container-low border border-surface-variant/20">
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                          <Icon name="calendar_today" size={16} className="text-primary" />
                          <span className="font-semibold text-on-surface">{req.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                          <Icon name="location_on" size={16} className="text-primary" />
                          <span className="font-semibold text-on-surface">{req.location}</span>
                          <span className="text-on-surface-variant/80 font-medium">({req.distance})</span>
                        </div>
                        {req.note && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Icon
                              name={req.noteWarning ? 'priority_high' : 'info'}
                              size={16}
                              className={req.noteWarning ? 'text-red-500' : 'text-primary'}
                            />
                            <span
                              className={`truncate max-w-md ${
                                req.noteWarning ? 'text-red-600 font-semibold' : 'text-on-surface-variant'
                              }`}
                            >
                              {req.note}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Row */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {isNew && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-pulse" />
                              Chờ xác nhận
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/60 text-primary font-label-sm text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              Đã xác nhận
                            </span>
                          )}
                          {isInProgress && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              Đang thực hiện
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-xs font-bold">
                              <Icon name="check_circle" size={14} />
                              Đã hoàn thành
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-label-sm text-xs font-bold">
                              <Icon name="cancel" size={14} />
                              Đã hủy
                            </span>
                          )}
                          <span className="font-caption text-xs text-on-surface-variant">
                            {req.statusNote}
                          </span>
                        </div>

                        {req.code && (
                          <span className="font-caption text-xs text-on-surface-variant font-medium">
                            Mã: <strong className="text-on-surface">{req.code}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-variant/20">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTaskDetail(req)}
                        className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        title="Xem ghi chú & vị trí chi tiết"
                      >
                        <Icon name="chat_bubble_outline" size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              req.addressDetail || req.location
                            )}`,
                            '_blank'
                          )
                        }
                        className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        title="Mở Google Maps chỉ đường"
                      >
                        <Icon name="map" size={18} />
                      </button>
                    </div>

                    {/* Contextual Action Buttons */}
                    <div className="flex items-center gap-2.5">
                      {isNew && (
                        <>
                          <Button
                            type="button"
                            variant="tonal"
                            size="sm"
                            onClick={() => handleDecline(req.id)}
                            className="rounded-xl text-xs font-bold text-on-surface hover:text-red-600"
                          >
                            Từ chối
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon="visibility"
                            onClick={() => setSelectedTaskDetail(req)}
                            className="rounded-xl text-xs font-bold border-surface-variant/40"
                          >
                            Chi tiết
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon="done_all"
                            onClick={() => handleAccept(req.id)}
                            className="rounded-xl text-xs font-extrabold px-5 shadow-sm"
                          >
                            Chấp nhận
                          </Button>
                        </>
                      )}

                      {isConfirmed && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon="chat"
                            onClick={() =>
                              alert(`Mở hộp thoại chat trực tuyến với khách hàng: ${req.clientName}`)
                            }
                            className="rounded-xl text-xs font-bold border-surface-variant/40"
                          >
                            Nhắn tin
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon="description"
                            onClick={() => setSelectedTaskDetail(req)}
                            className="rounded-xl text-xs font-bold border-surface-variant/40"
                          >
                            Chi tiết
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon="directions_run"
                            onClick={() => handleStartMoving(req.id)}
                            className="rounded-xl text-xs font-extrabold px-5 shadow-sm"
                          >
                            Bắt đầu di chuyển
                          </Button>
                        </>
                      )}

                      {isInProgress && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                'Đã gửi báo cáo sự cố kỹ thuật về tổng đài CSKH 24/7 để được hỗ trợ can thiệp!'
                              )
                            }
                            className="inline-flex items-center gap-1 text-red-600 font-label-sm text-xs font-bold hover:underline cursor-pointer px-2"
                          >
                            <Icon name="report_problem" size={16} />
                            <span>Báo sự cố phát sinh</span>
                          </button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon="chat"
                            onClick={() =>
                              alert(`Mở hộp thoại chat trực tuyến với khách hàng: ${req.clientName}`)
                            }
                            className="rounded-xl text-xs font-bold border-surface-variant/40"
                          >
                            Nhắn tin
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon="check_circle"
                            onClick={() => handleComplete(req.id)}
                            className="rounded-xl text-xs font-extrabold px-5 shadow-sm bg-primary"
                          >
                            Hoàn thành &amp; Nghiệm thu
                          </Button>
                        </>
                      )}

                      {isCompleted && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-primary font-bold flex items-center gap-1">
                            <Icon name="task_alt" size={16} />
                            Đã quyết toán tiền công
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTaskDetail(req)}
                            className="rounded-xl text-xs"
                          >
                            Xem hoá đơn
                          </Button>
                        </div>
                      )}

                      {isCancelled && (
                        <span className="text-xs text-on-surface-variant italic">
                          Đã đóng giao dịch
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Modal 1: Quick Calendar View Modal ("Xem chế độ Lịch") */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-3xl max-w-3xl w-full p-6 lg:p-8 shadow-2xl border border-surface-variant/30 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-on-primary">
                  <Icon name="calendar_month" size={22} />
                </div>
                <div>
                  <h3 className="font-headline-md text-lg font-extrabold text-on-surface">
                    Lịch làm việc tuần này (Tháng 10/2026)
                  </h3>
                  <p className="font-caption text-xs text-on-surface-variant">
                    Lịch trình công việc thực tế được đồng bộ tự động
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface cursor-pointer transition-colors"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Week Days Schedule Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { day: 'Thứ 2', date: '12/10', count: '1 việc', isToday: false },
                { day: 'Thứ 3', date: '13/10', count: '2 việc', isToday: false },
                { day: 'Thứ 4', date: '14/10', count: '1 việc', isToday: false },
                { day: 'Thứ 5', date: '15/10', count: '2 việc', isToday: true },
                { day: 'Thứ 6', date: '16/10', count: '1 việc', isToday: false },
                { day: 'Thứ 7', date: '17/10', count: '3 việc', isToday: false },
                { day: 'Chủ nhật', date: '18/10', count: 'Nghỉ', isToday: false },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    item.isToday
                      ? 'bg-primary-fixed/40 border-primary ring-1 ring-primary/40'
                      : 'bg-surface-container-low border-surface-variant/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-sm text-xs font-bold text-on-surface">
                      {item.day}
                    </span>
                    {item.isToday && (
                      <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary text-[10px] font-extrabold">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <p className="font-caption text-[11px] text-on-surface-variant mb-2">
                    {item.date}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                      item.count === 'Nghỉ'
                        ? 'bg-surface-container text-outline'
                        : 'bg-surface-container-lowest text-primary shadow-xs'
                    }`}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Scheduled Tasks Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="font-label-md text-xs font-extrabold uppercase tracking-wider text-outline">
                Lịch chi tiết các ca làm sắp tới:
              </h4>
              <div className="space-y-2">
                {requests
                  .filter((r) => r.status === 'CONFIRMED' || r.status === 'IN_PROGRESS')
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-variant/30 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon name={task.icon || 'schedule'} size={20} />
                        </div>
                        <div>
                          <p className="font-label-md text-sm font-bold text-on-surface">
                            {task.title}
                          </p>
                          <p className="font-caption text-xs text-on-surface-variant">
                            {task.time} • {task.location}
                          </p>
                        </div>
                      </div>
                      <Badge variant="primary" size="sm">
                        {task.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Đã cọc'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-3 border-t border-surface-variant/20">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCalendarModalOpen(false)}
                className="rounded-xl px-6"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Task Detail Popup */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-6 lg:p-8 shadow-2xl border border-surface-variant/30 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-variant/30">
              <div>
                <span className="font-label-sm text-xs font-bold text-primary uppercase tracking-wider">
                  Chi tiết đơn việc • {selectedTaskDetail.code}
                </span>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mt-0.5">
                  {selectedTaskDetail.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskDetail(null)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="bg-surface-container-low p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Khách hàng:</span>
                  <span className="font-bold text-on-surface">{selectedTaskDetail.clientName} ({selectedTaskDetail.clientPhone})</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Thù lao dịch vụ:</span>
                  <span className="font-extrabold text-primary text-base">{formatCurrency(selectedTaskDetail.price)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Lịch hẹn dự kiến:</span>
                  <span className="font-bold text-on-surface">{selectedTaskDetail.time}</span>
                </div>
                <div className="flex justify-between items-start text-xs pt-1 border-t border-surface-variant/20">
                  <span className="text-on-surface-variant font-medium shrink-0">Địa chỉ cụ thể:</span>
                  <span className="font-semibold text-right text-on-surface">{selectedTaskDetail.addressDetail || selectedTaskDetail.location}</span>
                </div>
              </div>

              {selectedTaskDetail.note && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 space-y-1">
                  <span className="font-label-sm text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Icon name="info" size={16} />
                    Ghi chú từ khách hàng:
                  </span>
                  <p className="font-body-sm text-xs text-amber-950 leading-relaxed">
                    {selectedTaskDetail.note}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-surface-variant/20">
              <Button
                variant="outline"
                size="sm"
                icon="phone"
                onClick={() => window.open(`tel:${selectedTaskDetail.clientPhone}`, '_self')}
                className="rounded-xl text-xs"
              >
                Gọi cho khách
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedTaskDetail(null)}
                className="rounded-xl px-5 text-xs font-bold"
              >
                Đóng chi tiết
              </Button>
            </div>
          </div>
        </div>
      )}
    </TaskerLayout>
  )
}