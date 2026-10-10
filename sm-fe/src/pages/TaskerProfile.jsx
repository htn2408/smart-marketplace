import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Icon from '../components/common/Icon'
import TaskerHeader from '../components/profile/TaskerHeader'
import AboutTasker from '../components/profile/AboutTasker'
import ServicesRates from '../components/profile/ServicesRates'
import WorkGallery from '../components/profile/WorkGallery'
import ServiceArea from '../components/profile/ServiceArea'
import ReviewsList from '../components/profile/ReviewsList'
import BookingSidebar from '../components/profile/BookingSidebar'

/**
 * TaskMate TaskerProfile - Standardized JSX Component
 */
export default function TaskerProfile({ onNavigate }) {
  const tasker = {
    name: 'Nguyễn Anh Tuấn',
    avatar: '/images/avatars/nguyen-anh-tuan.jpg',
    profession: 'Chuyên gia Lắp ráp Nội thất & Kỹ thuật Nhà ở Tiện ích',
    rating: 4.98,
    reviewsCount: 324,
    completedTasks: 540,
    responseRate: '99%',
    responseTime: '< 5 phút',
  }

  const handleMessage = () => {
    alert(`Mở cửa sổ chat với ${tasker.name}`)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Hồ sơ Tasker ${tasker.name}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard?.writeText(window.location.href)
      alert('Đã sao chép liên kết hồ sơ vào khay nhớ tạm!')
    }
  }

  const handleSelectService = (service) => {
    alert(`Đã chọn dịch vụ: ${service.title}. Hãy gửi đề xuất giá ở cột bên phải!`)
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Global Header */}
      <Header activePath="profile" onNavigate={onNavigate} />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* Top Ambient Trust Banner */}
        <div className="w-full bg-surface-container-high py-2.5 px-6 border-b border-surface-variant/30">
          <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-4">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 font-caption text-caption text-on-surface-variant">
              <a
                className="hover:text-primary transition-colors cursor-pointer"
                href="#home"
                onClick={(e) => {
                  e.preventDefault()
                  if (onNavigate) onNavigate('home')
                }}
              >
                Trang chủ
              </a>
              <Icon name="chevron_right" size={14} />
              <a
                className="hover:text-primary transition-colors cursor-pointer"
                href="#services"
                onClick={(e) => {
                  e.preventDefault()
                  if (onNavigate) onNavigate('search')
                }}
              >
                Thợ sửa chữa vặt gia đình
              </a>
              <Icon name="chevron_right" size={14} />
              <span className="font-medium text-on-surface">{tasker.name}</span>
            </nav>

            <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm">
              <div className="flex items-center gap-1.5 text-primary">
                <Icon name="verified_user" size={18} />
                <span>Bảo hiểm trách nhiệm thi công 20.000.000₫</span>
              </div>
              <span className="hidden sm:inline text-outline-variant">•</span>
              <div className="hidden sm:flex items-center gap-1">
                <Icon name="bolt" size={16} />
                <span>Phản hồi trung bình: 5 phút</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout Section */}
        <div className="max-w-[1240px] mx-auto w-full px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left / Main Column (Approx 68% / 8 columns) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Tasker Identity Header Card */}
              <TaskerHeader
                name={tasker.name}
                avatar={tasker.avatar}
                profession={tasker.profession}
                completedTasks={tasker.completedTasks}
                onMessage={handleMessage}
              />

              {/* About Me Section */}
              <AboutTasker taskerName={tasker.name} />

              {/* Services & Rates Section */}
              <ServicesRates />

              {/* Past Work Gallery Section */}
              <WorkGallery />

              {/* Service Area & Coverage Map Section */}
              <ServiceArea />

              {/* Verified Client Reviews & Ratings Section */}
              <ReviewsList />
            </div>

            {/* Right Column: Sticky Instant Booking Sidebar (Approx 32% / 4 columns) */}
            <BookingSidebar
              taskerName="Tuấn"
              initialRate={200000}
              onSubmitOffer={(data) => {
                alert(
                  `Đã gửi đề xuất thành công!\n- Dịch vụ: ${data.jobDetail}\n- Thời gian: ${data.selectedTimeSlot}\n- Thù lao đề xuất: ${data.packagePrice}₫`
                )
              }}
            />
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  )
}