import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TaskerLayout from '../../components/layout/TaskerLayout'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { ROUTES } from '../../routes/paths'
import ChatWorkspace from '../../components/messages/ChatWorkspace'
import { useAuth } from '../../hooks/useAuth'
import { useChatWebSocket } from '../../hooks/useChatWebSocket'
import { updateWorkerProfileApi } from '../../services/authService'
import {
  fetchTaskerTasks,
  acceptTaskApi,
  declineTaskApi,
  startTaskApi,
  completeTaskApi,
} from '../../services/taskService'
import {
  formatCurrency,
  formatDateTime,
  formatHourSlot,
  getCategoryIcon,
} from '../../utils/formatters'

/**
 * TaskersDashboard Component - Bảng điều khiển Tổng quan của Tasker
 * Tích hợp 100% dữ liệu thật từ Backend ASP.NET Core & MySQL
 * Tuân thủ chuẩn rule.md: Không mock data, dùng service layer & shared components
 */
export default function TaskersDashboard({ onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, token, updateUser } = useAuth()

  const [userSelectedTab, setUserSelectedTab] = useState(null)
  const activeMenu = userSelectedTab ?? location?.state?.tab ?? 'overview'
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [isOffersExpanded, setIsOffersExpanded] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [toastMessage, setToastMessage] = useState(null)

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

  // Hiển thị toast thông báo nhanh
  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleRefresh = useCallback(() => {
    setIsLoading(true)
    setErrorMessage(null)
    setRefreshToken((t) => t + 1)
  }, [])

  // Tải dữ liệu thật từ API Tasker
  useEffect(() => {
    const controller = new AbortController()

    fetchTaskerTasks('all', { signal: controller.signal })
      .then((res) => {
        setData(res)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setErrorMessage(err.message || 'Không thể tải dữ liệu bảng điều khiển.')
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [refreshToken])

  const chatWs = useChatWebSocket()
  const subscribeTaskEvent = chatWs?.subscribeTaskEvent

  useEffect(() => {
    if (!subscribeTaskEvent) return
    const unsubscribe = subscribeTaskEvent((evt) => {
      if (evt.type === 'TaskAssigned') {
        showToast(evt.data?.message || 'Bạn vừa nhận được một đề xuất công việc mới!')
        handleRefresh()
      } else if (evt.type === 'TaskCancelled') {
        showToast(evt.data?.message || 'Khách hàng đã hủy công việc.')
        handleRefresh()
      }
    })
    return unsubscribe
  }, [subscribeTaskEvent, handleRefresh])

  const wp = user?.workerProfile || null
  const isOnline = (wp?.status || 'ONLINE') === 'ONLINE'
  const serviceDistricts = wp?.serviceDistricts || []

  // Bật/tắt trạng thái nhận việc
  const handleToggleOnline = async () => {
    if (!token || togglingStatus) return
    const nextStatus = isOnline ? 'OFFLINE' : 'ONLINE'
    try {
      setTogglingStatus(true)
      const updatedUser = await updateWorkerProfileApi(token, { status: nextStatus })
      updateUser(updatedUser)
      showToast(
        `Đã chuyển sang trạng thái: ${nextStatus === 'ONLINE' ? 'Sẵn sàng nhận việc' : 'Tạm nghỉ'}`
      )
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật trạng thái nhận việc.')
    } finally {
      setTogglingStatus(false)
    }
  }

  const handleSelectSidebarMenu = (menuId) => {
    if (menuId === 'profile_services') {
      onNavigate?.('tasker-profile', { isOwnerView: true })
      return
    }
    if (menuId === 'requests') {
      onNavigate?.('tasker-requests')
      return
    }
    setUserSelectedTab(menuId)
  }

  // Thao tác: Chấp nhận offer (PENDING -> MATCHED)
  const handleAcceptTask = async (task) => {
    const taskId = task.id
    const prevData = data
    try {
      setActionLoadingId(taskId)
      // Optimistic update
      setData((prev) => ({
        stats: {
          ...prev.stats,
          pendingCount: Math.max(0, prev.stats.pendingCount - 1),
          matchedCount: prev.stats.matchedCount + 1,
        },
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: 'MATCHED' } : t)),
      }))

      const res = await acceptTaskApi(taskId)
      showToast(res.message || 'Đã nhận việc thành công!')
      handleRefresh()
    } catch (err) {
      setData(prevData)
      showToast(err.message || 'Không thể nhận việc.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Thao tác: Từ chối offer
  const handleDeclineTask = async (taskId) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối công việc này?')) return
    const prevData = data
    try {
      setActionLoadingId(taskId)
      setData((prev) => ({
        stats: {
          ...prev.stats,
          pendingCount: Math.max(0, prev.stats.pendingCount - 1),
        },
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      }))

      const res = await declineTaskApi(taskId)
      showToast(res.message || 'Đã từ chối công việc.')
      handleRefresh()
    } catch (err) {
      setData(prevData)
      showToast(err.message || 'Không thể từ chối công việc.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Thao tác: Bắt đầu làm việc (MATCHED -> IN_PROGRESS)
  const handleStartMoving = async (taskId) => {
    const prevData = data
    try {
      setActionLoadingId(taskId)
      setData((prev) => ({
        stats: {
          ...prev.stats,
          matchedCount: Math.max(0, prev.stats.matchedCount - 1),
          inProgressCount: prev.stats.inProgressCount + 1,
        },
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: 'IN_PROGRESS' } : t)),
      }))

      const res = await startTaskApi(taskId)
      showToast(res.message || 'Đã bắt đầu công việc!')
      handleRefresh()
    } catch (err) {
      setData(prevData)
      showToast(err.message || 'Không thể bắt đầu công việc.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Thao tác: Báo hoàn thành việc (IN_PROGRESS -> AWAITING_APPROVAL)
  const handleCompleteTask = async (taskId) => {
    const prevData = data
    try {
      setActionLoadingId(taskId)
      setData((prev) => ({
        stats: {
          ...prev.stats,
          inProgressCount: Math.max(0, prev.stats.inProgressCount - 1),
          awaitingApprovalCount: prev.stats.awaitingApprovalCount + 1,
        },
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: 'AWAITING_APPROVAL' } : t)),
      }))

      const res = await completeTaskApi(taskId)
      showToast(res.message || 'Đã báo hoàn thành việc, đang chờ khách duyệt giải ngân!')
      handleRefresh()
    } catch (err) {
      setData(prevData)
      showToast(err.message || 'Không thể báo hoàn thành công việc.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Danh sách công việc PENDING (Yêu cầu mới)
  const pendingOffers = useMemo(() => {
    return data.tasks.filter((t) => t.status === 'PENDING')
  }, [data.tasks])

  // Ca làm việc tiếp theo: ưu tiên đơn đang làm (IN_PROGRESS) hoặc đơn đã chốt (MATCHED) sớm nhất
  const upcomingTask = useMemo(() => {
    const activeTasks = data.tasks.filter(
      (t) => t.status === 'IN_PROGRESS' || t.status === 'MATCHED'
    )
    if (activeTasks.length === 0) return null
    return activeTasks.sort(
      (a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime)
    )[0]
  }, [data.tasks])

  // Tổng tiền Escrow đang tạm giữ của các ca làm chưa quyết toán
  const escrowHoldAmount = useMemo(() => {
    return data.tasks
      .filter(
        (t) =>
          t.status === 'MATCHED' ||
          t.status === 'IN_PROGRESS' ||
          t.status === 'AWAITING_APPROVAL'
      )
      .reduce((sum, t) => sum + (Number(t.offeredPrice) || 0), 0)
  }, [data.tasks])

  // Các công việc đã hoàn thành gần đây
  const recentCompletedTasks = useMemo(() => {
    return data.tasks
      .filter((t) => t.status === 'DONE')
      .sort((a, b) => new Date(b.actualEndTime || b.createdAt) - new Date(a.actualEndTime || a.createdAt))
      .slice(0, 4)
  }, [data.tasks])

  const displayName = user?.name || 'Đối tác Thợ'
  const ratingStr = wp?.rating ? Number(wp.rating).toFixed(1) : '5.0'
  const completedTasksCount = wp?.completedTasks ?? data.stats.doneCount

  // 4 Thẻ KPI Bento chuẩn
  const statCards = [
    {
      id: 'pending',
      label: 'Yêu cầu mới',
      value: String(data.stats.pendingCount).padStart(2, '0'),
      subtext: data.stats.pendingCount > 0 ? 'Ưu tiên phản hồi sớm' : 'Chưa có yêu cầu mới',
      subtextIcon: data.stats.pendingCount > 0 ? 'mark_email_unread' : 'check',
      subtextColor: data.stats.pendingCount > 0 ? 'text-amber-700' : 'text-outline',
      icon: 'inbox',
      iconBg: 'bg-amber-100 text-amber-800',
      onClick: () => onNavigate?.('tasker-requests'),
    },
    {
      id: 'matched',
      label: 'Lịch hẹn sắp tới',
      value: String(data.stats.matchedCount).padStart(2, '0'),
      subtext: 'Đã khóa lịch & cọc Escrow',
      subtextColor: 'text-primary',
      icon: 'calendar_month',
      iconBg: 'bg-primary-fixed/60 text-primary',
      onClick: () => onNavigate?.('tasker-requests'),
    },
    {
      id: 'in_progress',
      label: 'Đang thực hiện',
      value: String(data.stats.inProgressCount).padStart(2, '0'),
      subtext: 'Tiến độ đang diễn ra',
      subtextColor: 'text-primary',
      icon: 'directions_run',
      iconBg: 'bg-surface-container-high text-on-surface',
      onClick: () => onNavigate?.('tasker-requests'),
    },
    {
      id: 'done',
      label: 'Đã hoàn thành',
      value: String(data.stats.doneCount).padStart(2, '0'),
      subtext: 'Đã quyết toán tiền công',
      subtextColor: 'text-primary',
      icon: 'task_alt',
      iconBg: 'bg-primary/10 text-primary',
      onClick: () => onNavigate?.('tasker-requests'),
    },
  ]

  return (
    <TaskerLayout
      activeMenu={activeMenu}
      onSelectMenu={handleSelectSidebarMenu}
      isOnline={isOnline}
      onToggleOnline={handleToggleOnline}
      onNavigate={onNavigate}
      title={activeMenu === 'messages' ? 'Hộp thư tin nhắn' : 'Bảng điều khiển Thợ'}
    >
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-surface-container-lowest border border-primary/30 rounded-2xl p-4 shadow-xl flex items-center gap-3">
            <Icon name="check_circle" size={20} className="text-primary" />
            <span className="font-label-md text-xs font-bold text-on-surface">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {activeMenu === 'messages' ? (
        <ChatWorkspace onNavigate={onNavigate} role="tasker" />
      ) : (
        <>
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="error" size={18} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {errorMessage.includes('quyền') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => (onNavigate ? onNavigate('become-tasker') : navigate(ROUTES.TASKER_REGISTER))}
                    className="rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Đăng ký Thợ ngay
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-xl text-xs cursor-pointer">
                  Thử lại
                </Button>
              </div>
            </div>
          )}

      {/* 1. Welcome Hero Banner */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {/* Trust Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-extrabold">
              <Icon name="star" size={16} className="text-amber-700" />
              Đánh giá {ratingStr} ★
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/50 text-primary text-xs font-bold">
              <Icon name="task_alt" size={15} />
              {completedTasksCount} công việc đã hoàn thành
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-semibold border border-surface-variant/40">
              <Icon name="verified_user" size={15} className="text-primary" />
              Đối tác Thợ chuyên nghiệp
            </span>
          </div>

          {/* Greeting */}
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Xin chào, {displayName} 👋
          </h2>
          <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
            {serviceDistricts.length > 0 ? (
              <>
                Bạn đang mở nhận việc tại khu vực{' '}
                <span className="text-on-surface font-semibold">
                  {serviceDistricts.map((d) => d.districtName).join(', ')}
                </span>
                . Khách hàng trong khu vực có thể chủ động gửi đặt hẹn trực tiếp.
              </>
            ) : (
              <>
                Bạn chưa đăng ký Quận/Huyện hoạt động nào. Hãy bổ sung khu vực hoạt động trong mục{' '}
                <strong className="text-primary">Hồ sơ &amp; Dịch vụ</strong> để nhận việc hiệu quả nhất.
              </>
            )}
          </p>
        </div>

        {/* Right Quick Control Box */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-surface-container-low/70 p-3.5 rounded-2xl border border-surface-variant/40 shrink-0">
          <div className="flex items-center gap-3 pr-3 border-r border-surface-variant/40">
            <div className="text-xs leading-snug max-w-[120px]">
              <p className="font-bold text-on-surface">
                {isOnline ? 'Đang mở nhận việc' : 'Đang tạm dừng nhận việc'}
              </p>
              <p className="text-[11px] text-primary font-semibold truncate">
                • {serviceDistricts[0]?.districtName || 'Chưa chọn quận'}
              </p>
            </div>
            <button
              type="button"
              disabled={togglingStatus}
              onClick={handleToggleOnline}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isOnline ? 'bg-primary' : 'bg-outline-variant'
              } ${togglingStatus ? 'opacity-60' : ''}`}
              title="Gạt để chuyển trạng thái Online / Tạm nghỉ"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isOnline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon="manage_accounts"
            onClick={() => onNavigate?.('tasker-profile', { isOwnerView: true })}
            className="rounded-xl text-xs font-bold bg-surface-container-lowest"
          >
            Hồ sơ &amp; Dịch vụ
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon="calendar_month"
            onClick={() => onNavigate?.('tasker-requests')}
            className="rounded-xl text-xs font-bold"
          >
            Lịch hẹn
          </Button>
        </div>
      </section>

      {/* 2. 4 Summary Stat Cards (Bento KPIs) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.id}
            onClick={stat.onClick}
            className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-variant/30 flex items-center justify-between gap-3 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="space-y-1.5">
              <span className="font-label-sm text-xs font-semibold text-on-surface-variant block">
                {stat.label}
              </span>
              <div className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                {isLoading ? '--' : stat.value}
              </div>
              <div className={`inline-flex items-center gap-1 text-xs font-bold ${stat.subtextColor}`}>
                {stat.subtextIcon && <Icon name={stat.subtextIcon} size={14} />}
                <span>{stat.subtext}</span>
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.iconBg}`}
            >
              <Icon name={stat.icon} size={22} />
            </div>
          </div>
        ))}
      </section>

      {/* 3. Yêu cầu & Offer mới (Collapsible Quick Bar) */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-variant/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Icon name="mark_email_unread" size={18} />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                Yêu cầu &amp; Đề xuất mới từ Khách hàng
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                ({pendingOffers.length})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingOffers.length > 0 && (
              <button
                type="button"
                onClick={() => setIsOffersExpanded(!isOffersExpanded)}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-primary hover:underline cursor-pointer"
              >
                <span>{isOffersExpanded ? 'Thu gọn' : 'Xem nhanh'}</span>
                <Icon name={isOffersExpanded ? 'expand_less' : 'expand_more'} size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate?.('tasker-requests')}
              className="inline-flex items-center gap-1 text-xs font-extrabold text-primary hover:underline cursor-pointer"
            >
              <span>Vào trang Yêu cầu</span>
              <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        </div>

        {/* Danh sách yêu cầu mới */}
        {(isOffersExpanded || pendingOffers.length > 0) && (
          <div className="mt-4 pt-4 border-t border-surface-variant/30 space-y-3">
            {pendingOffers.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">
                Hiện không có yêu cầu mới nào đang chờ duyệt.
              </p>
            ) : (
              pendingOffers.map((task) => {
                const isBusy = actionLoadingId === task.id
                return (
                  <div
                    key={task.id}
                    className="bg-surface-container-low/60 rounded-2xl p-4 border border-surface-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="primary" size="sm">
                          {task.category || task.skillName}
                        </Badge>
                        <span className="text-xs text-outline font-semibold">
                          Mã #{task.id.slice(0, 8).toUpperCase()} • {task.client?.name || 'Khách hàng'}
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-base font-extrabold text-on-surface truncate">
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="location_on" size={15} className="text-primary" />
                          {task.district}, {task.city}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="schedule" size={15} className="text-primary" />
                          {formatDateTime(task.scheduledStartTime)} ({task.expectedTime} phút)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <div className="text-right mr-2">
                        <span className="text-[11px] text-outline block">Thù lao đề xuất</span>
                        <span className="font-headline-sm text-base font-extrabold text-primary">
                          {formatCurrency(task.offeredPrice)}
                        </span>
                      </div>
                      {task.client?.id && (
                        <Button
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
                          title="Nhắn tin với khách"
                        >
                          Nhắn tin
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleDeclineTask(task.id)}
                        className="rounded-xl text-xs text-red-600 hover:bg-red-50 border-red-200"
                      >
                        Từ chối
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon="check_circle"
                        disabled={isBusy}
                        onClick={() => handleAcceptTask(task)}
                        className="rounded-xl text-xs"
                      >
                        {isBusy ? 'Đang xử lý...' : 'Nhận việc'}
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </section>

      {/* 4. Two-Column Grid: Ca làm việc tiếp theo & Ví Thu nhập Escrow */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Ca làm việc tiếp theo */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/30 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 text-primary flex items-center justify-center">
                  <Icon name="schedule" size={20} />
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-extrabold text-on-surface">
                    Lịch hẹn tiếp theo
                  </h3>
                  <p className="text-xs text-on-surface-variant">Ca làm sắp diễn ra gần nhất</p>
                </div>
              </div>
              {upcomingTask && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    upcomingTask.status === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-900 animate-pulse'
                      : 'bg-primary-fixed/60 text-primary'
                  }`}
                >
                  {upcomingTask.status === 'IN_PROGRESS' ? '• Đang thực hiện' : 'Đã chốt lịch'}
                </span>
              )}
            </div>

            {upcomingTask ? (
              <>
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low/70 border border-surface-variant/30">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                      <Icon name={getCategoryIcon(upcomingTask.category || upcomingTask.skillName)} size={22} />
                    </div>
                    <div>
                      <h4 className="font-label-md text-sm font-extrabold text-on-surface">
                        {upcomingTask.client?.name || 'Khách hàng'}
                      </h4>
                      <p className="text-xs text-primary font-semibold">
                        SĐT: {upcomingTask.client?.phoneNumber || 'Đã liên kết hệ thống'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-sm text-base font-extrabold text-primary block">
                      {formatCurrency(upcomingTask.offeredPrice)}
                    </span>
                    <span className="text-[10px] text-outline">Đã cọc Escrow</span>
                  </div>
                </div>

                <div className="space-y-2.5 bg-surface-container-low/40 p-4 rounded-2xl border border-surface-variant/30">
                  <h5 className="font-headline-sm text-sm font-extrabold text-on-surface">
                    {upcomingTask.title}
                  </h5>
                  <div className="space-y-1.5 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <Icon name="event" size={16} className="text-primary" />
                      <span>
                        {formatDateTime(upcomingTask.scheduledStartTime)} (
                        {formatHourSlot(upcomingTask.scheduledStartTime, upcomingTask.expectedTime)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="location_on" size={16} className="text-primary" />
                      <span>
                        {upcomingTask.address || `${upcomingTask.district}, ${upcomingTask.city}`}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center bg-surface-container-low/40 rounded-2xl border border-surface-variant/30 space-y-2">
                <Icon name="event_available" size={36} className="text-outline mx-auto" />
                <p className="font-headline-sm text-sm font-bold text-on-surface">
                  Hiện không có ca làm việc nào sắp tới
                </p>
                <p className="text-xs text-on-surface-variant">
                  Khi khách hàng đặt hẹn hoặc bạn nhận việc, lịch trình sẽ xuất hiện tại đây.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            {upcomingTask?.status === 'MATCHED' && (
              <Button
                variant="primary"
                size="sm"
                icon="directions_run"
                disabled={actionLoadingId === upcomingTask.id}
                onClick={() => handleStartMoving(upcomingTask.id)}
                className="flex-1 rounded-xl justify-center py-2.5 text-xs font-bold"
              >
                {actionLoadingId === upcomingTask.id ? 'Đang cập nhật...' : 'Bắt đầu làm việc'}
              </Button>
            )}
            {upcomingTask?.status === 'IN_PROGRESS' && (
              <Button
                variant="primary"
                size="sm"
                icon="check_circle"
                disabled={actionLoadingId === upcomingTask.id}
                onClick={() => handleCompleteTask(upcomingTask.id)}
                className="flex-1 rounded-xl justify-center py-2.5 text-xs font-bold"
              >
                {actionLoadingId === upcomingTask.id ? 'Đang cập nhật...' : 'Báo hoàn thành'}
              </Button>
            )}
            {upcomingTask?.client?.id && (
              <Button
                variant="tonal"
                size="sm"
                icon="chat"
                onClick={() =>
                  onNavigate?.('messages', {
                    targetUserId: upcomingTask.client.id,
                    targetName: upcomingTask.client.name,
                  })
                }
                className="rounded-xl py-2.5 text-xs font-bold text-primary hover:bg-primary-fixed/40"
                title="Nhắn tin với khách hàng"
              >
                Nhắn tin
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon="calendar_month"
              onClick={() => onNavigate?.('tasker-requests')}
              className="rounded-xl py-2.5 text-xs font-bold"
            >
              Mở lịch chi tiết
            </Button>
          </div>
        </div>

        {/* Right Column: Ví Thu nhập & Bảo chứng Escrow */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/30 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed/60 text-primary flex items-center justify-center">
                <Icon name="account_balance_wallet" size={20} />
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-extrabold text-on-surface">
                  Ví Thu nhập &amp; Bảo chứng Escrow
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Giải ngân tự động ngay khi khách bấm nghiệm thu
                </p>
              </div>
            </div>
            <Badge variant="primary" size="sm" icon="lock">
              Bảo chứng 100%
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-primary-fixed/25 border border-primary/20">
              <span className="text-xs text-on-surface-variant font-semibold block">
                Số dư khả dụng (Rút ngay)
              </span>
              <div className="font-headline-md text-2xl font-extrabold text-primary mt-1">
                {formatCurrency(user?.balance || 0)}
              </div>
              <span className="text-[11px] text-primary font-semibold mt-1 block">
                • Tiền thật trong ví tài khoản
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80">
              <span className="text-xs text-amber-900 font-semibold block">
                Escrow đang tạm giữ an toàn
              </span>
              <div className="font-headline-md text-2xl font-extrabold text-amber-900 mt-1">
                {formatCurrency(escrowHoldAmount)}
              </div>
              <span className="text-[11px] text-amber-800 font-medium mt-1 block">
                • Tiền cọc các ca làm đang tiến hành
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-outline">
              Đối soát: <strong>Tự động quyết toán theo ca làm</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              icon="arrow_forward"
              onClick={() => onNavigate?.('tasker-requests')}
              className="rounded-xl text-xs font-bold"
            >
              Xem danh sách việc
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Section: Lịch sử công việc hoàn thành gần nhất */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-base font-extrabold text-on-surface">
              Công việc đã hoàn thành gần nhất
            </h3>
            <p className="text-xs text-on-surface-variant">
              Các ca làm đã được khách hàng nghiệm thu và giải ngân tiền công
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('tasker-requests')}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline cursor-pointer"
          >
            <span>Tất cả lịch sử</span>
            <Icon name="arrow_forward" size={15} />
          </button>
        </div>

        {recentCompletedTasks.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-low/30 rounded-2xl border border-surface-variant/30">
            <Icon name="history_edu" size={36} className="text-outline mx-auto mb-2" />
            <p className="font-headline-sm text-sm font-bold text-on-surface">
              Chưa có công việc nào hoàn thành gần đây
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Sau khi khách hàng duyệt nghiệm thu ca làm, lịch sử quyết toán sẽ lưu trữ tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentCompletedTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-surface-container-low/60 border border-surface-variant/30 flex items-center justify-between gap-3 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon name={getCategoryIcon(t.category || t.skillName)} size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-label-md text-sm font-extrabold text-on-surface truncate">
                      {t.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant truncate">
                      Khách hàng: {t.client?.name || 'Khách hàng'} • #{t.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-headline-sm text-sm font-extrabold text-primary block">
                    +{formatCurrency(t.offeredPrice)}
                  </span>
                  <span className="text-[11px] text-outline">
                    {formatDateTime(t.actualEndTime || t.scheduledStartTime).split('•')[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </TaskerLayout>
  )
}

