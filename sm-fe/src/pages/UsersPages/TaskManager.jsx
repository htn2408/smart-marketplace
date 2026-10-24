import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { ROUTES } from '../../routes/paths'
import { fetchClientTasks, approveTaskApi, cancelTaskApi } from '../../services/taskService'
import { useChatWebSocket } from '../../hooks/useChatWebSocket'
import Pagination from '../../components/common/Pagination'

/**
 * Map tên chuyên môn sang Material Symbols icon tương ứng
 */
function getCategoryIcon(categoryName) {
  if (!categoryName) return 'handyman'
  const cat = categoryName.toLowerCase()
  if (cat.includes('điện') && cat.includes('nước')) return 'plumbing'
  if (cat.includes('điện') || cat.includes('quạt') || cat.includes('đèn') || cat.includes('aptomat'))
    return 'electric_bolt'
  if (cat.includes('nước') || cat.includes('ống') || cat.includes('bồn')) return 'plumbing'
  if (
    cat.includes('lắp') ||
    cat.includes('nội thất') ||
    cat.includes('bàn') ||
    cat.includes('ghế') ||
    cat.includes('tủ')
  )
    return 'shelves'
  if (cat.includes('dọn') || cat.includes('vệ sinh')) return 'cleaning_services'
  if (cat.includes('chuyển') || cat.includes('vận chuyển') || cat.includes('bốc'))
    return 'local_shipping'
  if (cat.includes('sơn') || cat.includes('sửa')) return 'build'
  return 'handyman'
}

/**
 * TaskManager Component - Trang Quản lý công việc & Lịch hẹn của Khách hàng
 * Tích hợp 100% Backend API ASP.NET Core (.NET 10 port 5236)
 * Tuân thủ chuẩn rule.md: Không mock data, dùng shared components và service layer
 */
export default function TaskManager({ onNavigate }) {
  const navigate = useNavigate()
  const location = useLocation()
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

  // ALL, PENDING, MATCHED, IN_PROGRESS, AWAITING_APPROVAL, DONE, CANCELLED
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [activeModal, setActiveModal] = useState(null) // { type: 'escrow' | 'cancel' | 'report' | 'detail', task }
  const [previewImage, setPreviewImage] = useState(null)
    const [toastMessage, setToastMessage] = useState(() => location.state?.alertMessage || '')

  // Hiển thị toast thông báo nhanh
  const showToast = useCallback((msg) => {
    setToastMessage(msg)
  }, [])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(''), 3500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // Làm mới dữ liệu từ server
  const handleRefresh = useCallback(() => {
    setIsLoading(true)
    setErrorMessage('')
    setRefreshToken((t) => t + 1)
  }, [])

  // Tải danh sách công việc của Client từ API
  useEffect(() => {
    const controller = new AbortController()

    const statusParam = activeTab === 'ALL' ? undefined : activeTab
    fetchClientTasks(statusParam, { signal: controller.signal })
      .then((res) => {
        setData(res)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setErrorMessage(err.message || 'Không thể tải danh sách công việc của bạn.')
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [activeTab, refreshToken])

  const chatWs = useChatWebSocket()
  const subscribeTaskEvent = chatWs?.subscribeTaskEvent

  // Lắng nghe sự kiện SignalR thời gian thực từ Backend
  useEffect(() => {
    if (!subscribeTaskEvent) return
    const unsubscribe = subscribeTaskEvent((evt) => {
      if (evt.type === 'TaskDeclined') {
        showToast(evt.data?.message || 'Thợ đã từ chối yêu cầu. Tiền cọc đã được hoàn về ví.')
        handleRefresh()
      } else if (evt.type === 'TaskAccepted') {
        showToast(evt.data?.message || 'Thợ đã nhận yêu cầu công việc!')
        handleRefresh()
      } else if (evt.type === 'TaskStarted') {
        showToast(evt.data?.message || 'Thợ đã bắt đầu di chuyển / làm việc!')
        handleRefresh()
      } else if (evt.type === 'TaskCompleted') {
        showToast(evt.data?.message || 'Thợ đã hoàn thành công việc. Vui lòng nghiệm thu!')
        handleRefresh()
      }
    })
    return unsubscribe
  }, [subscribeTaskEvent, handleRefresh, showToast])

  // Tự động làm mới định kỳ ngầm khi có công việc đang chờ thợ phản hồi hoặc đang thi công
  useEffect(() => {
    const hasActiveTasks = data.tasks.some(
      (t) => (t.status === 'PENDING' && t.worker) || t.status === 'IN_PROGRESS' || t.status === 'AWAITING_APPROVAL'
    )
    if (!hasActiveTasks) return

    const intervalId = setInterval(() => {
      const statusParam = activeTab === 'ALL' ? undefined : activeTab
      fetchClientTasks(statusParam)
        .then((res) => {
          setData(res)
        })
        .catch(() => {})
    }, 12000)

    return () => clearInterval(intervalId)
  }, [data.tasks, activeTab])

  // Lọc theo từ khóa tìm kiếm
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return data.tasks
    const q = searchQuery.toLowerCase().trim()
    return data.tasks.filter((task) => {
      const matchCode = `#TM-${task.id.slice(0, 8)}`.toLowerCase().includes(q)
      const matchTitle = (task.title || '').toLowerCase().includes(q)
      const matchCategory = (task.category || '').toLowerCase().includes(q)
      const matchWorker = (task.worker?.name || '').toLowerCase().includes(q)
      return matchCode || matchTitle || matchCategory || matchWorker
    })
  }, [data.tasks, searchQuery])

  // Tổng số trang tính theo danh sách đã lọc
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  // Danh sách công việc phân trang của trang hiện tại
  const paginatedTasks = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize
    return filteredTasks.slice(startIndex, startIndex + pageSize)
  }, [filteredTasks, safeCurrentPage, pageSize])

  // Thao tác: Nghiệm thu & giải ngân Escrow (AWAITING_APPROVAL -> DONE)
  const handleReleaseEscrow = async (taskId) => {
    try {
      setActionLoadingId(taskId)
      const res = await approveTaskApi(taskId)
      showToast(res.message || 'Đã xác nhận nghiệm thu và giải ngân tiền công cho thợ thành công!')
      setActiveModal(null)
      handleRefresh()
    } catch (err) {
      showToast(err.message || 'Không thể giải ngân.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Thao tác: Khách hủy yêu cầu (PENDING/MATCHED -> CANCELLED, hoàn cọc nếu có)
  const handleCancelTask = async (taskId) => {
    try {
      setActionLoadingId(taskId)
      const res = await cancelTaskApi(taskId)
      showToast(res.message || 'Đã hủy công việc thành công. Tiền cọc đã hoàn về ví.')
      setActiveModal(null)
      handleRefresh()
    } catch (err) {
      showToast(err.message || 'Không thể hủy yêu cầu.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Điều hướng sang trang chọn thợ khác (truyền đầy đủ taskData thật)
  const handleChooseAnotherTasker = (task) => {
    const taskState = {
      taskData: {
        id: task.id,
        title: task.title,
        offeredPrice: task.offeredPrice,
        categoryName: task.category || task.skillName,
        requestCode: `#TM-${task.id.slice(0, 8).toUpperCase()}`,
        scheduledText: formatDateTime(task.scheduledStartTime),
        fullAddress: task.address || `${task.district}, ${task.city}`,
        district: task.district,
        images: task.images || [],
        description: task.description || '',
        skillId: task.requiredSkillId || '',
      },
      fromTaskDetail: true,
    }

    if (onNavigate) {
      onNavigate('filter-tasker', taskState)
    } else {
      navigate(ROUTES.CLIENT_FILTER_TASKER, { state: taskState })
    }
  }

  const tabs = [
    {
      id: 'ALL',
      label: 'Tất cả',
      count:
        data.stats.pendingCount +
        data.stats.matchedCount +
        data.stats.inProgressCount +
        data.stats.awaitingApprovalCount +
        data.stats.doneCount +
        data.stats.cancelledCount,
    },
    { id: 'PENDING', label: 'Chờ thợ nhận', count: data.stats.pendingCount },
    { id: 'MATCHED', label: 'Đã nhận lịch', count: data.stats.matchedCount },
    { id: 'IN_PROGRESS', label: 'Đang làm', count: data.stats.inProgressCount, highlight: true },
    {
      id: 'AWAITING_APPROVAL',
      label: 'Chờ nghiệm thu',
      count: data.stats.awaitingApprovalCount,
      highlight: true,
      color: 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold',
    },
    { id: 'DONE', label: 'Đã hoàn thành', count: data.stats.doneCount },
    { id: 'CANCELLED', label: 'Đã hủy', count: data.stats.cancelledCount },
  ]

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
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
                    Theo dõi tiến độ trực tiếp từ thợ chuyên nghiệp, kiểm soát chất lượng thi công và
                    an tâm giải ngân qua TaskMate Escrow.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="outline"
                    size="md"
                    icon="refresh"
                    onClick={handleRefresh}
                    className="rounded-lg shadow-xs"
                    title="Làm mới dữ liệu từ máy chủ"
                  >
                    Làm mới
                  </Button>
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
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                      <Icon name="hourglass_top" size={20} />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                        {String(data.stats.pendingCount).padStart(2, '0')}
                      </span>
                      <span className="font-caption text-caption text-amber-800 font-medium">
                        việc đang chờ
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-caption text-caption text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
                      <Icon name="timer" size={13} />
                      <span>Ưu tiên 15p</span>
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
                        {String(data.stats.matchedCount).padStart(2, '0')}
                      </span>
                      <span className="font-caption text-caption text-primary font-medium">
                        đã chốt thợ
                      </span>
                    </div>
                    <span className="font-caption text-caption text-on-surface-variant font-medium">
                      Đã cọc Escrow
                    </span>
                  </div>
                </div>

                {/* Metric 3: In Progress & Awaiting Approval */}
                <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-4 border border-surface-variant/20 hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Đang thực hiện &amp; Nghiệm thu
                    </span>
                    <div className="relative w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                      <Icon name="engineering" size={20} />
                      {data.stats.awaitingApprovalCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                        {String(data.stats.inProgressCount + data.stats.awaitingApprovalCount).padStart(2, '0')}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant font-medium">
                        đơn việc
                      </span>
                    </div>
                    {data.stats.awaitingApprovalCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-caption text-caption text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full font-bold animate-pulse">
                        <Icon name="verified" size={13} />
                        <span>Cần duyệt!</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Metric 4: Completed */}
                <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-4 border border-surface-variant/20 hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Đã hoàn thành
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon name="task_alt" size={20} />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                        {String(data.stats.doneCount).padStart(2, '0')}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant font-medium">
                        việc hoàn tất
                      </span>
                    </div>
                    <span className="font-caption text-caption text-primary font-medium flex items-center gap-0.5">
                      <Icon name="shield" size={13} />
                      Bảo hành 30 ngày
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content Workspace */}
          <section className="w-full py-8">
            <div className="max-w-[1240px] mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Tasks Flow (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Status Filter Tabs & Search Bar */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-surface-variant/30">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(tab.id)
                              setCurrentPage(1)
                            }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                              isActive
                                ? 'bg-primary text-on-primary font-bold shadow-xs'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                                isActive
                                ? 'bg-white/20 text-white'
                                : tab.color || 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full">
                    <Icon
                      name="search"
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
                    />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo mã đơn, tiêu đề, chuyên môn hoặc tên thợ..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-variant/40 bg-surface-container-lowest text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          setCurrentPage(1)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer p-1"
                      >
                        <Icon name="close" size={16} />
                      </button>
                    )}
                    </div>
                  </div>

                  {/* Error State */}
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="error" size={18} />
                        <span>{errorMessage}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs">
                        Thử lại
                      </Button>
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Đang tải danh sách công việc của bạn...
                      </p>
                    </div>
                  )}

                  {/* Task Items List */}
                  {!isLoading && (
                    <div className="space-y-4">
                      {filteredTasks.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-surface-container-lowest border border-surface-variant/30 space-y-3">
                          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mx-auto">
                            <Icon name="inbox" size={32} />
                          </div>
                          <h3 className="font-headline-sm text-base font-bold text-on-surface">
                            Không tìm thấy công việc nào
                          </h3>
                          <p className="font-body-sm text-xs text-on-surface-variant max-w-sm mx-auto">
                            {searchQuery
                              ? 'Không có kết quả khớp với từ khóa tìm kiếm của bạn.'
                              : 'Bạn chưa có yêu cầu nào trong trạng thái này.'}
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (onNavigate) onNavigate('task-detail')
                            }}
                            className="mt-2 text-xs"
                          >
                            Đăng việc mới ngay
                          </Button>
                        </div>
                      ) : (
                        paginatedTasks.map((task) => {
                          const isPending = task.status === 'PENDING'
                          const isMatched = task.status === 'MATCHED'
                          const isInProgress = task.status === 'IN_PROGRESS'
                          const isAwaitingApproval = task.status === 'AWAITING_APPROVAL'
                          const isDone = task.status === 'DONE'
                          const isCancelled = task.status === 'CANCELLED'

                          const code = `#TM-${task.id.slice(0, 8).toUpperCase()}`
                          const icon = getCategoryIcon(task.category || task.skillName)
                          const timeStr = formatDateTime(task.scheduledStartTime)
                          const isBusy = actionLoadingId === task.id

                          return (
                            <div
                              key={task.id}
                              className={`p-6 rounded-2xl bg-surface-container-lowest shadow-sm border transition-all space-y-4 hover:shadow-md ${
                                isAwaitingApproval
                                  ? 'border-2 border-amber-500 bg-amber-50/20'
                                  : isInProgress
                                    ? 'border-l-4 border-l-primary border-surface-variant/30'
                                    : 'border-surface-variant/30'
                              }`}
                            >
                              {/* Urgent Banner for Awaiting Approval */}
                              {isAwaitingApproval && (
                                <div className="p-3.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                                  <div className="flex items-center gap-2.5">
                                    <Icon name="verified" size={22} className="text-amber-700 shrink-0" />
                                    <div>
                                      <p className="font-label-md text-xs font-bold text-amber-950">
                                        Thợ đã báo hoàn thành công việc!
                                      </p>
                                      <p className="font-caption text-[11px] text-amber-900">
                                        Vui lòng kiểm tra chất lượng thi công để xác nhận nghiệm thu và giải ngân tiền công.
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon="check"
                                    disabled={isBusy}
                                    onClick={() => setActiveModal({ type: 'escrow', task })}
                                    className="bg-primary text-on-primary shrink-0 text-xs font-bold shadow-sm"
                                  >
                                    Nghiệm thu &amp; Giải ngân ngay
                                  </Button>
                                </div>
                              )}

                              {/* Header Row */}
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-surface-variant/20">
                                <div className="flex items-start gap-3">
                                  <div className="w-11 h-11 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                                    <Icon name={icon} size={22} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-caption text-xs font-bold text-outline">
                                        {code}
                                      </span>
                                      <h3 className="font-headline-sm text-base font-bold text-on-surface">
                                        {task.title}
                                      </h3>
                                      <Badge variant="primary" size="sm">
                                        {task.category}
                                      </Badge>
                                    </div>
                                    <p className="font-caption text-xs text-on-surface-variant mt-1 flex items-center gap-1.5">
                                      <Icon name="calendar_today" size={14} className="text-primary" />
                                      <span>Lịch hẹn: {timeStr} ({task.expectedTime} phút)</span>
                                      <span>•</span>
                                      <Icon name="location_on" size={14} className="text-primary" />
                                      <span>{task.district}, {task.city}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Price Box */}
                                <div className="text-left sm:text-right">
                                  <span className="font-headline-md text-lg font-extrabold text-primary block">
                                    {formatCurrency(task.offeredPrice)}
                                  </span>
                                  <span className="font-caption text-[11px] text-on-surface-variant">
                                    {isPending && !task.worker ? 'Ngân sách đề xuất' : 'Đã giữ trong Escrow'}
                                  </span>
                                </div>
                              </div>

                              {/* Tasker Info Row (if assigned) */}
                              {task.worker ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-variant/20">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                      {task.worker.name?.charAt(0) || 'T'}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-label-md text-xs font-bold text-on-surface">
                                          {task.worker.name}
                                        </span>
                                        <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                                          ★ {Number(task.worker.rating || 5).toFixed(1)}
                                        </span>
                                      </div>
                                      <p className="font-caption text-[11px] text-on-surface-variant">
                                        Đã hoàn thành {task.worker.completedTasks} việc
                                        {task.worker.phoneNumber ? ` • SĐT: ${task.worker.phoneNumber}` : ''}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {(task.worker.userId || task.worker.id) && (
                                      <Button
                                        variant="tonal"
                                        size="sm"
                                        icon="chat"
                                        onClick={() => {
                                          const targetUserId = task.worker.userId || task.worker.id
                                          const state = {
                                            targetUserId,
                                            targetName: task.worker.name,
                                          }
                                          if (onNavigate) {
                                            onNavigate('messages', state)
                                          } else {
                                            navigate(ROUTES.MESSAGES, { state })
                                          }
                                        }}
                                        className="text-xs"
                                        title="Nhắn tin với thợ"
                                      >
                                        Nhắn tin
                                      </Button>
                                    )}
                                    {(task.worker.userId || task.worker.id) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        icon="person"
                                        onClick={() => {
                                          const state = { isOwnerView: false, tasker: task.worker }
                                          if (onNavigate) {
                                            if (task.worker.userId) {
                                              onNavigate(`/tasker/${task.worker.userId}`, state)
                                            } else {
                                              onNavigate('tasker-profile', state)
                                            }
                                          } else {
                                            const route = task.worker.userId
                                              ? `/tasker/${task.worker.userId}`
                                              : ROUTES.TASKER_PROFILE
                                            navigate(route, { state })
                                          }
                                        }}
                                        className="text-xs"
                                        title="Xem hồ sơ thợ & đặt lại công việc"
                                      >
                                        Xem trang cá nhân
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs gap-3">
                                  <div className="flex items-center gap-2 text-amber-900">
                                    <Icon name="info" size={18} className="text-amber-700 shrink-0" />
                                    <span>
                                      Đơn chưa có thợ nhận (hoặc thợ trước bận/từ chối). Tiền cọc đã hoàn về ví.
                                    </span>
                                  </div>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon="person_search"
                                    onClick={() => handleChooseAnotherTasker(task)}
                                    className="text-xs shrink-0 font-bold"
                                  >
                                    Chọn thợ khác ngay
                                  </Button>
                                </div>
                              )}

                              {/* Description snippet if any */}
                              {task.description && (
                                <p className="font-body-sm text-xs text-on-surface-variant bg-surface-container-lowest p-2 rounded-lg border border-surface-variant/20">
                                  <strong className="text-on-surface">Ghi chú:</strong> {task.description}
                                </p>
                              )}

                              {/* Attached photos if any */}
                              {Array.isArray(task.images) && task.images.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="font-caption text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                                    <Icon name="photo_camera" size={14} className="text-primary" />
                                    Ảnh hiện trường ({task.images.length}):
                                  </span>
                                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                    {task.images.map((imgUrl, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setPreviewImage(imgUrl)}
                                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-surface-variant/40 shrink-0 hover:opacity-90 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer group"
                                        title="Bấm để xem ảnh phóng to"
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`Hiện trường ${i + 1}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                          <Icon name="zoom_in" size={18} />
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action Footer */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <div className="flex items-center gap-2">
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm text-xs font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-pulse" />
                                      {task.worker ? 'Chờ thợ phản hồi' : 'Chờ chọn thợ mới'}
                                    </span>
                                  )}
                                  {isMatched && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/60 text-primary font-label-sm text-xs font-bold">
                                      <Icon name="check_circle" size={14} />
                                      Đã chốt lịch hẹn
                                    </span>
                                  )}
                                  {isInProgress && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-xs font-bold">
                                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                      Thợ đang thi công
                                    </span>
                                  )}
                                  {isAwaitingApproval && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200 text-amber-950 font-label-sm text-xs font-bold">
                                      <Icon name="hourglass_top" size={14} />
                                      Chờ bạn nghiệm thu
                                    </span>
                                  )}
                                  {isDone && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-xs font-bold">
                                      <Icon name="verified" size={14} />
                                      Đã hoàn thành &amp; Giải ngân
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-label-sm text-xs font-bold">
                                      <Icon name="cancel" size={14} />
                                      Đã hủy
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {(isPending || isMatched) && (
                                    <Button
                                      variant="tonal"
                                      size="sm"
                                      disabled={isBusy}
                                      onClick={() => setActiveModal({ type: 'cancel', task })}
                                      className="text-xs text-red-600 hover:bg-red-50"
                                    >
                                      Hủy yêu cầu
                                    </Button>
                                  )}

                                  {isInProgress && (
                                    <Button
                                      variant="tonal"
                                      size="sm"
                                      onClick={() => setActiveModal({ type: 'report', task })}
                                      className="text-xs text-red-600 hover:bg-red-50"
                                    >
                                      Báo sự cố
                                    </Button>
                                  )}

                                  {isAwaitingApproval && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      icon="check"
                                      disabled={isBusy}
                                      onClick={() => setActiveModal({ type: 'escrow', task })}
                                      className="text-xs font-bold"
                                    >
                                      Nghiệm thu &amp; Giải ngân
                                    </Button>
                                  )}

                                  {isCancelled && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      icon="refresh"
                                      onClick={() => {
                                        if (onNavigate) onNavigate('task-detail')
                                      }}
                                      className="text-xs"
                                    >
                                      Đăng lại
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}

                  {/* Phân trang công việc */}
                  {!isLoading && filteredTasks.length > 0 && (
                    <Pagination
                      currentPage={safeCurrentPage}
                      totalPages={totalPages}
                      totalItems={filteredTasks.length}
                      pageSize={pageSize}
                      onPageChange={(page) => {
                        setCurrentPage(page)
                        window.scrollTo({ top: 350, behavior: 'smooth' })
                      }}
                      onPageSizeChange={(newSize) => {
                        setPageSize(newSize)
                        setCurrentPage(1)
                      }}
                      pageSizeOptions={[5, 10, 15, 20]}
                      itemName="công việc"
                      className="mt-6"
                    />
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

                  {/* Card 2: 24/7 Dedicated Support */}
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

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
                  Công việc: #TM-{activeModal.task?.id?.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Bạn có chắc chắn đã kiểm tra kết quả thi công và hài lòng với chất lượng? Số tiền{' '}
              <strong className="text-primary font-bold">
                {formatCurrency(activeModal.task?.offeredPrice)}
              </strong>{' '}
              sẽ được chuyển từ quỹ Escrow sang ví của thợ{' '}
              <strong>{activeModal.task?.worker?.name || 'thợ chuyên nghiệp'}</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="tonal" size="md" onClick={() => setActiveModal(null)}>
                Xem lại
              </Button>
              <Button
                variant="primary"
                size="md"
                icon="check"
                disabled={actionLoadingId === activeModal.task?.id}
                onClick={() => handleReleaseEscrow(activeModal.task?.id)}
              >
                {actionLoadingId === activeModal.task?.id ? 'Đang giải ngân...' : 'Xác nhận giải ngân'}
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
                  Công việc: #TM-{activeModal.task?.id?.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Bạn có chắc chắn muốn hủy yêu cầu dịch vụ này? Nếu bạn đã đặt cọc tiền công{' '}
              <strong className="text-on-surface">
                {formatCurrency(activeModal.task?.offeredPrice)}
              </strong>
              , số tiền sẽ được tự động hoàn trả ngay 100% về ví tài khoản của bạn.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="tonal" size="md" onClick={() => setActiveModal(null)}>
                Không, giữ lại
              </Button>
              <Button
                variant="tonal"
                size="md"
                disabled={actionLoadingId === activeModal.task?.id}
                className="text-error hover:bg-error/10 font-bold"
                onClick={() => handleCancelTask(activeModal.task?.id)}
              >
                {actionLoadingId === activeModal.task?.id ? 'Đang hủy...' : 'Đồng ý hủy việc'}
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
              Nhân viên chăm sóc khách hàng TaskMate sẽ tạm giữ phong tỏa khoản tiền Escrow và liên
              hệ với bạn trong vòng 5 phút để can thiệp xử lý.
            </p>

            <div className="space-y-2">
              <label className="font-label-md text-xs font-semibold text-on-surface">
                Mô tả sơ lược sự cố:
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Thợ làm vỡ phụ kiện, không đúng vật tư cam kết..."
                className="w-full p-3 text-body-sm rounded-lg border border-surface-variant/40 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
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

      {/* MODAL: Xem ảnh phóng to */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white/90 hover:text-white p-2 rounded-full cursor-pointer"
            >
              <Icon name="close" size={24} />
            </button>
            <img
              src={previewImage}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  )
}

