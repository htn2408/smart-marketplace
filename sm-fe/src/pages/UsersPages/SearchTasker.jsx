import { useState } from 'react'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import StepNavigation from '../../components/search/StepNavigation'
import JobBriefCard from '../../components/search/JobBriefCard'
import TrustSidebar from '../../components/search/TrustSidebar'
import TaskerCard from '../../components/tasker/TaskerCard'
import { SEARCH_TASKERS } from '../../constants/mockData'

/**
 * TaskMate SearchTasker - Standardized JSX Component
 */
export default function SearchTasker({ onNavigate }) {
  const [selectedSort, setSelectedSort] = useState('match')
  const [activeFilterChip, setActiveFilterChip] = useState('all')

  const filterChips = [
    { id: 'all', label: 'Tất cả (6)' },
    {
      id: 'near',
      label: 'Gần bạn nhất (<3km)',
      icon: 'near_me',
      count: 3,
    },
    {
      id: 'elite',
      label: 'Elite Tasker (3)',
      icon: 'stars',
      iconFilled: true,
      iconColor: 'text-secondary-container',
    },
    {
      id: 'tools',
      label: 'Đầy đủ đồ nghề (5)',
      icon: 'handyman',
      iconColor: 'text-primary',
    },
    {
      id: 'vneid',
      label: 'Đã xác minh VNeID (6)',
      icon: 'verified_user',
      iconColor: 'text-primary-container',
    },
    {
      id: 'experience',
      label: 'Kinh nghiệm >3 năm (4)',
      icon: 'workspace_premium',
    },
  ]

  const handleSelectTasker = () => {
    if (onNavigate) {
      onNavigate('profile')
    }
  }

  const handleViewProfile = () => {
    if (onNavigate) {
      onNavigate('profile')
    }
  }

  const handleMessage = (tasker) => {
    const targetUserId = tasker.userId || tasker.id
    if (onNavigate) {
      onNavigate('messages', { targetUserId, targetName: tasker.name })
    }
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Global Header */}
      <Header activePath="search" onNavigate={onNavigate} />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* Stepper Navigation */}
        <StepNavigation currentStep={2} totalFound={SEARCH_TASKERS.length} />

        {/* Job Brief Summary */}
        <JobBriefCard
          onEdit={() => onNavigate && onNavigate('task-detail')}
          onViewDetails={() => onNavigate && onNavigate('task-detail')}
        />

        {/* Filter & Sorting Toolbelt */}
        <section className="max-w-[1240px] mx-auto px-6 py-3 w-full">
          <div className="flex flex-col gap-4">
            {/* Sort & Stats line */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest px-5 py-3.5 rounded-xl shadow-sm border border-surface-variant/30">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                  {SEARCH_TASKERS.length} Thợ phù hợp nhất gần bạn
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Sắp xếp theo thuật toán tối ưu nhất
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant shrink-0"
                  htmlFor="sort-proposals"
                >
                  Sắp xếp theo:
                </label>
                <div className="relative">
                  <select
                    id="sort-proposals"
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="appearance-none bg-surface-container-low text-on-surface font-label-md text-label-md pl-3 pr-8 py-2 rounded-lg focus:outline-none cursor-pointer border border-transparent focus:border-primary/20"
                  >
                    <option value="match">
                      Điểm tương thích TaskMate AI (Cao nhất trước)
                    </option>
                    <option value="price">Mức giá thù lao (Thấp đến cao)</option>
                    <option value="rating">Đánh giá thợ (Nhiều sao nhất)</option>
                    <option value="distance">Gần vị trí bạn nhất (&lt; 5km)</option>
                  </select>
                  <Icon
                    name="expand_more"
                    size={18}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                </div>
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {filterChips.map((chip) => {
                const isActive = activeFilterChip === chip.id
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveFilterChip(chip.id)}
                    className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {chip.icon && (
                      <Icon
                        name={chip.icon}
                        size={16}
                        filled={chip.iconFilled}
                        className={isActive ? 'text-on-primary' : chip.iconColor || 'text-primary'}
                      />
                    )}
                    <span>{chip.label}</span>
                    {chip.count && (
                      <span className="w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold flex items-center justify-center">
                        {chip.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Main Content Layout (Proposals Feed + Trust Sidebar) */}
        <div className="max-w-[1240px] mx-auto px-6 py-4 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Proposals Feed (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {SEARCH_TASKERS.map((tasker) => (
                <TaskerCard
                  key={tasker.id}
                  tasker={tasker}
                  variant="search"
                  onSelect={handleSelectTasker}
                  onViewProfile={handleViewProfile}
                  onMessage={handleMessage}
                />
              ))}

              {/* More Bids Prompt Bar */}
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left border border-surface-variant/30">
                <div className="flex items-center gap-3">
                  <Icon
                    name="forward_to_inbox"
                    size={28}
                    className="text-primary"
                  />
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">
                      Gửi lời mời cùng lúc cho nhiều thợ để nhận phản hồi nhanh nhất
                    </p>
                    <p className="font-caption text-caption text-on-surface-variant">
                      Thợ đầu tiên bấm nhận việc và thỏa thuận lịch hẹn sẽ nhận công
                      việc của bạn.
                    </p>
                  </div>
                </div>
                <Button
                  variant="white"
                  size="sm"
                  icon="refresh"
                  className="shrink-0"
                >
                  Xem thêm thợ khác
                </Button>
              </div>
            </div>

            {/* Trust & Protection Sticky Sidebar (4 Cols) */}
            <TrustSidebar />
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  )
}
