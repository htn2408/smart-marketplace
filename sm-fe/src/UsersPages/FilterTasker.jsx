import { useState, useEffect, useMemo } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Icon from '../components/common/Icon'
import Badge from '../components/common/Badge'
import { ROUTES } from '../routes/paths'
import { FILTER_TASKERS_MOCK } from '../constants/mockData'
import { filterTaskersByTaskId } from '../services/taskService'
import { DEFAULT_AVATAR } from '../assets/constants'

/**
 * FilterTasker Page (Bước 2: Xem đề xuất từ thợ)
 * - Chuẩn hoá theo rule.md (dùng chung Header, Footer, Icon, Badge, constants & taskService).
 * - Bắt buộc đi qua từ trang TaskDetail (/task-detail). Nếu người dùng tự ý truy cập trực tiếp
 *   route này mà không có dữ liệu từ bước 1 (location.state?.fromTaskDetail), tự động điều hướng về /task-detail.
 */
export default function FilterTasker({ onNavigate }) {
  const location = useLocation()
  const taskData = location.state?.taskData || null
  const isFromTaskDetail = Boolean(location.state?.fromTaskDetail || taskData)

  const [sortBy, setSortBy] = useState('match')
  const [apiTaskers, setApiTaskers] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(location.state?.taskData?.id))
  const [apiError, setApiError] = useState('')
  const [hasNoResults, setHasNoResults] = useState(false)
  const [selectedOfferTasker, setSelectedOfferTasker] = useState(null)
  const [retryToken, setRetryToken] = useState(0)

  // Nếu có taskId thực tế từ Backend thì gọi API lọc & chấm điểm Tasker
  useEffect(() => {
    if (!taskData?.id) return
    const controller = new AbortController()

    filterTaskersByTaskId(taskData.id, { signal: controller.signal })
      .then((res) => {
        const results = Array.isArray(res?.results) ? res.results : []
        if (results.length === 0) {
          setHasNoResults(true)
          setApiTaskers([])
          return
        }
        const mapped = results.map((item, idx) => {
            const c = item.candidate
            const scorePercent = Math.round((item.matchingScore || 0) * 100)
            return {
              id: c.id || c.userId,
              userId: c.userId,
              name: c.name,
              avatar: DEFAULT_AVATAR,
              onlineText: c.status === 'ONLINE' ? 'Đang online' : 'Tạm nghỉ',
              isOnline: c.status === 'ONLINE',
              badge: idx === 0 ? 'Elite Tasker' : 'Đối tác uy tín',
              badgeIcon: idx === 0 ? 'workspace_premium' : 'verified',
              badgeStyle: idx === 0 ? 'gold' : 'primary',
              subtitle:
                c.skills?.length > 0
                  ? `Chuyên môn: ${c.skills.map((s) => s.name).join(', ')}`
                  : 'Thợ chuyên nghiệp tại TaskMate',
              matchScore: scorePercent,
              matchHighlight: `★ ${Number(c.rating || 5).toFixed(1)} • Đã hoàn thành ${c.completedTasks || 0} công việc`,
              rating: Number(c.rating || 5),
              reviewsCount: Math.max(c.completedTasks || 1, 1),
              completedTasks: c.completedTasks || 0,
              completionRate: 'Tỉ lệ xong việc 100%',
              bio:
                c.description ||
                'Đối tác Tasker đã xác minh danh tính CCCD gắn chip, cam kết đúng giờ và đảm bảo chất lượng thi công.',
              skills:
                c.skills?.length > 0
                  ? c.skills.map((s) => s.name)
                  : ['Đúng giờ 100%', 'Bảo hành 30 ngày'],
              isTopRecommendation: idx === 0,
            }
          })
          setApiTaskers(mapped)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setApiError(err.message || 'Không thể kết nối máy chủ.')
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [taskData?.id, retryToken])

  const baseTaskers = apiTaskers && apiTaskers.length > 0 ? apiTaskers : FILTER_TASKERS_MOCK

  // Nút thử lại: reset trạng thái rồi bump token để effect chạy lại
  const handleRetry = () => {
    setIsLoading(true)
    setApiError('')
    setHasNoResults(false)
    setApiTaskers(null)
    setRetryToken((t) => t + 1)
  }

  const sortedTaskers = useMemo(() => {
    const list = [...baseTaskers]
    if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating || b.matchScore - a.matchScore)
    } else if (sortBy === 'completed') {
      list.sort((a, b) => b.completedTasks - a.completedTasks || b.matchScore - a.matchScore)
    } else {
      list.sort((a, b) => b.matchScore - a.matchScore)
    }
    return list
  }, [baseTaskers, sortBy])

  // Bắt buộc phải đi qua từ trang task-detail, nếu tự ý nhấn route thì chuyển về /task-detail
  if (!isFromTaskDetail) {
    return <Navigate to={ROUTES.TASK_DETAIL} replace />
  }

  const title =
    taskData?.title || 'Lắp quạt trần Panasonic 5 cánh & đi đường điện nổi'
  const categoryName = taskData?.categoryName || 'Điện & Gia dụng'
  const requestCode = taskData?.requestCode || '#TM-84920'
  const scheduledText = taskData?.scheduledText || 'Thứ Tư, 14/10/2026 • 09:00'
  const fullAddress =
    taskData?.fullAddress || 'Phường Dịch Vọng Hậu, Cầu Giấy, Hà Nội'
  const areaLabel =
    taskData?.district || taskData?.province || 'Dịch Vọng Hậu, Cầu Giấy'
  const offeredPrice = Number(taskData?.offeredPrice || 250000)
  const formattedPrice = `${offeredPrice.toLocaleString('vi-VN')}₫`

  const handleEditRequest = () => {
    if (onNavigate) {
      onNavigate('task-detail', {
        selectedTask: {
          title: taskData?.title,
          categoryName: taskData?.categoryName,
          suggestedPrice: offeredPrice,
        },
        taskDraft: taskData,
      })
    }
  }

  const handleViewProfile = (tasker) => {
    if (!onNavigate) return
    // Tasker thật từ API: mở /profile/:userId để fetch hồ sơ thật từ DB.
    // Tasker mẫu (mock) không có userId — giữ hành vi cũ.
    if (tasker.userId) {
      onNavigate(`/tasker/${tasker.userId}`, { isOwnerView: false, tasker })
    } else {
      onNavigate('tasker-profile', { isOwnerView: false, tasker })
    }
  }

  const handleQuickChat = (tasker) => {
    alert(`Đang mở cửa sổ chat nhanh với Tasker ${tasker.name}...`)
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Global Header */}
      <Header activePath="task-detail" onNavigate={onNavigate} />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* Progress & Page Header Bar (Đồng bộ với TaskDetail, in đậm xanh bước 2: Xem đề xuất từ thợ) */}
        <section className="w-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(13,112,84,0.04)] border-b border-surface-variant/30">
          <div className="max-w-[1240px] mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="primary" icon="add_task">
                    Tạo yêu cầu dịch vụ
                  </Badge>
                  <span className="text-outline-variant font-body-sm text-body-sm">•</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Không mất phí đăng tin • Đảm bảo giá minh bạch
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
                  Đăng việc &amp; Đề xuất thù lao
                </h1>
              </div>

              {/* Steps Breadcrumb */}
              <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-xl">
                <button
                  type="button"
                  onClick={handleEditRequest}
                  className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                    <Icon name="check" size={15} />
                  </span>
                  <span className="font-label-md text-label-md font-semibold">
                    Chi tiết công việc
                  </span>
                </button>
                <Icon name="chevron_right" size={18} className="text-outline-variant" />
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shadow-sm">
                    2
                  </span>
                  <span className="font-label-md text-label-md text-primary font-extrabold">
                    Xem đề xuất từ thợ
                  </span>
                </div>
                <Icon name="chevron_right" size={18} className="text-outline-variant" />
                <div className="flex items-center gap-2 text-on-surface-variant opacity-60">
                  <span className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-sm text-label-sm font-semibold">
                    3
                  </span>
                  <span className="font-label-md text-label-md">Xác nhận &amp; Nghiệm thu</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Order Summary Bar (Pinned overview of customer request) */}
        <section className="w-full bg-surface-container-lowest shadow-sm border-b border-surface-variant/20">
          <div className="max-w-[1240px] mx-auto px-6 py-5">
            <div className="rounded-xl bg-surface-container p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Job Title and Location */}
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
                    <Icon name="electric_bolt" size={15} />
                    <span>{categoryName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-caption text-caption">
                    Mã yêu cầu:{' '}
                    <span className="font-mono font-semibold text-on-surface">
                      {requestCode}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary font-caption text-caption font-medium">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span>Đang nhận đề xuất trực tiếp</span>
                  </span>
                </div>

                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  {title}
                </h2>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <Icon name="calendar_today" size={17} className="text-primary" />
                    <span>{scheduledText}</span>
                  </div>
                  <span className="text-outline-variant hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <Icon name="location_on" size={18} className="text-primary" />
                    <span>{fullAddress}</span>
                  </div>
                </div>
              </div>

              {/* Budget & Escrow & Edit Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-4 w-full lg:w-auto shrink-0 pt-3 lg:pt-0">
                <div className="flex flex-col items-start lg:items-end">
                  <span className="font-caption text-caption text-on-surface-variant">
                    Thù lao bạn đề xuất
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-headline-lg text-headline-lg font-black text-primary">
                      {formattedPrice}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      /trọn gói
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded-full bg-primary-fixed/20 text-on-primary-fixed-variant font-label-sm text-[11px] font-semibold">
                    <Icon name="shield" size={13} filled={true} className="text-primary" />
                    <span>Đang giữ ký quỹ Escrow an toàn</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEditRequest}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors font-label-sm text-label-sm font-semibold shadow-sm cursor-pointer"
                >
                  <Icon name="edit" size={16} />
                  <span>Chỉnh sửa yêu cầu</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Main Workspace (Filters + Matching Cards + Algorithm Sidebar) */}
        <div className="w-full max-w-[1240px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left / Primary Column: Filtering controls & List of Taskers (8 cols) */}
            <section className="lg:col-span-8 flex flex-col gap-6">
              {/* Controls Toolbar (Search Count & Sort) */}
              <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm flex flex-col gap-4 border border-surface-variant/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Icon name="radar" size={22} className="text-primary" />
                    <div>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Tìm thấy{' '}
                        <span className="text-primary font-black">
                          {hasNoResults ? 0 : sortedTaskers.length} Thợ phù hợp
                        </span>
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant block">
                        đang mở nhận việc tại khu vực {areaLabel}
                      </span>
                    </div>
                  </div>

                  {/* Sorting Dropdown / Select */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="sort-select"
                      className="font-caption text-caption text-on-surface-variant whitespace-nowrap"
                    >
                      Sắp xếp:
                    </label>
                    <div className="relative">
                      <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none font-label-sm text-label-sm font-semibold text-on-surface bg-surface-container-low pl-3 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="match">Điểm phù hợp cao nhất (Khuyên dùng)</option>
                        <option value="rating">Đánh giá cao nhất (⭐)</option>
                        <option value="completed">Hoàn thành nhiều việc nhất</option>
                      </select>
                      <Icon
                        name="expand_more"
                        size={18}
                        className="pointer-events-none absolute right-2 top-2.5 text-on-surface-variant"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasker List Container */}
              <div className="flex flex-col gap-5">
                {isLoading ? (
                  <div className="rounded-xl bg-surface-container-lowest p-12 shadow-sm border border-surface-variant/30 flex flex-col items-center justify-center gap-3">
                    <Icon
                      name="progress_activity"
                      size={36}
                      className="text-primary animate-spin"
                    />
                    <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
                      Đang quét thợ online phù hợp với yêu cầu của bạn...
                    </span>
                  </div>
                ) : hasNoResults ? (
                  <div className="rounded-xl bg-surface-container-lowest p-12 shadow-sm border border-surface-variant/30 flex flex-col items-center justify-center gap-3 text-center">
                    <span className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                      <Icon name="search_off" size={32} className="text-on-surface-variant" />
                    </span>
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                      Chưa có thợ phù hợp trong khu vực này
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                      Các thợ đúng kỹ năng tại {areaLabel} hiện đang bận lịch vào khung giờ này.
                      Bạn có thể thử lại sau hoặc điều chỉnh thời gian làm việc.
                    </p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="mt-1 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
                    >
                      Thử quét lại
                    </button>
                  </div>
                ) : (
                  <>
                    {apiError && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary-fixed/60 text-on-surface font-label-sm text-label-sm font-semibold border border-outline-variant/40">
                        <Icon name="wifi_off" size={18} className="shrink-0 mt-0.5 text-error" />
                        <span>
                          Không lấy được danh sách từ máy chủ ({apiError}) — đang hiển thị danh sách
                          mẫu minh hoạ.
                        </span>
                      </div>
                    )}
                    {sortedTaskers.map((tasker, index) => {
                  const showBestRibbon = index === 0 && tasker.isTopRecommendation
                  return (
                    <article
                      key={tasker.id}
                      className="relative rounded-xl bg-surface-container-lowest p-6 shadow-sm hover:shadow-md transition-shadow border border-surface-variant/30"
                    >
                      {/* Best Match Ribbon Tag */}
                      {showBestRibbon && (
                        <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-label-sm text-[11px] font-bold shadow-sm">
                          <Icon name="stars" size={13} filled={true} />
                          <span>ĐỀ XUẤT TỐI ƯU NHẤT CHO YÊU CẦU NÀY</span>
                        </div>
                      )}

                      <div
                        className={`grid grid-cols-1 md:grid-cols-12 gap-5 items-start ${
                          showBestRibbon ? 'pt-1' : ''
                        }`}
                      >
                        {/* Left: Avatar & Verification Badges */}
                        <div className="md:col-span-2 flex flex-col items-center text-center">
                          <div className="relative">
                            <img
                              src={tasker.avatar || DEFAULT_AVATAR}
                              alt={tasker.name}
                              className={`w-20 h-20 rounded-full object-cover shadow-sm ${
                                showBestRibbon
                                  ? 'ring-4 ring-primary-fixed/40'
                                  : 'ring-2 ring-primary/20'
                              }`}
                            />
                            <span
                              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm"
                              title="Đã xác minh danh tính"
                            >
                              <Icon name="verified" size={13} filled={true} />
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded-full bg-surface-container font-caption text-[11px] text-on-surface-variant">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                tasker.isOnline ? 'bg-primary' : 'bg-secondary-fixed-dim'
                              }`}
                            />
                            <span>{tasker.onlineText}</span>
                          </span>
                        </div>

                        {/* Center: Details, Algorithm Match & Bio */}
                        <div className="md:col-span-6 flex flex-col gap-2.5">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                onClick={() => handleViewProfile(tasker)}
                                className="font-headline-md text-headline-md font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
                              >
                                {tasker.name}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold ${
                                  tasker.badgeStyle === 'gold'
                                    ? 'bg-secondary-fixed text-on-secondary-fixed'
                                    : tasker.badgeStyle === 'primary'
                                    ? 'bg-primary-fixed/50 text-on-primary-fixed-variant'
                                    : 'bg-surface-container-high text-on-surface font-semibold'
                                }`}
                              >
                                <Icon
                                  name={tasker.badgeIcon || 'workspace_premium'}
                                  size={13}
                                  filled={tasker.badgeStyle === 'gold'}
                                  className={
                                    tasker.badgeStyle === 'neutral' ? 'text-primary' : ''
                                  }
                                />
                                <span>{tasker.badge}</span>
                              </span>
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                              {tasker.subtitle}
                            </p>
                          </div>

                          {/* ALGORITHM MATCHING SCORE PILL */}
                          <div
                            className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg ${
                              showBestRibbon ? 'bg-primary-fixed/20' : 'bg-surface-container'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`inline-flex items-center justify-center px-2 py-1 rounded-md font-headline-sm text-[15px] font-black leading-none ${
                                  showBestRibbon
                                    ? 'bg-primary text-on-primary'
                                    : tasker.matchScore >= 95
                                    ? 'bg-primary-container text-on-primary-container'
                                    : 'bg-surface-container-highest text-on-surface'
                                }`}
                              >
                                {tasker.matchScore}%
                              </div>
                              <span
                                className={`font-label-sm text-label-sm font-bold ${
                                  tasker.matchScore >= 95 ? 'text-primary' : 'text-on-surface'
                                }`}
                              >
                                Phù hợp
                              </span>
                            </div>
                            <span
                              className={`font-caption text-caption ${
                                showBestRibbon
                                  ? 'text-on-primary-fixed-variant'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {tasker.matchHighlight}
                            </span>
                          </div>

                          {/* Ratings & Completed count */}
                          <div className="flex flex-wrap items-center gap-3 font-body-sm text-body-sm">
                            <div className="flex items-center gap-1 font-semibold text-on-surface">
                              <Icon
                                name="star"
                                size={18}
                                filled={true}
                                className="text-secondary"
                              />
                              <span>{tasker.rating}</span>
                              <span className="font-normal text-on-surface-variant">
                                ({tasker.reviewsCount} đánh giá)
                              </span>
                            </div>
                            <span className="text-outline-variant">•</span>
                            <div className="flex items-center gap-1 text-on-surface font-medium">
                              <Icon name="task_alt" size={17} className="text-primary" />
                              <span>Đã hoàn thành {tasker.completedTasks} việc</span>
                            </div>
                            {tasker.completionRate && (
                              <>
                                <span className="text-outline-variant">•</span>
                                <span className="font-label-sm text-[12px] text-primary font-semibold">
                                  {tasker.completionRate}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Short Bio */}
                          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">
                            &ldquo;{tasker.bio}&rdquo;
                          </p>

                          {/* Skill Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {tasker.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded-md bg-surface-container font-label-sm text-[11px] ${
                                  skill.includes('Bảo hành')
                                    ? 'text-primary font-semibold'
                                    : 'text-on-surface-variant'
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Right: Price Offer & Action Column */}
                        <div className="md:col-span-4 flex flex-col items-stretch h-full pt-2 md:pt-0 justify-center">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedOfferTasker(tasker)}
                              className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-label-md text-label-md font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>Gửi lời mời &amp; Offer</span>
                              <Icon name="send" size={18} />
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewProfile(tasker)}
                                className="py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Icon name="person" size={16} />
                                <span>Hồ sơ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickChat(tasker)}
                                className="py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Icon name="chat" size={16} />
                                <span>Chat nhanh</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
                  </>
                )}
              </div>

              {/* Pagination / Load more */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Hiển thị {sortedTaskers.length} trong tổng số {sortedTaskers.length} thợ phù hợp
                </span>
                <button
                  type="button"
                  onClick={() => alert('Hệ thống đã hiển thị toàn bộ thợ phù hợp nhất trong khu vực.')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  <span>Xem thêm thợ khác gần bạn</span>
                  <Icon name="expand_more" size={18} />
                </button>
              </div>
            </section>

            {/* Right Column: Algorithm Breakdown & Escrow Trust Guarantee (4 cols) */}
            <aside className="lg:col-span-4 flex flex-col gap-6 sticky top-28">
              {/* Widget 1: How the TaskMate Matching Algorithm Works */}
              <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4 border border-surface-variant/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
                    <Icon name="psychology" size={20} />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Thuật toán Smart Match
                    </h3>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Cách TaskMate tính điểm phù hợp
                    </span>
                  </div>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Hệ thống lọc cứng các thợ đang mở nhận việc tại đúng Quận/Huyện của bạn, sau đó tính điểm phù hợp dựa trên Đánh giá (Rating sao ★) và Lịch sử hoàn thành công việc:
                </p>

                <div className="flex flex-col gap-3.5 pt-1">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container">
                    <Icon
                      name="star"
                      size={22}
                      filled={true}
                      className="text-secondary shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="font-label-md text-label-md font-bold text-on-surface block">
                        Đánh giá sao (60%) &amp; Kinh nghiệm (40%)
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant block mt-1">
                        Ưu tiên các thợ có đánh giá cao (từ 4.7★ - 5.0★), nhận được nhiều phản hồi tích cực từ cộng đồng và số lượng công việc hoàn thành xuất sắc.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-container font-caption text-caption text-on-surface-variant flex items-center gap-2">
                  <Icon name="verified_user" size={18} className="text-primary shrink-0" />
                  <span>100% thợ đều đã đối soát CCCD gắn chip và test tay nghề kỹ thuật.</span>
                </div>
              </div>

              {/* Widget 2: TaskMate Happiness & Escrow Guarantee */}
              <div className="rounded-xl bg-primary text-on-primary p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-on-primary/5 pointer-events-none" />
                <div className="flex items-center gap-3">
                  <Icon
                    name="shield_with_heart"
                    size={28}
                    filled={true}
                    className="text-secondary-container"
                  />
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-primary">
                      Cam Kết TaskMate An Tâm
                    </h3>
                    <span className="font-caption text-caption text-on-primary-container">
                      Bảo vệ quyền lợi khách hàng 100%
                    </span>
                  </div>
                </div>

                <ul className="flex flex-col gap-2.5 font-body-sm text-body-sm text-on-primary/90">
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check_circle"
                      size={18}
                      filled={true}
                      className="text-secondary-container shrink-0 mt-0.5"
                    />
                    <span>
                      <strong>Ký quỹ Escrow an toàn:</strong> Tiền {formattedPrice} chỉ chuyển cho Tasker khi bạn đã kiểm tra và bấm nghiệm thu hài lòng.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check_circle"
                      size={18}
                      filled={true}
                      className="text-secondary-container shrink-0 mt-0.5"
                    />
                    <span>
                      <strong>Bảo hiểm trách nhiệm:</strong> Bồi thường thiệt hại tài sản lên đến 20.000.000₫ nếu xảy ra sự cố kỹ thuật trong quá trình lắp đặt.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check_circle"
                      size={18}
                      filled={true}
                      className="text-secondary-container shrink-0 mt-0.5"
                    />
                    <span>
                      <strong>Bảo hành 30 ngày:</strong> Hỗ trợ gọi thợ kiểm tra miễn phí nếu phát sinh lỗi kỹ thuật sau thi công.
                    </span>
                  </li>
                </ul>

                <div className="pt-2">
                  <a
                    href="#policy"
                    onClick={(e) => {
                      e.preventDefault()
                      if (onNavigate) onNavigate('services')
                    }}
                    className="inline-flex items-center gap-1.5 font-label-sm text-label-sm font-bold text-secondary-container hover:underline"
                  >
                    <span>Tìm hiểu thêm về chính sách bảo hiểm</span>
                    <Icon name="arrow_forward" size={16} />
                  </a>
                </div>
              </div>

              {/* Widget 3: Quick Need-Help Assistance */}
              <div className="rounded-xl bg-surface-container p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Icon name="support_agent" size={24} className="text-on-surface-variant" />
                  <div>
                    <span className="font-label-md text-label-md font-bold text-on-surface block">
                      Cần tư vấn chọn thợ?
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Tổng đài hỗ trợ 24/7 hoàn toàn miễn phí
                    </span>
                  </div>
                </div>
                <a
                  href="tel:19006868"
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold shadow-sm transition-colors"
                >
                  Gọi ngay
                </a>
              </div>
            </aside>
          </div>
        </div>

        {/* Interactive Offer Confirmation Modal */}
        {selectedOfferTasker && (
          <div
            onClick={() => setSelectedOfferTasker(null)}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl bg-surface-container-lowest max-w-md w-full p-6 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Icon name="check_circle" size={26} filled={true} />
                  <span className="font-headline-sm text-headline-sm font-bold">
                    Đã gửi lời mời &amp; Offer!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOfferTasker(null)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Yêu cầu của bạn và mức thù lao{' '}
                <span className="font-bold text-on-surface">{formattedPrice}</span> đã được gửi trực tiếp tới Tasker{' '}
                <strong className="text-primary">{selectedOfferTasker.name}</strong>. Tasker sẽ phản hồi và xác nhận lịch hẹn trong ít phút.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOfferTasker(null)}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Xem tiến độ yêu cầu
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  )
}