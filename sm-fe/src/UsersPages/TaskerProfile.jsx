import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import TaskerLayout from '../components/layout/TaskerLayout'
import Icon from '../components/common/Icon'
import TaskerHeader from '../components/profile/TaskerHeader'
import AboutTasker from '../components/profile/AboutTasker'
import ServicesRates from '../components/profile/ServicesRates'
import WorkGallery from '../components/profile/WorkGallery'
import ServiceArea from '../components/profile/ServiceArea'
import ReviewsList from '../components/profile/ReviewsList'
import BookingSidebar from '../components/profile/BookingSidebar'
import { useAuth } from '../hooks/useAuth'
import { updateWorkerProfileApi } from '../services/authService'
import { DEFAULT_AVATAR } from '../assets/constants'

/**
 * TaskMate TaskerProfile - Standardized JSX Component
 * Hỗ trợ 2 chế độ:
 * 1. Khách hàng xem hồ sơ Tasker: Dùng Header/Footer của Client, có đầy đủ BookingSidebar và ReviewsList.
 * 2. Tasker tự xem và cập nhật CV của mình (khi ấn từ tab "Hồ sơ & Dịch vụ"):
 *    Dùng chung TaskerLayout (Sidebar + Topbar của Tasker), ẩn BookingSidebar & ReviewsList,
 *    cho phép cập nhật Giới thiệu bản thân, Lĩnh vực chuyên môn (search & pick) và Khu vực hoạt động (Tỉnh/Quận).
 */
export default function TaskerProfile({ onNavigate }) {
  const location = useLocation()
  const { user, token, updateUser } = useAuth()

  const isOwnerCVView = Boolean(location.state?.isOwnerView)
  const [isOnline, setIsOnline] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const wp = user?.workerProfile || null
  const displayName = user?.name || 'Nguyễn Anh Tuấn'
  const description = wp?.description || ''
  const skills = wp?.skills || []
  const districts = wp?.serviceDistricts || []
  const completedTasks = wp?.completedTasks ?? 0
  const rating = wp?.rating ?? 5.0

  const professionText =
    skills.length > 0
      ? `Chuyên môn: ${skills.map((s) => s.skillName).join(', ')}`
      : 'Chưa cập nhật lĩnh vực chuyên môn chính'

  const showFeedback = (msg) => {
    setSaveMessage(msg)
    setTimeout(() => setSaveMessage(''), 3500)
  }

  // Lưu thay đổi hồ sơ Tasker xuống Backend MySQL
  const persistWorkerProfile = async (nextDescription, nextSkills, nextDistricts) => {
    if (!token) return
    try {
      setSaving(true)
      const payload = {
        description: nextDescription,
        skillIds: nextSkills.map((s) => s.skillId),
        serviceDistricts: nextDistricts.map((d) => ({
          provinceCode: d.provinceCode,
          provinceName: d.provinceName,
          districtCode: d.districtCode,
          districtName: d.districtName,
        })),
      }
      const updatedUser = await updateWorkerProfileApi(token, payload)
      updateUser(updatedUser)
      showFeedback('Đã lưu cập nhật Hồ sơ & Dịch vụ thành công!')
    } catch (err) {
      alert(err.message || 'Không thể lưu cập nhật hồ sơ.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDescription = async (newDesc) => {
    await persistWorkerProfile(newDesc, skills, districts)
  }

  const handleAddSkill = async (newSkill) => {
    if (skills.some((s) => s.skillId === newSkill.skillId)) return
    const nextSkills = [...skills, newSkill]
    await persistWorkerProfile(description, nextSkills, districts)
  }

  const handleRemoveSkill = async (skillId) => {
    const nextSkills = skills.filter((s) => s.skillId !== skillId)
    await persistWorkerProfile(description, nextSkills, districts)
  }

  const handleAddDistrict = async (newDist) => {
    if (districts.some((d) => d.districtCode === newDist.districtCode)) return
    const nextDistricts = [...districts, newDist]
    await persistWorkerProfile(description, skills, nextDistricts)
  }

  const handleRemoveDistrict = async (districtCode) => {
    const nextDistricts = districts.filter((d) => d.districtCode !== districtCode)
    await persistWorkerProfile(description, skills, nextDistricts)
  }

  const handleMessage = () => {
    alert(`Mở cửa sổ chat với ${displayName}`)
  }

  // Nội dung các khối CV dùng chung cho cả 2 chế độ
  const cvSections = (
    <div className="flex flex-col gap-6">
      {saveMessage && (
        <div className="p-4 rounded-2xl bg-primary-fixed/40 border border-primary/30 text-primary flex items-center gap-2.5 text-sm font-bold">
          <Icon name="check_circle" size={20} />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Tasker Identity Header Card */}
      <TaskerHeader
        name={displayName}
        avatar={DEFAULT_AVATAR}
        profession={professionText}
        completedTasks={completedTasks}
        rating={rating}
        onMessage={handleMessage}
        isOwnerView={isOwnerCVView}
      />

      {/* About Me Section */}
      <AboutTasker
        description={description}
        createdAt={user?.createdAt}
        editable={isOwnerCVView}
        saving={saving}
        onSaveDescription={handleSaveDescription}
      />

      {/* Services & Rates Section (with Search Picker in owner mode) */}
      <ServicesRates
        skills={skills}
        editable={isOwnerCVView}
        onAddSkill={handleAddSkill}
        onRemoveSkill={handleRemoveSkill}
      />

      {/* Past Work Gallery Section */}
      <WorkGallery />

      {/* Service Area & Coverage Map Section (with Province & District Picker in owner mode) */}
      <ServiceArea
        districts={districts}
        editable={isOwnerCVView}
        onAddDistrict={handleAddDistrict}
        onRemoveDistrict={handleRemoveDistrict}
      />
    </div>
  )

  // Chế độ 1: Tasker tự xem và cập nhật CV của mình (Dùng chung TaskerLayout: Sidebar + Topbar của Tasker)
  if (isOwnerCVView) {
    return (
      <TaskerLayout
        activeMenu="profile_services"
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
        onNavigate={onNavigate}
        title="Hồ sơ & Dịch vụ của tôi"
      >
        <div className="max-w-[960px] mx-auto w-full">{cvSections}</div>
      </TaskerLayout>
    )
  }

  // Chế độ 2: Khách hàng xem hồ sơ Tasker (Có Header/Footer của Client + ReviewsList + BookingSidebar)
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Global Header */}
      <Header activePath="profile" onNavigate={onNavigate} />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* Top Ambient Trust Banner */}
        <div className="w-full bg-surface-container-high py-2.5 px-6 border-b border-surface-variant/30">
          <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-4">
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
              <span className="font-medium text-on-surface">{displayName}</span>
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
            <div className="lg:col-span-8 flex flex-col gap-8">
              {cvSections}
              <ReviewsList />
            </div>

            <BookingSidebar
              taskerName={displayName}
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