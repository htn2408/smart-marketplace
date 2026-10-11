import { useState } from 'react'
import TaskerLayout from '../components/layout/TaskerLayout'
import Icon from '../components/common/Icon'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import DistrictMultiSelector from '../components/common/DistrictMultiSelector'
import { useAuth } from '../hooks/useAuth'
import { updateWorkerProfileApi } from '../services/authService'
import { TASKER_DASHBOARD_MOCK } from '../constants/mockData'

/**
 * TaskersDashboard Page - Bảng điều khiển Thợ (Verdant Trust Theme)
 * Sử dụng chung khung TaskerLayout (Sidebar + Topbar có nút Chế độ Client) và DistrictMultiSelector.
 */
export default function TaskersDashboard({ onNavigate }) {
  const { user, token, updateUser } = useAuth()

  const [activeMenu, setActiveMenu] = useState('overview')
  const [isOnline, setIsOnline] = useState(true)
  const [isOffersExpanded, setIsOffersExpanded] = useState(false)

  // Danh sách công việc từ constant mock
  const [availableTasks, setAvailableTasks] = useState(TASKER_DASHBOARD_MOCK.availableTasks)
  const [acceptedTasks, setAcceptedTasks] = useState(TASKER_DASHBOARD_MOCK.acceptedTasks)

  const wp = user?.workerProfile || null
  const serviceDistricts = wp?.serviceDistricts || []

  const handleSelectSidebarMenu = (menuId) => {
    if (menuId === 'profile_services') {
      onNavigate?.('tasker-profile', { isOwnerView: true })
      return
    }
    setActiveMenu(menuId)
  }

  const persistDistricts = async (nextDistricts) => {
    if (!token) return
    try {
      const updated = await updateWorkerProfileApi(token, {
        description: wp?.description ?? '',
        skillIds: (wp?.skills || []).map((s) => s.skillId),
        serviceDistricts: nextDistricts,
      })
      updateUser(updated)
    } catch (err) {
      alert(err.message || 'Không thể lưu khu vực hoạt động.')
    }
  }

  const handleAddDistrict = async (newDist) => {
    if (serviceDistricts.some((d) => d.districtCode === newDist.districtCode)) return
    await persistDistricts([...serviceDistricts, newDist])
  }

  const handleRemoveDistrict = async (districtCode) => {
    await persistDistricts(serviceDistricts.filter((d) => d.districtCode !== districtCode))
  }

  const handleAcceptTask = (task) => {
    setAvailableTasks((prev) => prev.filter((t) => t.id !== task.id))
    setAcceptedTasks((prev) => [
      {
        id: task.id,
        title: task.title,
        category: task.category,
        address: task.address,
        scheduledTime: task.scheduledTime,
        offeredPrice: task.offeredPrice,
        clientName: task.clientName,
        clientPhone: '0987 654 321',
        status: 'ACCEPTED',
      },
      ...prev,
    ])
  }

  const handleDeclineTask = (taskId) => {
    setAvailableTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const handleCompleteTask = (taskId) => {
    setAcceptedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED' } : t))
    )
  }

  const formatVND = (amount) => {
    if (typeof amount === 'string') return amount
    return Number(amount || 0).toLocaleString('vi-VN') + '₫'
  }

  const displayName = user?.name || 'Nguyễn Anh Tuấn'
  const { upcomingSchedule, recentMessages, escrowSummary } = TASKER_DASHBOARD_MOCK

  return (
    <TaskerLayout
      activeMenu={activeMenu}
      onSelectMenu={handleSelectSidebarMenu}
      isOnline={isOnline}
      onToggleOnline={() => setIsOnline(!isOnline)}
      onNavigate={onNavigate}
      title="Bảng điều khiển Thợ"
    >
      {/* Welcome Hero Banner */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {/* Trust Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-extrabold">
              <Icon name="military_tech" size={16} className="text-amber-700" />
              Elite Tasker • Bạch Kim
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/50 text-primary text-xs font-bold">
              <Icon name="bolt" size={15} />
              Phản hồi 99% (&lt; 5 phút)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-semibold border border-surface-variant/40">
              <Icon name="verified_user" size={15} className="text-primary" />
              Đã xác minh CCCD &amp; Chứng chỉ nghề
            </span>
          </div>

          {/* Greeting */}
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Xin chào, {displayName} 👋
          </h2>
          <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
            {serviceDistricts.length > 0 ? (
              <>
                Bạn đang mở nhận việc tại{' '}
                <span className="text-on-surface font-semibold">
                  {serviceDistricts.map((d) => d.districtName).join(', ')}
                </span>
                . Khách hàng trong khu vực có thể chủ động gửi đặt hẹn trực tiếp.
              </>
            ) : (
              <>
                Bạn chưa đăng ký Quận/Huyện hoạt động nào. Hãy bổ sung khu vực hoạt động hoặc cập nhật mục{' '}
                <strong className="text-primary">Hồ sơ &amp; Dịch vụ</strong> để bắt đầu nhận việc.
              </>
            )}
          </p>
        </div>

        {/* Right Quick Control Box */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-surface-container-low/70 p-3.5 rounded-2xl border border-surface-variant/40 shrink-0">
          <div className="flex items-center gap-3 pr-3 border-r border-surface-variant/40">
            <div className="text-xs leading-snug max-w-[110px]">
              <p className="font-bold text-on-surface">
                {isOnline ? 'Đang mở nhận việc trực tiếp' : 'Đang tạm dừng nhận việc'}
              </p>
              <p className="text-[11px] text-primary font-semibold truncate">
                • {serviceDistricts[0]?.districtName || 'Chưa chọn quận'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isOnline ? 'bg-primary' : 'bg-outline-variant'
              }`}
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
            icon="visibility"
            onClick={() => onNavigate && onNavigate('tasker-profile', { isOwnerView: true })}
            className="rounded-xl text-xs font-bold bg-surface-container-lowest"
          >
            Hồ sơ &amp; Dịch vụ
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon="calendar_month"
            onClick={() => setActiveMenu('requests')}
            className="rounded-xl text-xs font-bold"
          >
            Lịch bận
          </Button>
        </div>
      </section>

      {/* 4 Summary Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TASKER_DASHBOARD_MOCK.stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-variant/30 flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
          >
            <div className="space-y-1.5">
              <span className="font-label-sm text-xs font-semibold text-on-surface-variant block">
                {stat.label}
              </span>
              <div className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                {stat.value}
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

      {/* Collapsible / Quick Bar: Yêu cầu & Offer mới */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-variant/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Icon name="mark_email_unread" size={18} />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                Yêu cầu &amp; Offer mới
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                ({availableTasks.length})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOffersExpanded(!isOffersExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline cursor-pointer"
          >
            <span>{isOffersExpanded ? 'Thu gọn danh sách' : 'Xem tất cả yêu cầu'}</span>
            <Icon name={isOffersExpanded ? 'expand_less' : 'arrow_forward'} size={16} />
          </button>
        </div>

        {(isOffersExpanded || activeMenu === 'requests') && (
          <div className="mt-4 pt-4 border-t border-surface-variant/30 space-y-3">
            {availableTasks.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">
                Hiện không còn yêu cầu mới nào đang chờ duyệt.
              </p>
            ) : (
              availableTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-surface-container-low/60 rounded-2xl p-4 border border-surface-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="primary" size="sm">
                        {task.category}
                      </Badge>
                      {task.urgent && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
                          Cần gấp
                        </span>
                      )}
                      <span className="text-xs text-outline font-semibold">
                        Mã #{task.id} • {task.postedAgo}
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-base font-extrabold text-on-surface">
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="location_on" size={15} className="text-primary" />
                        {task.address} ({task.distance})
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="schedule" size={15} className="text-primary" />
                        {task.scheduledTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right mr-2">
                      <span className="text-[11px] text-outline block">Thù lao đề xuất</span>
                      <span className="font-headline-sm text-base font-extrabold text-primary">
                        {formatVND(task.offeredPrice)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeclineTask(task.id)}
                      className="rounded-xl text-xs"
                    >
                      Từ chối
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon="check_circle"
                      onClick={() => handleAcceptTask(task)}
                      className="rounded-xl text-xs"
                    >
                      Nhận việc
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Two-Column Grid: Lịch hẹn tiếp theo (Left) & Tin nhắn gần đây (Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
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
                  <p className="text-xs text-on-surface-variant">Sắp diễn ra hôm nay</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary-fixed/60 text-primary text-xs font-extrabold">
                {upcomingSchedule.status}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low/70 border border-surface-variant/30">
              <div className="flex items-center gap-3">
                <img
                  src={upcomingSchedule.clientAvatar}
                  alt={upcomingSchedule.clientName}
                  className="w-11 h-11 rounded-full object-cover border border-primary/20"
                />
                <div>
                  <h4 className="font-label-md text-sm font-extrabold text-on-surface">
                    {upcomingSchedule.clientName}
                  </h4>
                  <p className="text-xs text-primary font-semibold">
                    Đơn {upcomingSchedule.id} • {upcomingSchedule.escrowStatus}
                  </p>
                </div>
              </div>
              <span className="font-headline-sm text-base font-extrabold text-primary">
                {formatVND(upcomingSchedule.price)}
              </span>
            </div>

            <div className="space-y-2.5 bg-surface-container-low/40 p-4 rounded-2xl border border-surface-variant/30">
              <h5 className="font-headline-sm text-sm font-extrabold text-on-surface">
                {upcomingSchedule.title}
              </h5>
              <div className="space-y-1.5 text-xs text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <Icon name="event" size={16} className="text-primary" />
                  <span>{upcomingSchedule.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="location_on" size={16} className="text-primary" />
                  <span>{upcomingSchedule.address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              icon="check"
              onClick={() => handleCompleteTask('TM-89250')}
              className="flex-1 rounded-xl justify-center py-2.5 text-xs font-bold"
            >
              Bắt đầu / Nghiệm thu
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="call"
              onClick={() => alert('Đang kết nối cuộc gọi tới khách hàng Phạm Quang Huy...')}
              className="rounded-xl py-2.5 text-xs font-bold"
            >
              Gọi khách
            </Button>
          </div>
        </div>

        <div className="lg:col-span-6 bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/30 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Icon name="forum" size={20} />
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-extrabold text-on-surface">
                    Tin nhắn gần đây
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Phản hồi nhanh để nhận đơn nhanh hơn
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-extrabold">
                2 chưa đọc
              </span>
            </div>

            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-2xl bg-surface-container-low/60 hover:bg-surface-container-low border border-surface-variant/30 flex items-start justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={msg.avatar}
                        alt={msg.senderName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {msg.unread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-label-md text-sm font-extrabold text-on-surface truncate">
                        {msg.senderName}
                      </h4>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {msg.preview}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-outline font-semibold shrink-0">
                    {msg.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => setActiveMenu('messages')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline cursor-pointer"
            >
              <span>Mở hộp thư tin nhắn</span>
              <Icon name="arrow_forward" size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Row: Ví Thu nhập & Escrow + Biến động số dư */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
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
              An toàn 100%
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-primary-fixed/25 border border-primary/20">
              <span className="text-xs text-on-surface-variant font-semibold block">
                Số dư khả dụng (Rút ngay)
              </span>
              <div className="font-headline-md text-2xl font-extrabold text-primary mt-1">
                {escrowSummary.availableBalance}
              </div>
              <span className="text-[11px] text-primary font-semibold mt-1 block">
                • Đã sẵn sàng rút về ngân hàng
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80">
              <span className="text-xs text-amber-900 font-semibold block">
                Escrow đang tạm giữ an toàn
              </span>
              <div className="font-headline-md text-2xl font-extrabold text-amber-900 mt-1">
                {escrowSummary.escrowHold}
              </div>
              <span className="text-[11px] text-amber-800 font-medium mt-1 block">
                • Chờ nghiệm thu 2 công việc
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-outline">
              Liên kết: <strong>Vietcombank •••• 8829</strong>
            </span>
            <Button variant="primary" size="sm" icon="payments" className="rounded-xl text-xs">
              Rút tiền nhanh
            </Button>
          </div>
        </div>

        <div className="lg:col-span-6 bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/30 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-base font-extrabold text-on-surface">
                Biến động số dư mới nhất
              </h3>
              <p className="text-xs text-on-surface-variant">
                Tách bạch rõ ràng giữa Đã vào ví và Escrow tạm giữ
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold">
              Rút tiền nhanh
            </span>
          </div>

          <div className="space-y-2.5">
            {escrowSummary.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-surface-variant/30 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.type === 'released'
                        ? 'bg-primary-fixed/60 text-primary'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Icon
                      name={tx.type === 'released' ? 'south_west' : 'hourglass_top'}
                      size={18}
                    />
                  </div>
                  <div>
                    <h4 className="font-label-md text-xs sm:text-sm font-extrabold text-on-surface">
                      {tx.title}{' '}
                      <span className="text-primary font-extrabold">{tx.amount}</span>
                    </h4>
                    <p className="text-[11px] text-outline">{tx.date}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shrink-0 ${
                    tx.type === 'released'
                      ? 'bg-primary-fixed/60 text-primary'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-District Coverage Section (Reuses shared DistrictMultiSelector) */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/30 space-y-5">
        <div>
          <h3 className="font-headline-sm text-base font-extrabold text-on-surface flex items-center gap-2">
            <Icon name="map" size={20} className="text-primary" />
            <span>Khu vực nhận việc của bạn ({serviceDistricts.length} Quận/Huyện)</span>
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Đăng ký nhiều Quận/Huyện hoạt động để hệ thống tự động gợi ý các công việc gần bạn nhất.
          </p>
        </div>

        <DistrictMultiSelector
          districts={serviceDistricts}
          onAddDistrict={handleAddDistrict}
          onRemoveDistrict={handleRemoveDistrict}
        />

        {acceptedTasks.length > 0 && (
          <div className="pt-3 border-t border-surface-variant/30">
            <p className="text-xs font-bold text-on-surface-variant mb-2">
              Danh sách việc đã nhận ({acceptedTasks.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {acceptedTasks.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface border border-surface-variant/40"
                >
                  <Icon
                    name={t.status === 'COMPLETED' ? 'verified' : 'pending_actions'}
                    size={14}
                    className="text-primary"
                  />
                  <span>{t.title}</span>
                  <span className="text-primary font-bold">({formatVND(t.offeredPrice)})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </TaskerLayout>
  )
}
