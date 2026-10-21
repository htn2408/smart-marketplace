import { useState, useMemo, useEffect, useCallback } from 'react'
import TaskerLayout from '../../components/layout/TaskerLayout'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { formatCurrency, formatDateTime, formatHourSlot, getCategoryIcon } from '../../utils/formatters'
import {
  fetchTaskerTasks,
  acceptTaskApi,
  declineTaskApi,
  startTaskApi,
  completeTaskApi,
} from '../../services/taskService'

/**
 * Tính toán danh sách 7 ngày trong tuần hiện tại và đếm số việc thực tế
 */
function getCurrentWeekDays(tasks = []) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Khoảng cách từ Thứ 2 (Chủ nhật = 0 thì distance = -6)
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + distanceToMonday)
  monday.setHours(0, 0, 0, 0)

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

  return dayNames.map((dayName, idx) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + idx)

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()

    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

    // Đếm số công việc thực tế trong ngày
    const count = tasks.filter((t) => {
      if (!t.scheduledStartTime) return false
      const tDate = new Date(t.scheduledStartTime)
      return (
        tDate.getDate() === d.getDate() &&
        tDate.getMonth() === d.getMonth() &&
        tDate.getFullYear() === d.getFullYear() &&
        (t.status === 'MATCHED' || t.status === 'IN_PROGRESS' || t.status === 'AWAITING_APPROVAL')
      )
    }).length

    return {
      day: dayName,
      date: dateStr,
      count: count > 0 ? `${count} việc` : 'Nghỉ',
      isToday,
    }
  })
}

/**
 * RequireAndCalendar Component - Trang Quản lý Yêu cầu & Lịch hẹn của Tasker
 * Tích hợp 100% Backend API ASP.NET Core (.NET 10 port 5236)
 * Tuân thủ chuẩn rule.md: Không mock data, dùng shared components và service layer
 */
export default function RequireAndCalendar({ onNavigate }) {
  const [data, setData] = useState({
    stats: {
      pendingCount: 0,
      matchedCount: 0,
      inProgressCount: 0,
      awaitingApprovalCount: 0,
      doneCount: 0,
      cancelledCount: 0,
    },
    tasks: [],
  })

  // all, pending, matched, in_progress, awaiting_approval, done, cancelled
  const [filterTab, setFilterTab] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  // Hiển thị toast thông báo nhanh
  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Làm mới dữ liệu từ server
  const handleRefresh = useCallback(() => {
    setIsLoading(true)
    setErrorMessage(null)
    setRefreshToken((t) => t + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchTaskerTasks(filterTab, { signal: controller.signal })
      .then((res) => {
        setData(res)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setErrorMessage(err.message || 'Không thể tải danh sách yêu cầu công việc.')
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [filterTab, refreshToken])

  // Thao tác: Chấp nhận việc (PENDING -> MATCHED)
  const handleAccept = async (taskId) => {
    try {
      setActionLoadingId(taskId)
      const res = await acceptTaskApi(taskId)
      showToast(res.message || 'Đã nhận việc thành công!')
      handleRefresh()
    } catch (err) {
      showToast(err.message || 'Không thể nhận việc.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Thao tác: Từ chối việc (PENDING/MATCHED -> Hoàn tiền & quay về PENDING)
  const handleDecline = async (taskId) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn từ chối công việc này? Tiền cọc Escrow sẽ được hoàn trả lại cho khách hàng.'
      )
    ) {
      return
    }

    try {
      setActionLoadingId(taskId)
      const res = await declineTaskApi(taskId)
      showToast(res.message || 'Đã từ chối công việc.')
      handleRefresh()
    } catch (err) {
      showToast(err.message || 'Không thể từ chối công việc.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Thao tác: Bắt đầu làm / di chuyển (MATCHED -> IN_PROGRESS)
  const handleStartMoving = async (taskId) => {
    try {
      setActionLoadingId(taskId)
      const res = await startTaskApi(taskId)
      showToast(res.message || 'Đã bắt đầu công việc!')
      handleRefresh()
    } catch (err) {
      showToast(err.message || 'Không thể bắt đầu công việc.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Thao tác: Thợ báo hoàn thành (IN_PROGRESS -> AWAITING_APPROVAL)
  const handleComplete = async (taskId) => {
    try {
      setActionLoadingId(taskId)
      const res = await completeTaskApi(taskId)
      showToast(res.message || 'Đã báo hoàn thành công việc, đang chờ khách hàng duyệt và giải ngân!')
      handleRefresh()
    } catch (err) {
      showToast(err.message || 'Không thể hoàn thành công việc.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // 7 ngày trong tuần được tính động từ tasks thật
  const weekDays = useMemo(() => getCurrentWeekDays(data.tasks), [data.tasks])

  // Các ca làm sắp tới cho modal lịch
  const upcomingScheduleTasks = useMemo(() => {
    return data.tasks.filter(
      (t) => t.status === 'MATCHED' || t.status === 'IN_PROGRESS' || t.status === 'AWAITING_APPROVAL'
    )
  }, [data.tasks])

  // Danh sách các tab lọc
  const filterTabs = [
    {
      id: 'all',
      label: 'Tất cả',
      count:
        data.stats.pendingCount +
        data.stats.matchedCount +
        data.stats.inProgressCount +
        data.stats.awaitingApprovalCount +
        data.stats.doneCount +
        data.stats.cancelledCount,
    },
    {
      id: 'pending',
      label: 'Yêu cầu mới',
      count: data.stats.pendingCount,
      color: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'matched',
      label: 'Đã xác nhận',
      count: data.stats.matchedCount,
      color: 'bg-primary-fixed text-primary',
    },
    {
      id: 'in_progress',
      label: 'Đang thực hiện',
      count: data.stats.inProgressCount,
      color: 'bg-surface-container-high text-on-surface',
    },
    {
      id: 'awaiting_approval',
      label: 'Chờ khách duyệt',
      count: data.stats.awaitingApprovalCount,
      color: 'bg-blue-100 text-blue-900',
    },
    {
      id: 'done',
      label: 'Hoàn thành',
      count: data.stats.doneCount,
    },
    {
      id: 'cancelled',
      label: 'Đã hủy',
      count: data.stats.cancelledCount,
    },
  ]

  return (
    <TaskerLayout activeMenu="requests" onNavigate={onNavigate} title="Yêu cầu & Lịch hẹn">
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
              Khu vực hoạt động đăng ký • TaskMate Network
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
            Yêu cầu &amp; Lịch hẹn
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant">
            Quản lý yêu cầu trực tiếp từ khách hàng, điều phối lịch hẹn và theo dõi tiến độ nghiệm thu giải ngân.
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
            icon="refresh"
            onClick={handleRefresh}
            className="rounded-2xl px-3.5 shadow-sm"
            title="Làm mới dữ liệu từ máy chủ"
          />
        </div>
      </section>

      {/* 4 Bento Metrics Cards (Dữ liệu từ API Backend) */}
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
                {String(data.stats.pendingCount).padStart(2, '0')}
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
                {String(data.stats.matchedCount).padStart(2, '0')}
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

        {/* Metric 3: Đang thực hiện & Chờ duyệt */}
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
                {String(data.stats.inProgressCount + data.stats.awaitingApprovalCount).padStart(2, '0')}
              </span>
              <span className="font-label-sm text-xs font-semibold text-on-surface-variant">
                đơn việc
              </span>
            </div>
            <p className="font-caption text-xs text-on-surface-variant font-medium mt-2 flex items-center gap-1">
              <Icon name="timer" size={15} className="text-primary" />
              <span>
                {data.stats.awaitingApprovalCount > 0
                  ? `${data.stats.awaitingApprovalCount} đơn đang chờ khách duyệt`
                  : 'Tiến độ đang được cập nhật'}
              </span>
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
                {String(data.stats.doneCount).padStart(2, '0')}
              </span>
              <span className="font-label-sm text-xs font-bold text-primary">
                Đã giải ngân
              </span>
            </div>
            <p className="font-caption text-xs text-on-surface-variant font-medium mt-2 flex items-center gap-1">
              <Icon name="thumb_up" size={15} className="text-primary" />
              <span>Được bảo vệ bởi Escrow</span>
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
              Được đồng bộ trực tiếp từ cơ sở dữ liệu hệ thống TaskMate
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {filterTabs.map((tab) => {
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

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="error" size={18} />
              <span>{errorMessage}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs">
              Thử lại
            </Button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-body-sm text-xs text-on-surface-variant">
              Đang tải danh sách yêu cầu...
            </p>
          </div>
        )}

        {/* Requests Cards List */}
        {!isLoading && (
          <div className="space-y-4">
            {data.tasks.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-surface-variant/30 space-y-3">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mx-auto">
                  <Icon name="inbox" size={32} />
                </div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Không có yêu cầu nào trong mục này
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant max-w-sm mx-auto">
                  Khi khách hàng chọn bạn làm thợ hoặc gửi đề xuất công việc mới, yêu cầu sẽ lập tức hiển thị tại đây.
                </p>
                {filterTab !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterTab('all')}
                    className="mt-2 text-xs"
                  >
                    Xem tất cả yêu cầu
                  </Button>
                )}
              </div>
            ) : (
              data.tasks.map((task) => {
                const isPending = task.status === 'PENDING'
                const isMatched = task.status === 'MATCHED'
                const isInProgress = task.status === 'IN_PROGRESS'
                const isAwaitingApproval = task.status === 'AWAITING_APPROVAL'
                const isDone = task.status === 'DONE'
                const isCancelled = task.status === 'CANCELLED'

                const code = `#TM-${task.id.slice(0, 8).toUpperCase()}`
                const icon = getCategoryIcon(task.category || task.skillName)
                const locationStr = `${task.district}, ${task.city}`
                const timeStr = formatDateTime(task.scheduledStartTime)
                const hourSlotStr = formatHourSlot(task.scheduledStartTime, task.expectedTime)
                const isActionBusy = actionLoadingId === task.id

                return (
                  <div
                    key={task.id}
                    className={`bg-surface-container-lowest rounded-3xl p-5 lg:p-6 shadow-sm border transition-all space-y-4 hover:shadow-md ${
                      isInProgress
                        ? 'border-l-4 border-l-primary border-surface-variant/30'
                        : isAwaitingApproval
                          ? 'border-l-4 border-l-blue-500 border-surface-variant/30'
                          : 'border-surface-variant/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      {/* Job Icon */}
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                        <Icon name={icon} size={24} />
                      </div>

                      {/* Job Details */}
                      <div className="flex-1 min-w-0 space-y-3 w-full">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                onClick={() => setSelectedTaskDetail(task)}
                                className="font-headline-sm text-base lg:text-lg font-bold text-on-surface tracking-tight hover:text-primary transition-colors cursor-pointer"
                              >
                                {task.title}
                              </h3>
                              <Badge variant="primary" size="sm">
                                {task.category}
                              </Badge>
                              {task.skillName && (
                                <span className="font-caption text-xs px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium">
                                  {task.skillName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-body-sm text-xs text-on-surface-variant">
                                Khách hàng:
                              </span>
                              <span className="font-label-md text-xs font-bold text-on-surface">
                                {task.client?.name || 'Khách hàng ẩn danh'}
                              </span>
                              {task.client?.phoneNumber && (
                                <span className="font-caption text-xs text-primary font-semibold">
                                  • {task.client.phoneNumber}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price Display */}
                          <div className="flex flex-col items-start md:items-end">
                            <span className="font-headline-md text-lg lg:text-xl font-extrabold text-primary tracking-tight">
                              {formatCurrency(task.offeredPrice)}
                            </span>
                            <span className="font-caption text-xs text-on-surface-variant font-medium">
                              {isPending
                                ? 'Đề xuất trọn gói'
                                : 'Đã cọc Escrow an toàn'}
                            </span>
                          </div>
                        </div>

                        {/* Specs Row */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 py-2.5 px-3.5 rounded-2xl bg-surface-container-low border border-surface-variant/20">
                          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                            <Icon name="calendar_today" size={16} className="text-primary" />
                            <span className="font-semibold text-on-surface">
                              {timeStr}
                              {hourSlotStr ? ` (${hourSlotStr})` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                            <Icon name="schedule" size={16} className="text-primary" />
                            <span className="font-semibold text-on-surface">
                              {task.expectedTime} phút dự kiến
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                            <Icon name="location_on" size={16} className="text-primary" />
                            <span className="font-semibold text-on-surface">{locationStr}</span>
                          </div>
                          {task.description && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Icon name="info" size={16} className="text-primary shrink-0" />
                              <span className="truncate max-w-md text-on-surface-variant">
                                {task.description}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Row */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-pulse" />
                                Chờ xác nhận
                              </span>
                            )}
                            {isMatched && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/60 text-primary font-label-sm text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Đã xác nhận &amp; Cọc
                              </span>
                            )}
                            {isInProgress && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-xs font-bold">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                Đang thực hiện
                              </span>
                            )}
                            {isAwaitingApproval && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-label-sm text-xs font-bold">
                                <Icon name="hourglass_top" size={14} />
                                Chờ khách duyệt nghiệm thu
                              </span>
                            )}
                            {isDone && (
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
                              {isPending && 'Khách hàng gửi yêu cầu trực tiếp, vui lòng phản hồi sớm.'}
                              {isMatched && 'Đã khóa lịch hẹn. Khách đã cọc tiền qua TaskMate.'}
                              {isInProgress && 'Bạn đang làm việc. Bấm hoàn thành khi xong việc.'}
                              {isAwaitingApproval && 'Đã gửi yêu cầu nghiệm thu, tiền sẽ vào ví khi khách xác nhận.'}
                              {isDone && 'Đã quyết toán tiền công vào ví tài khoản.'}
                              {isCancelled && 'Đơn yêu cầu đã hủy.'}
                            </span>
                          </div>

                          <span className="font-caption text-xs text-on-surface-variant font-medium">
                            Mã: <strong className="text-on-surface">{code}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-variant/20">
                      <div className="flex items-center gap-2">
                        {task.client?.id && (
                          <Button
                            type="button"
                            variant="tonal"
                            size="sm"
                            icon="chat"
                            onClick={() =>
                              onNavigate?.('messages', {
                                targetUserId: task.client.id,
                                targetName: task.client.name,
                              })
                            }
                            className="rounded-xl text-xs font-bold text-primary hover:bg-primary-fixed/40"
                          >
                            Nhắn tin
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedTaskDetail(task)}
                          className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Xem ghi chú & vị trí chi tiết"
                        >
                          <Icon name="info" size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                task.address || locationStr
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
                        {isPending && (
                          <>
                            <Button
                              type="button"
                              variant="tonal"
                              size="sm"
                              disabled={isActionBusy}
                              onClick={() => handleDecline(task.id)}
                              className="rounded-xl text-xs font-bold text-on-surface hover:text-red-600"
                            >
                              Từ chối
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              icon="visibility"
                              onClick={() => setSelectedTaskDetail(task)}
                              className="rounded-xl text-xs font-bold border-surface-variant/40"
                            >
                              Chi tiết
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              icon="done_all"
                              disabled={isActionBusy}
                              onClick={() => handleAccept(task.id)}
                              className="rounded-xl text-xs font-extrabold px-5 shadow-sm"
                            >
                              {isActionBusy ? 'Đang xử lý...' : 'Chấp nhận'}
                            </Button>
                          </>
                        )}

                        {isMatched && (
                          <>
                            <Button
                              type="button"
                              variant="tonal"
                              size="sm"
                              disabled={isActionBusy}
                              onClick={() => handleDecline(task.id)}
                              className="rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Hủy nhận
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              icon="description"
                              onClick={() => setSelectedTaskDetail(task)}
                              className="rounded-xl text-xs font-bold border-surface-variant/40"
                            >
                              Chi tiết
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              icon="directions_run"
                              disabled={isActionBusy}
                              onClick={() => handleStartMoving(task.id)}
                              className="rounded-xl text-xs font-extrabold px-5 shadow-sm"
                            >
                              {isActionBusy ? 'Đang cập nhật...' : 'Bắt đầu làm việc'}
                            </Button>
                          </>
                        )}

                        {isInProgress && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              icon="description"
                              onClick={() => setSelectedTaskDetail(task)}
                              className="rounded-xl text-xs font-bold border-surface-variant/40"
                            >
                              Chi tiết
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              icon="check_circle"
                              disabled={isActionBusy}
                              onClick={() => handleComplete(task.id)}
                              className="rounded-xl text-xs font-extrabold px-5 shadow-sm bg-primary"
                            >
                              {isActionBusy ? 'Đang lưu...' : 'Báo hoàn thành'}
                            </Button>
                          </>
                        )}

                        {isAwaitingApproval && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                              <Icon name="hourglass_bottom" size={16} />
                              Chờ khách hàng nghiệm thu
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              icon="visibility"
                              onClick={() => setSelectedTaskDetail(task)}
                              className="rounded-xl text-xs"
                            >
                              Xem đơn
                            </Button>
                          </div>
                        )}

                        {isDone && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-primary font-bold flex items-center gap-1">
                              <Icon name="task_alt" size={16} />
                              Đã quyết toán tiền công
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTaskDetail(task)}
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
        )}
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
                    Lịch làm việc tuần này
                  </h3>
                  <p className="font-caption text-xs text-on-surface-variant">
                    Lịch trình công việc thực tế được đồng bộ tự động từ các đơn đã xác nhận
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

            {/* Week Days Schedule Grid (Tính động theo tuần thực tế) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {weekDays.map((item, idx) => (
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
                {upcomingScheduleTasks.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic py-3 text-center bg-surface-container-low rounded-2xl">
                    Chưa có ca làm việc nào sắp tới trong tuần này.
                  </p>
                ) : (
                  upcomingScheduleTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-variant/30 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon name={getCategoryIcon(task.category)} size={20} />
                        </div>
                        <div>
                          <p className="font-label-md text-sm font-bold text-on-surface">
                            {task.title}
                          </p>
                          <p className="font-caption text-xs text-on-surface-variant">
                            {formatDateTime(task.scheduledStartTime)} • {task.district}, {task.city}
                          </p>
                        </div>
                      </div>
                      <Badge variant="primary" size="sm">
                        {task.status === 'IN_PROGRESS'
                          ? 'Đang thực hiện'
                          : task.status === 'AWAITING_APPROVAL'
                            ? 'Chờ duyệt'
                            : 'Đã cọc Escrow'}
                      </Badge>
                    </div>
                  ))
                )}
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
          <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-6 lg:p-8 shadow-2xl border border-surface-variant/30 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-variant/30">
              <div>
                <span className="font-label-sm text-xs font-bold text-primary uppercase tracking-wider">
                  Chi tiết đơn việc • #TM-{selectedTaskDetail.id.slice(0, 8).toUpperCase()}
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
                  <span className="font-bold text-on-surface">
                    {selectedTaskDetail.client?.name || 'Khách hàng'}
                    {selectedTaskDetail.client?.phoneNumber
                      ? ` (${selectedTaskDetail.client.phoneNumber})`
                      : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Ngành nghề &amp; Chuyên môn:</span>
                  <span className="font-semibold text-on-surface">
                    {selectedTaskDetail.category} • {selectedTaskDetail.skillName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Thù lao dịch vụ:</span>
                  <span className="font-extrabold text-primary text-base">
                    {formatCurrency(selectedTaskDetail.offeredPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Thời gian hẹn:</span>
                  <span className="font-bold text-on-surface">
                    {formatDateTime(selectedTaskDetail.scheduledStartTime)} ({selectedTaskDetail.expectedTime} phút)
                  </span>
                </div>
                <div className="flex justify-between items-start text-xs pt-1 border-t border-surface-variant/20">
                  <span className="text-on-surface-variant font-medium shrink-0">Địa chỉ cụ thể:</span>
                  <span className="font-semibold text-right text-on-surface">
                    {selectedTaskDetail.address || `${selectedTaskDetail.district}, ${selectedTaskDetail.city}`}
                  </span>
                </div>
              </div>

              {selectedTaskDetail.description && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 space-y-1">
                  <span className="font-label-sm text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Icon name="info" size={16} />
                    Ghi chú / Mô tả từ khách hàng:
                  </span>
                  <p className="font-body-sm text-xs text-amber-950 leading-relaxed whitespace-pre-line">
                    {selectedTaskDetail.description}
                  </p>
                </div>
              )}

              {/* Danh sách ảnh đính kèm nếu có */}
              {Array.isArray(selectedTaskDetail.images) && selectedTaskDetail.images.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-label-sm text-xs font-bold text-on-surface">
                    Ảnh hiện trường ({selectedTaskDetail.images.length}):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedTaskDetail.images.map((imgUrl, i) => (
                      <img
                        key={i}
                        src={imgUrl}
                        alt="Hiện trường"
                        className="w-full h-24 object-cover rounded-xl border border-surface-variant/30"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-surface-variant/20">
              <div className="flex items-center gap-2">
                {selectedTaskDetail.client?.id && (
                  <Button
                    type="button"
                    variant="tonal"
                    size="sm"
                    icon="chat"
                    onClick={() => {
                      const client = selectedTaskDetail.client
                      setSelectedTaskDetail(null)
                      onNavigate?.('messages', {
                        targetUserId: client.id,
                        targetName: client.name,
                      })
                    }}
                    className="rounded-xl text-xs font-bold text-primary hover:bg-primary-fixed/40"
                  >
                    Nhắn tin cho khách
                  </Button>
                )}
                {selectedTaskDetail.client?.phoneNumber ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon="phone"
                    onClick={() => window.open(`tel:${selectedTaskDetail.client.phoneNumber}`, '_self')}
                    className="rounded-xl text-xs"
                  >
                    Gọi cho khách
                  </Button>
                ) : (
                  <span className="text-xs text-on-surface-variant italic">
                    SĐT sẽ hiện khi đơn được xác nhận
                  </span>
                )}
              </div>
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
