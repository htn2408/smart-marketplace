import { useState, useMemo } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Icon from '../components/common/Icon'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { formatCurrency } from '../utils/formatters'
import { ROUTES } from '../routes/paths'

/**
 * Danh sách công việc mẫu của khách hàng theo thiết kế chuẩn TaskMate
 */
const INITIAL_TASKS = [
  {
    id: 'TM-88219',
    code: '#TM-88219',
    title: 'Lắp ráp bàn làm việc chữ L & tủ sách IKEA',
    category: 'Lắp ráp đồ gỗ nội thất',
    icon: 'handyman',
    status: 'IN_PROGRESS', // IN_PROGRESS, PENDING, ACCEPTED, COMPLETED, CANCELLED
    statusBadge: {
      text: 'Đang thực hiện • Bắt đầu lúc 10:05',
      variant: 'primary',
      isLive: true,
    },
    tasker: {
      name: 'Đặng Hùng Dũng',
      avatar:
        'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
      rating: 4.7,
      completedJobs: 128,
      specialty: 'Thợ lắp ráp nội thất chuyên sâu • Đang có mặt tại nhà',
      phone: '0988 234 567',
      verified: true,
    },
    schedule: 'Hôm nay • Bắt đầu từ 10:00 (Dự kiến 2 giờ)',
    dateIso: '2026-10-15',
    location: 'P.1402 Tòa R2 Goldmark City, Bắc Từ Liêm, HN',
    progress: {
      percent: 65,
      detail: 'Đang tiến hành lắp ráp khung bàn và cố định bản lề',
    },
    price: 300000,
    priceLabel: 'Chi phí công:',
    escrowNote: 'Đã giữ trong Escrow',
  },
  {
    id: 'TM-88230',
    code: '#TM-88230',
    title: 'Lắp quạt trần Panasonic 5 cánh & móc treo gia cố',
    category: 'Điện lạnh & Thiết bị',
    icon: 'mode_fan',
    status: 'PENDING',
    statusBadge: {
      text: 'Chờ thợ phản hồi (còn 42 phút)',
      variant: 'secondary',
      icon: 'hourglass_top',
    },
    tasker: {
      name: 'Nguyễn Anh Tuấn',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 4.9,
      completedJobs: 240,
      specialty: 'Đã gửi lời mời trực tiếp • Chờ thợ xác nhận lịch',
      phone: '0912 345 889',
      verified: true,
    },
    schedule: 'Thứ 4, 14/10/2026 • 09:00 sáng',
    dateIso: '2026-10-14',
    location: 'Số 18 Ngõ 86 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, HN',
    price: 250000,
    priceLabel: 'Thù lao đề xuất:',
    escrowNote: 'Đã tạm giữ ký quỹ',
  },
  {
    id: 'TM-88195',
    code: '#TM-88195',
    title: 'Sửa bồn cầu rò rỉ nước & thay van cấp Inax',
    category: 'Sửa chữa điện nước',
    icon: 'plumbing',
    status: 'ACCEPTED',
    statusBadge: {
      text: 'Đã chốt lịch • Đúng hẹn 14:30 ngày mai',
      variant: 'primaryVariant',
      icon: 'check_circle',
    },
    tasker: {
      name: 'Trần Quang Huy',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 4.9,
      completedJobs: 315,
      specialty: 'Kỹ thuật viên điện nước cấp chứng chỉ • Đã ký cam kết dịch vụ',
      phone: '0982 667 889',
      verified: true,
    },
    schedule: 'Thứ 5, 15/10/2026 • 14:30 chiều',
    dateIso: '2026-10-15',
    location: 'Tòa S2.03 Vinhomes Smart City, Nam Từ Liêm, HN',
    price: 180000,
    priceLabel: 'Chi phí trọn gói:',
    warrantyNote: 'Bảo hành 30 ngày',
  },
  {
    id: 'TM-88241',
    code: '#TM-88241',
    title: 'Thay 3 ổ cắm điện âm tường chống giật Panasonic',
    category: 'Sửa điện gia dụng',
    icon: 'electric_bolt',
    status: 'PENDING',
    statusBadge: {
      text: 'Đã có 3 thợ quan tâm gửi báo giá',
      variant: 'secondary',
      icon: 'groups',
    },
    proposals: {
      count: 3,
      avatars: ['NV', 'LH', 'TM'],
      summary: '3 thợ điện lành nghề trong khu vực 3km',
      priceRange: '190.000₫ - 220.000₫',
    },
    schedule: 'Thứ 7, 17/10/2026 • 16:00 chiều',
    dateIso: '2026-10-17',
    location: 'Số 45 Trần Thái Tông, Cầu Giấy, HN',
    price: 200000,
    priceLabel: 'Ngân sách dự kiến:',
  },
  {
    id: 'TM-88012',
    code: '#TM-88012',
    title: 'Vệ sinh và bảo dưỡng 2 máy lạnh Daikin Inverter',
    category: 'Điện lạnh',
    icon: 'ac_unit',
    status: 'COMPLETED',
    statusBadge: {
      text: 'Đã hoàn thành • Nghiệm thu xong',
      variant: 'primaryVariant',
      icon: 'check_circle',
    },
    tasker: {
      name: 'Lê Hoàng Nam',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      rating: 5.0,
      completedJobs: 198,
      specialty: 'Kỹ sư nhiệt điện lạnh 8 năm kinh nghiệm',
      phone: '0977 123 456',
      verified: true,
    },
    schedule: '05/10/2026 • 10:00 sáng',
    dateIso: '2026-10-05',
    location: 'Tòa Landmark 72, Nam Từ Liêm, HN',
    price: 420000,
    priceLabel: 'Đã thanh toán:',
    escrowNote: 'Đã giải ngân cho thợ',
  },
  {
    id: 'TM-87950',
    code: '#TM-87950',
    title: 'Vận chuyển bộ bàn ăn gỗ sang căn hộ mới',
    category: 'Vận chuyển',
    icon: 'local_shipping',
    status: 'CANCELLED',
    statusBadge: {
      text: 'Đã hủy yêu cầu • Đã hoàn tiền 100%',
      variant: 'neutral',
      icon: 'cancel',
    },
    schedule: '01/10/2026 • 08:00 sáng',
    dateIso: '2026-10-01',
    location: 'Nguyễn Trãi, Thanh Xuân, HN',
    price: 350000,
    priceLabel: 'Ký quỹ đã hoàn:',
    escrowNote: 'Đã hoàn tiền về tài khoản',
  },
]

/**
 * Filter Tabs Definition
 */
const TABS = [
  { id: 'ALL', label: 'Tất cả', count: 6 },
  { id: 'PENDING', label: 'Chờ thợ nhận', count: 2 },
  { id: 'ACCEPTED', label: 'Đã nhận lịch', count: 2 },
  { id: 'IN_PROGRESS', label: 'Đang làm', count: 1, highlight: true },
  { id: 'COMPLETED', label: 'Đã hoàn thành', count: 8 },
  { id: 'CANCELLED', label: 'Đã hủy', count: 1 },
]

/**
 * TaskManager Component - Trang Quản lý công việc & Lịch hẹn của Khách hàng
 */
export default function TaskManager({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('ALL')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'calendar'
  const [searchQuery, setSearchQuery] = useState('')
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [activeModal, setActiveModal] = useState(null) // { type, task }
  const [toastMessage, setToastMessage] = useState('')

  // Show temporary feedback toast
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Filter tasks based on activeTab and searchQuery
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab matching
      if (activeTab !== 'ALL' && task.status !== activeTab) {
        return false
      }
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchCode = task.code.toLowerCase().includes(q)
        const matchTitle = task.title.toLowerCase().includes(q)
        const matchCategory = task.category.toLowerCase().includes(q)
        const matchTasker = task.tasker?.name?.toLowerCase().includes(q)
        if (!matchCode && !matchTitle && !matchCategory && !matchTasker) {
          return false
        }
      }
      return true
    })
  }, [tasks, activeTab, searchQuery])

  // Count metrics for top overview cards
  const metrics = useMemo(() => {
    const pendingCount = tasks.filter((t) => t.status === 'PENDING').length
    const acceptedCount = tasks.filter((t) => t.status === 'ACCEPTED').length
    const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length
    const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length
    return {
      pending: pendingCount || 2,
      accepted: acceptedCount || 3,
      inProgress: inProgressCount || 1,
      completed: completedCount || 8,
    }
  }, [tasks])

  // Action: release escrow & complete
  const handleReleaseEscrow = (taskId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'COMPLETED',
              statusBadge: {
                text: 'Đã nghiệm thu • Giải ngân thành công',
                variant: 'primaryVariant',
                icon: 'check_circle',
              },
            }
          : t
      )
    )
    setActiveModal(null)
    showToast('Đã xác nhận nghiệm thu và giải ngân tiền công cho thợ thành công!')
  }

  // Action: cancel task
  const handleCancelTask = (taskId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'CANCELLED',
              statusBadge: {
                text: 'Đã hủy yêu cầu',
                variant: 'neutral',
                icon: 'cancel',
              },
            }
          : t
      )
    )
    setActiveModal(null)
    showToast('Đã hủy yêu cầu dịch vụ. Tiền ký quỹ đã được hoàn về tài khoản.')
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* 
        Header cố định (Fixed Header):
        src/components/layout/Header.jsx đã có sẵn fixed top-0 w-full z-50 h-20.
        Để không bị che khuất nội dung bên dưới, <main> sử dụng pt-20.
      */}
      <Header activePath="my-tasks" onNavigate={onNavigate} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
          <Icon name="check_circle" size={20} />
          <span className="font-label-md text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="w-full pt-20 bg-surface flex-1 min-h-[calc(100vh-20rem)]">
        <div className="flex flex-col w-full">
          {/* Top Command & Metrics Overview Bar */}
          <section className="w-full bg-surface-container-low py-8 md:py-10 border-b border-surface-variant/30">
            <div className="max-w-[1240px] mx-auto px-6">
              {/* Breadcrumb & Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-caption text-caption text-on-surface-variant">
                    <button
                      type="button"
                      onClick={() => onNavigate?.('home')}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      Trang chủ
                    </button>
                    <Icon name="chevron_right" size={14} className="text-outline" />
                    <span className="text-primary font-medium">Quản lý việc của tôi</span>
                  </div>
                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                    Quản lý công việc &amp; Lịch hẹn
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
                    Theo dõi trạng thái phản hồi từ thợ chuyên nghiệp, kiểm soát tiến độ thi công và
                    bảo đảm thanh toán ký quỹ TaskMate Escrow an tâm 100%.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* View Toggle */}
                  <div className="inline-flex p-1 bg-surface-container rounded-lg">
                    <button
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-label-md text-label-md transition-all ${
                        viewMode === 'list'
                          ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                      title="Chế độ Danh sách"
                      type="button"
                      onClick={() => setViewMode('list')}
                    >
                      <Icon
                        name="format_list_bulleted"
                        size={18}
                        className={viewMode === 'list' ? 'text-primary' : ''}
                      />
                      <span>Danh sách</span>
                    </button>
                    <button
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-label-md text-label-md transition-all ${
                        viewMode === 'calendar'
                          ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                      title="Chế độ Lịch"
                      type="button"
                      onClick={() => setViewMode('calendar')}
                    >
                      <Icon
                        name="calendar_month"
                        size={18}
                        className={viewMode === 'calendar' ? 'text-primary' : ''}
                      />
                      <span>Lịch hẹn</span>
                    </button>
                  </div>

                  {/* Primary Post Action */}
                  <Button
                    variant="primary"
                    size="md"
                    icon="add_circle"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('task-detail')
                      } else {
                        window.location.href = ROUTES.TASK_DETAIL
                      }
                    }}
                    className="shadow-md font-bold rounded-lg"
                  >
                    + Đăng việc mới
                  </Button>
                </div>
              </div>

              {/* 4 High-Impact KPI Counter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Pending */}
                <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-4 border border-surface-variant/20 hover:border-secondary-fixed transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Chờ thợ phản hồi
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-secondary-fixed/50 text-on-secondary-fixed flex items-center justify-center">
                      <Icon name="hourglass_top" size={20} />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                        {String(metrics.pending).padStart(2, '0')}
                      </span>
                      <span className="font-caption text-caption text-secondary font-medium">
                        việc đang chờ
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-caption text-caption text-on-secondary-fixed-variant bg-secondary-fixed px-2 py-0.5 rounded-full font-semibold">
                      <Icon name="timer" size={13} />
                      <span>&lt; 45p</span>
                    </span>
                  </div>
                </div>

                {/* Metric 2: Upcoming */}
                <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-4 border border-surface-variant/20 hover:border-primary-fixed transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Lịch sắp tới
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-primary-fixed/50 text-on-primary-fixed flex items-center justify-center">
                      <Icon name="event_available" size={20} />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                        {String(metrics.accepted).padStart(2, '0')}
                      </span>
                      <span className="font-caption text-caption text-primary font-medium">
                        đã chốt thợ
                      </span>
                    </div>
                    <span className="font-caption text-caption text-on-surface-variant font-medium">
                      Tuần này
                    </span>
                  </div>
                </div>

                {/* Metric 3: In Progress */}
                <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-4 border border-surface-variant/20 hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Đang thực hiện
                    </span>
                    <div className="relative w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                      <Icon name="engineering" size={20} />
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl text-primary font-bold">
                        {String(metrics.inProgress).padStart(2, '0')}
                      </span>
                      <span className="font-caption text-caption text-primary font-medium">
                        thợ tại nhà
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-caption text-caption text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full font-bold">
                      Live
                    </span>
                  </div>
                </div>

                {/* Metric 4: Completed */}
                <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-4 border border-surface-variant/20 hover:border-surface-variant transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Đã hoàn thành
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-surface-container-high text-tertiary flex items-center justify-center">
                      <Icon name="check_circle" size={20} />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                        {String(metrics.completed).padStart(2, '0')}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant">
                        nghiệm thu xong
                      </span>
                    </div>
                    <span className="font-caption text-caption text-outline font-medium">
                      100% hài lòng
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content Body: Filter Bar + Tasks Grid (8 cols) & Escrow Sidebar (4 cols) */}
          <section className="w-full py-8">
            <div className="max-w-[1240px] mx-auto px-6">
              {/* Tabs Filter & Search Sub-bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-label-md text-label-md font-medium whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-primary text-on-primary shadow-sm font-semibold'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                        }`}
                      >
                        {tab.label}
                        <span
                          className={`ml-1 text-xs ${
                            isActive
                              ? 'opacity-90'
                              : tab.highlight
                                ? 'text-primary font-bold'
                                : 'opacity-70'
                          }`}
                        >
                          ({tab.count})
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Quick Search inside list */}
                <div className="relative w-full md:w-72">
                  <span className="absolute left-3 top-2.5 text-outline">
                    <Icon name="search" size={18} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo mã việc, tên thợ..."
                    className="w-full pl-9 pr-8 py-2 text-body-sm font-body-sm bg-surface-container-lowest rounded-lg border border-surface-variant/30 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* 12-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Column: Work Orders List or Calendar (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-5">
                  {viewMode === 'calendar' ? (
                    /* Calendar View Component */
                    <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-variant/30 space-y-4">
                      <div className="flex items-center justify-between border-b border-surface-variant/30 pb-4">
                        <div className="flex items-center gap-2">
                          <Icon name="calendar_month" size={22} className="text-primary" />
                          <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                            Lịch làm việc trong tháng 10/2026
                          </h3>
                        </div>
                        <Badge variant="primary">4 Lịch hẹn đã xếp</Badge>
                      </div>

                      <div className="space-y-3 pt-2">
                        {tasks
                          .filter((t) => t.status !== 'CANCELLED')
                          .map((t) => (
                            <div
                              key={t.id}
                              className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                  <Icon name={t.icon || 'assignment'} size={22} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-caption text-caption font-semibold text-outline">
                                      {t.code}
                                    </span>
                                    <span className="text-xs font-semibold text-primary">
                                      • {t.category}
                                    </span>
                                  </div>
                                  <h4 className="font-label-md text-sm font-bold text-on-surface mt-0.5">
                                    {t.title}
                                  </h4>
                                  <p className="font-caption text-caption text-on-surface-variant mt-1 flex items-center gap-1.5">
                                    <Icon name="schedule" size={14} className="text-primary" />
                                    <span>{t.schedule}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-surface-variant/30">
                                <span className="font-label-md text-sm font-bold text-primary">
                                  {formatCurrency(t.price)}
                                </span>
                                <Badge
                                  variant={
                                    t.status === 'IN_PROGRESS'
                                      ? 'primary'
                                      : t.status === 'ACCEPTED'
                                        ? 'primaryVariant'
                                        : 'secondary'
                                  }
                                  size="xs"
                                >
                                  {t.status === 'IN_PROGRESS'
                                    ? 'Đang làm'
                                    : t.status === 'ACCEPTED'
                                      ? 'Đã chốt lịch'
                                      : 'Chờ thợ'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    /* Work Orders List */
                    <>
                      {filteredTasks.length === 0 ? (
                        <div className="p-10 rounded-xl bg-surface-container-lowest text-center border border-surface-variant/30 space-y-3">
                          <div className="w-14 h-14 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center mx-auto">
                            <Icon name="search_off" size={28} />
                          </div>
                          <h4 className="font-label-lg font-bold text-on-surface">
                            Không tìm thấy công việc nào phù hợp
                          </h4>
                          <p className="font-body-sm text-on-surface-variant max-w-sm mx-auto">
                            Hãy thử đổi từ khóa tìm kiếm hoặc bấm tab "Tất cả" để xem danh sách đầy
                            đủ.
                          </p>
                          <Button
                            variant="tonal"
                            size="sm"
                            onClick={() => {
                              setActiveTab('ALL')
                              setSearchQuery('')
                            }}
                          >
                            Xóa bộ lọc
                          </Button>
                        </div>
                      ) : (
                        filteredTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-6 rounded-xl bg-surface-container-lowest border transition-all ${
                              task.status === 'IN_PROGRESS'
                                ? 'shadow-md border-primary/30 hover:shadow-lg'
                                : 'shadow-sm border-surface-variant/20 hover:shadow-md'
                            }`}
                          >
                            <div className="flex flex-col gap-4">
                              {/* Header & Badges */}
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                      task.status === 'IN_PROGRESS'
                                        ? 'bg-primary-fixed/40 text-primary'
                                        : task.status === 'PENDING'
                                          ? 'bg-secondary-fixed/40 text-on-secondary-fixed'
                                          : 'bg-primary-fixed/30 text-primary'
                                    }`}
                                  >
                                    <Icon name={task.icon || 'assignment'} size={28} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-caption text-caption font-semibold text-outline uppercase tracking-wider">
                                        {task.code}
                                      </span>
                                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                                      <span className="font-caption text-caption text-on-surface-variant">
                                        {task.category}
                                      </span>
                                    </div>
                                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5">
                                      {task.title}
                                    </h3>
                                  </div>
                                </div>

                                {/* Status Badge */}
                                {task.statusBadge?.isLive ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    <span>{task.statusBadge.text}</span>
                                  </div>
                                ) : (
                                  <Badge
                                    variant={task.statusBadge?.variant || 'secondary'}
                                    icon={task.statusBadge?.icon}
                                    size="sm"
                                  >
                                    {task.statusBadge?.text}
                                  </Badge>
                                )}
                              </div>

                              {/* Tasker Mini Profile Banner or Proposals Stack */}
                              {task.tasker ? (
                                <div className="p-4 rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <img
                                        src={task.tasker.avatar}
                                        alt={task.tasker.name}
                                        className="w-11 h-11 rounded-full object-cover shadow-sm ring-1 ring-surface-variant/40"
                                      />
                                      {task.tasker.verified && (
                                        <span className="material-symbols-outlined absolute -bottom-1 -right-1 text-[16px] text-primary bg-surface-container-lowest rounded-full">
                                          verified
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-label-md text-label-md font-bold text-on-surface">
                                          {task.tasker.name}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-caption text-caption font-semibold flex items-center gap-1">
                                          <Icon
                                            name="star"
                                            size={12}
                                            filled
                                            className="text-secondary"
                                          />
                                          {task.tasker.rating} ({task.tasker.completedJobs} việc)
                                        </span>
                                      </div>
                                      <span className="font-caption text-caption text-on-surface-variant">
                                        {task.tasker.specialty}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {task.tasker.phone && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          showToast(`Đang liên hệ: ${task.tasker.phone}`)
                                        }
                                        className="p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface transition-colors"
                                        title={`Gọi: ${task.tasker.phone}`}
                                      >
                                        <Icon name="call" size={18} className="text-primary" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        showToast(`Mở hộp thoại chat với ${task.tasker.name}`)
                                      }
                                      className="p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface transition-colors"
                                      title="Nhắn tin"
                                    >
                                      <Icon name="chat" size={18} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onNavigate) {
                                          onNavigate('tasker-profile', {
                                            taskerId: task.tasker.name,
                                          })
                                        }
                                      }}
                                      className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-0.5 ml-1"
                                    >
                                      <span>Xem hồ sơ</span>
                                      <Icon name="arrow_forward" size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : task.proposals ? (
                                <div className="p-4 rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    {/* Avatar overlap stack */}
                                    <div className="flex -space-x-2 overflow-hidden">
                                      <div className="inline-block h-8 w-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-[12px] font-bold">
                                        NV
                                      </div>
                                      <div className="inline-block h-8 w-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-[12px] font-bold">
                                        LH
                                      </div>
                                      <div className="inline-block h-8 w-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-[12px] font-bold">
                                        TM
                                      </div>
                                    </div>
                                    <div>
                                      <span className="font-label-md text-label-md font-bold text-on-surface">
                                        {task.proposals.summary}
                                      </span>
                                      <p className="font-caption text-caption text-on-surface-variant">
                                        Mức giá đề xuất từ {task.proposals.priceRange}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setActiveModal({ type: 'proposals', task })}
                                  >
                                    Xem {task.proposals.count} hồ sơ &amp; Chọn thợ
                                  </Button>
                                </div>
                              ) : null}

                              {/* Meta Specs: Schedule & Location */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm font-body-sm text-on-surface-variant py-1">
                                <div className="flex items-center gap-2">
                                  <Icon name="schedule" size={18} className="text-primary shrink-0" />
                                  <span className="truncate">{task.schedule}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Icon name="location_on" size={18} className="text-primary shrink-0" />
                                  <span className="truncate">{task.location}</span>
                                </div>
                              </div>

                              {/* Live Work Tracker Visual (if progress available) */}
                              {task.progress && (
                                <div className="w-full bg-surface-container rounded-lg p-3 flex flex-col gap-2">
                                  <div className="flex items-center justify-between text-caption font-caption">
                                    <span className="text-primary font-bold flex items-center gap-1">
                                      <Icon name="play_circle" size={15} />
                                      {task.progress.detail}
                                    </span>
                                    <span className="text-on-surface-variant font-medium">
                                      Tiến độ ~{task.progress.percent}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-primary h-full rounded-full transition-all duration-500"
                                      style={{ width: `${task.progress.percent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {/* Action Bar & Escrow Notice */}
                              <div className="pt-3 border-t border-surface-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="font-caption text-caption text-on-surface-variant">
                                    {task.priceLabel}
                                  </span>
                                  <span className="font-headline-sm text-headline-sm font-bold text-primary">
                                    {formatCurrency(task.price)}
                                  </span>
                                  {task.escrowNote && (
                                    <span className="font-caption text-caption text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                      <Icon name="lock" size={13} className="text-primary" />
                                      {task.escrowNote}
                                    </span>
                                  )}
                                  {task.warrantyNote && (
                                    <span className="font-caption text-caption text-primary font-medium flex items-center gap-1">
                                      <Icon name="shield" size={13} />
                                      {task.warrantyNote}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  {task.status === 'IN_PROGRESS' && (
                                    <>
                                      <Button
                                        variant="tonal"
                                        size="sm"
                                        onClick={() => setActiveModal({ type: 'report', task })}
                                        className="hover:text-error hover:bg-error-container/40"
                                      >
                                        Báo cáo sự cố
                                      </Button>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        icon="verified"
                                        onClick={() => setActiveModal({ type: 'escrow', task })}
                                        className="shadow-sm"
                                      >
                                        Nghiệm thu &amp; Giải ngân
                                      </Button>
                                    </>
                                  )}

                                  {task.status === 'PENDING' && (
                                    <>
                                      <Button
                                        variant="tonal"
                                        size="sm"
                                        onClick={() => setActiveModal({ type: 'cancel', task })}
                                        className="hover:text-error"
                                      >
                                        Hủy yêu cầu
                                      </Button>
                                      {task.proposals ? (
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          icon="compare_arrows"
                                          onClick={() =>
                                            setActiveModal({ type: 'proposals', task })
                                          }
                                        >
                                          So sánh báo giá
                                        </Button>
                                      ) : (
                                        <>
                                          <Button
                                            variant="tonal"
                                            size="sm"
                                            icon="person_search"
                                            onClick={() => {
                                              if (onNavigate) {
                                                onNavigate('search')
                                              }
                                            }}
                                          >
                                            Mời thợ khác
                                          </Button>
                                          <Button
                                            variant="primary"
                                            size="sm"
                                            icon="chat"
                                            onClick={() =>
                                              showToast(`Đã gửi tin nhắn cho ${task.tasker?.name}`)
                                            }
                                          >
                                            Nhắn tin cho thợ
                                          </Button>
                                        </>
                                      )}
                                    </>
                                  )}

                                  {task.status === 'ACCEPTED' && (
                                    <>
                                      <Button
                                        variant="tonal"
                                        size="sm"
                                        onClick={() =>
                                          showToast(
                                            'Vui lòng trao đổi với thợ qua tin nhắn để thống nhất thời gian mới.'
                                          )
                                        }
                                      >
                                        Dời lịch hẹn
                                      </Button>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                          if (onNavigate) {
                                            onNavigate('task-detail', { taskId: task.id })
                                          }
                                        }}
                                      >
                                        Xem chi tiết công việc
                                      </Button>
                                    </>
                                  )}

                                  {task.status === 'COMPLETED' && (
                                    <Button
                                      variant="tonal"
                                      size="sm"
                                      icon="star"
                                      onClick={() =>
                                        showToast('Cảm ơn bạn đã đánh giá dịch vụ!')
                                      }
                                    >
                                      Xem lại đánh giá
                                    </Button>
                                  )}

                                  {task.status === 'CANCELLED' && (
                                    <Button
                                      variant="tonal"
                                      size="sm"
                                      icon="refresh"
                                      onClick={() => {
                                        if (onNavigate) onNavigate('task-detail')
                                      }}
                                    >
                                      Đăng lại yêu cầu
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>

                {/* Right Side: Trust, Escrow & Emergency Support Sidebar (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Card 1: TaskMate Escrow Guarantee */}
                  <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-variant/30 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0">
                        <Icon name="verified_user" size={24} />
                      </div>
                      <div>
                        <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                          Bảo vệ Ký quỹ Escrow
                        </h3>
                        <p className="font-caption text-caption text-primary font-medium">
                          100% An toàn tài chính
                        </p>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Toàn bộ tiền công của bạn được hệ thống{' '}
                      <span className="font-semibold text-on-surface">tạm giữ an toàn</span> trong
                      tài khoản Escrow. Thợ chỉ nhận thanh toán khi bạn đã kiểm tra chất lượng và
                      bấm nút{' '}
                      <span className="font-semibold text-primary">"Nghiệm thu &amp; Giải ngân"</span>.
                    </p>

                    {/* 3 Simple Visual Steps */}
                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed text-caption font-bold flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Đặt lịch &amp; ký quỹ số tiền đã chốt.
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed text-caption font-bold flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Thợ đến nhà thực hiện dịch vụ chuẩn tay nghề.
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed text-caption font-bold flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Nghiệm thu hài lòng, giải ngân và đánh giá sao.
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 p-3 rounded-lg bg-surface-container flex items-center gap-2">
                      <Icon name="verified" size={18} className="text-primary shrink-0" />
                      <span className="font-caption text-caption text-on-surface font-medium">
                        Bảo hành 30 ngày cho mọi lỗi kỹ thuật
                      </span>
                    </div>
                  </div>

                  {/* Card 2: 24/7 Dedicated Support & Emergency Assistance */}
                  <div className="p-6 rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 text-on-secondary-fixed flex items-center justify-center shrink-0">
                        <Icon name="support_agent" size={24} />
                      </div>
                      <div>
                        <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                          Trung tâm hỗ trợ 24/7
                        </h3>
                        <span className="font-caption text-caption text-on-surface-variant">
                          Có mặt xử lý tranh chấp tức thì
                        </span>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Nếu phát sinh hư hại đồ đạc, phát hiện thợ trễ hẹn hoặc yêu cầu phụ phí không
                      hợp lý, hãy bấm hỗ trợ để nhân viên can thiệp trong vòng 5 phút.
                    </p>

                    <div className="flex flex-col gap-2 pt-1">
                      <a
                        href="tel:19006868"
                        className="w-full py-2.5 px-4 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors border border-surface-variant/30"
                      >
                        <Icon name="headset_mic" size={20} className="text-secondary" />
                        <span>Hotline: 1900 6868 (Miễn phí)</span>
                      </a>
                      <Button
                        variant="tonal"
                        fullWidth
                        size="md"
                        onClick={() =>
                          showToast('Yêu cầu bảo hiểm của bạn đã được gửi tới ban hỗ trợ.')
                        }
                      >
                        Gửi yêu cầu bồi thường bảo hiểm
                      </Button>
                    </div>
                  </div>

                  {/* Card 3: Quick Tips for Customer */}
                  <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-variant/30 flex flex-col gap-3">
                    <span className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-2">
                      <Icon name="lightbulb" size={18} className="text-primary" />
                      Mẹo hay cho gia chủ
                    </span>
                    <ul className="flex flex-col gap-2 font-caption text-caption text-on-surface-variant">
                      <li className="flex items-start gap-2">
                        <Icon name="check" size={14} className="text-outline mt-0.5 shrink-0" />
                        <span>Chụp hình hoặc quay video lại hiện trạng trước khi thợ bắt đầu lắp đặt.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="check" size={14} className="text-outline mt-0.5 shrink-0" />
                        <span>
                          Tuyệt đối không thanh toán tiền mặt trực tiếp ngoài ứng dụng TaskMate để giữ
                          quyền bảo hiểm.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={onNavigate} />

      {/* MODAL: Giải ngân ký quỹ */}
      {activeModal?.type === 'escrow' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-variant/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="verified" size={28} />
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  Nghiệm thu &amp; Giải ngân
                </h3>
                <p className="font-caption text-caption text-on-surface-variant">
                  Công việc: {activeModal.task?.code}
                </p>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Bạn có chắc chắn đã kiểm tra kết quả thi công và hài lòng với chất lượng? Số tiền{' '}
              <strong className="text-primary font-bold">
                {formatCurrency(activeModal.task?.price)}
              </strong>{' '}
              sẽ được chuyển từ quỹ Escrow sang ví của thợ{' '}
              <strong>{activeModal.task?.tasker?.name}</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="tonal" size="md" onClick={() => setActiveModal(null)}>
                Xem lại
              </Button>
              <Button
                variant="primary"
                size="md"
                icon="check"
                onClick={() => handleReleaseEscrow(activeModal.task?.id)}
              >
                Xác nhận giải ngân
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Báo cáo sự cố */}
      {activeModal?.type === 'report' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-variant/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center">
                <Icon name="report_problem" size={28} />
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  Báo cáo sự cố khẩn cấp
                </h3>
                <p className="font-caption text-caption text-on-surface-variant">
                  Hỗ trợ TaskMate 24/7 can thiệp
                </p>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Nhân viên giám sát chất lượng TaskMate sẽ tạm giữ phong tỏa khoản tiền Escrow và liên
              hệ với bạn trong vòng 5 phút để xử lý.
            </p>

            <div className="space-y-2">
              <label className="font-label-md text-xs font-semibold text-on-surface">
                Mô tả sơ lược sự cố:
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Thợ làm vỡ phụ kiện, không đúng vật tư cam kết..."
                className="w-full p-3 text-body-sm rounded-lg border border-surface-variant/40 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="tonal" size="md" onClick={() => setActiveModal(null)}>
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="md"
                className="bg-error text-on-error hover:bg-error/90"
                onClick={() => {
                  setActiveModal(null)
                  showToast('Đã gửi báo cáo sự cố. Tổng đài TaskMate đang kết nối với bạn.')
                }}
              >
                Gửi báo cáo ngay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Hủy yêu cầu */}
      {activeModal?.type === 'cancel' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-variant/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <Icon name="warning" size={28} />
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  Xác nhận hủy yêu cầu
                </h3>
                <p className="font-caption text-caption text-on-surface-variant">
                  Công việc: {activeModal.task?.code}
                </p>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Bạn có chắc chắn muốn hủy yêu cầu dịch vụ này? Toàn bộ số tiền tạm giữ ký quỹ{' '}
              <strong className="text-on-surface">
                {formatCurrency(activeModal.task?.price)}
              </strong>{' '}
              sẽ được hoàn trả ngay 100% vào tài khoản của bạn.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="tonal" size="md" onClick={() => setActiveModal(null)}>
                Không, giữ lại
              </Button>
              <Button
                variant="tonal"
                size="md"
                className="text-error hover:bg-error/10 font-bold"
                onClick={() => handleCancelTask(activeModal.task?.id)}
              >
                Đồng ý hủy việc
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: So sánh 3 báo giá */}
      {activeModal?.type === 'proposals' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-variant/30 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="groups" size={24} className="text-primary" />
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  So sánh 3 báo giá từ thợ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-outline hover:text-on-surface p-1 rounded-full"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <p className="font-body-sm text-on-surface-variant text-sm">
              Chọn người thợ phù hợp nhất với yêu cầu của bạn để tiến hành chốt lịch.
            </p>

            <div className="space-y-3">
              {[
                {
                  name: 'Nguyễn Văn Nam',
                  rating: 4.8,
                  jobs: 142,
                  price: 190000,
                  distance: '1.2 km',
                  note: 'Có sẵn đồ nghề & thang nhôm, tới ngay sau 30 phút',
                },
                {
                  name: 'Lê Hoàng Hải',
                  rating: 4.9,
                  jobs: 210,
                  price: 200000,
                  distance: '2.1 km',
                  note: 'Thợ điện bậc 4/7, chuyên thiết bị gia dụng âm tường',
                  recommended: true,
                },
                {
                  name: 'Trần Mạnh Tuấn',
                  rating: 4.7,
                  jobs: 88,
                  price: 220000,
                  distance: '2.8 km',
                  note: 'Bảo hành công lắp đặt 60 ngày',
                },
              ].map((worker, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-all ${
                    worker.recommended
                      ? 'border-primary/50 bg-primary-fixed/10'
                      : 'border-surface-variant/30 bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md font-bold text-on-surface">
                          {worker.name}
                        </span>
                        {worker.recommended && (
                          <Badge variant="primary" size="xs">
                            Được đề xuất
                          </Badge>
                        )}
                      </div>
                      <span className="font-caption text-caption text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Icon name="star" size={12} filled className="text-secondary" />
                        {worker.rating} ({worker.jobs} việc) • Cách {worker.distance}
                      </span>
                    </div>
                    <span className="font-headline-sm text-sm font-bold text-primary">
                      {formatCurrency(worker.price)}
                    </span>
                  </div>

                  <p className="font-caption text-caption text-on-surface-variant bg-surface-container-lowest/80 p-2 rounded-lg">
                    {worker.note}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setActiveModal(null)
                        showToast(`Bạn đã chọn thợ ${worker.name}. Đã cập nhật vào lịch hẹn!`)
                      }}
                    >
                      Chọn thợ này
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
