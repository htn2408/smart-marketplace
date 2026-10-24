import { useState, useEffect } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/paths'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import TaskerLayout from '../../components/layout/TaskerLayout'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import TaskerHeader from '../../components/profile/TaskerHeader'
import AboutTasker from '../../components/profile/AboutTasker'
import ServicesRates from '../../components/profile/ServicesRates'
import WorkGallery from '../../components/profile/WorkGallery'
import ServiceArea from '../../components/profile/ServiceArea'
import ReviewsList from '../../components/profile/ReviewsList'
import BookingSidebar from '../../components/profile/BookingSidebar'
import { useAuth } from '../../hooks/useAuth'
import { updateWorkerProfileApi, uploadAvatarApi } from '../../services/authService'
import {
  fetchWorkerProfileById,
  addWorkerGalleryImageApi,
  deleteWorkerGalleryImageApi,
} from '../../services/workerService'
import { DEFAULT_AVATAR } from '../../assets/constants'

/**
 * TaskMate TaskerProfile - Standardized JSX Component
 * Hỗ trợ 2 chế độ:
 * 1. Khách hàng xem hồ sơ Tasker (/profile/:id): Dùng Header/Footer của Client, có đầy đủ BookingSidebar và ReviewsList.
 * 2. Tasker tự xem và cập nhật CV của mình (/profile hoặc khi ấn từ tab "Hồ sơ & Dịch vụ"):
 *    Dùng chung TaskerLayout (Sidebar + Topbar của Tasker), ẩn BookingSidebar & ReviewsList,
 *    cho phép chỉnh sửa Giới thiệu bản thân, Lĩnh vực chuyên môn (search & pick) và Khu vực hoạt động (Tỉnh/Quận)
 *    và lưu trực tiếp vào MySQL qua PUT /api/auth/worker-profile.
 */
export default function TaskerProfile({ onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { id: paramTaskerId } = useParams()
  const { user, token, updateUser } = useAuth()

  const isUserTasker =
    user?.roles?.includes('TASKER') ||
    user?.roles?.includes('WORKER') ||
    user?.role === 'TASKER' ||
    user?.role === 'WORKER'

  // Mặc định nếu vào /profile (không phải /profile/:id của thợ khác) và user là Tasker hoặc đi từ Dashboard sang -> bật chế độ CV Owner
  const isOwnerCVView =
    location.state?.isOwnerView !== undefined
      ? Boolean(location.state.isOwnerView)
      : !paramTaskerId && Boolean(isUserTasker)

  const [saving, setSaving] = useState(false)
  const [updatingAvatar, setUpdatingAvatar] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const handleAvatarChange = async (file) => {
    if (!token) {
      setSaveError('Vui lòng đăng nhập để đổi ảnh đại diện.')
      return
    }
    try {
      setUpdatingAvatar(true)
      setSaveError('')
      const res = await uploadAvatarApi(token, file)
      updateUser(res)
      showFeedback('Đã cập nhật ảnh đại diện thành công!')
    } catch (err) {
      setSaveError(err.message || 'Không thể cập nhật ảnh đại diện.')
    } finally {
      setUpdatingAvatar(false)
    }
  }

  const wp = user?.workerProfile || null

  // Chế độ khách xem hồ sơ Tasker khác (/profile/:id): fetch hồ sơ thật từ DB qua GET /api/workers/{userId}
  const isViewingOther = Boolean(paramTaskerId)
  const [viewedTasker, setViewedTasker] = useState(null)
  const [viewError, setViewError] = useState('')

  useEffect(() => {
    if (!paramTaskerId) return
    const controller = new AbortController()

    fetchWorkerProfileById(paramTaskerId, { signal: controller.signal })
      .then((res) => setViewedTasker(res))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setViewError(err.message || 'Không thể tải hồ sơ Tasker.')
      })

    return () => controller.abort()
  }, [paramTaskerId])

  const displayName = isViewingOther
    ? viewedTasker?.name || location.state?.tasker?.name || 'Tasker'
    : user?.name || 'Nguyễn Anh Tuấn'

  // State cục bộ (nếu người dùng đã chỉnh sửa trực tiếp trên trang, ưu tiên state cục bộ; nếu chưa thì đọc từ user.workerProfile)
  const [draftDescription, setDraftDescription] = useState(null)
  const [draftSkills, setDraftSkills] = useState(null)
  const [draftDistricts, setDraftDistricts] = useState(null)
  const [draftGalleryImages, setDraftGalleryImages] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const description = isViewingOther
    ? viewedTasker?.description || ''
    : draftDescription !== null
    ? draftDescription
    : wp?.description || ''

  const skills = isViewingOther
    ? (viewedTasker?.skills || []).map((s) => ({ skillId: s.id, skillName: s.name }))
    : draftSkills !== null
    ? draftSkills
    : wp?.skills || []

  const districts = isViewingOther
    ? viewedTasker?.serviceDistricts || []
    : draftDistricts !== null
    ? draftDistricts
    : wp?.serviceDistricts || []

  const effectiveGalleryImages = isViewingOther
    ? viewedTasker?.galleryImages || []
    : draftGalleryImages !== null
    ? draftGalleryImages
    : wp?.galleryImages || []

  const handleAddGalleryImage = async (payload) => {
    const newImage = await addWorkerGalleryImageApi(payload)
    const nextList = [newImage, ...(draftGalleryImages || wp?.galleryImages || [])]
    setDraftGalleryImages(nextList)
    if (user?.workerProfile) {
      updateUser({
        ...user,
        workerProfile: {
          ...user.workerProfile,
          galleryImages: nextList,
        },
      })
    }
    showFeedback('Đã thêm ảnh công trình vào hồ sơ thành công!')
  }

  const handleDeleteGalleryImage = async (imageId) => {
    await deleteWorkerGalleryImageApi(imageId)
    const nextList = (draftGalleryImages || wp?.galleryImages || []).filter((img) => img.id !== imageId)
    setDraftGalleryImages(nextList)
    if (user?.workerProfile) {
      updateUser({
        ...user,
        workerProfile: {
          ...user.workerProfile,
          galleryImages: nextList,
        },
      })
    }
    showFeedback('Đã xoá ảnh công trình khỏi hồ sơ.')
  }

  const completedTasks = isViewingOther
    ? viewedTasker?.completedTasks ?? 0
    : wp?.completedTasks ?? 0

  const rating = isViewingOther ? viewedTasker?.rating ?? 5.0 : wp?.rating ?? 5.0

  const memberSince = isViewingOther ? viewedTasker?.memberSince : user?.createdAt

  const professionText =
    skills.length > 0
      ? `Chuyên môn: ${skills.map((s) => s.skillName).join(', ')}`
      : 'Chưa cập nhật lĩnh vực chuyên môn chính'

  const showFeedback = (msg) => {
    setSaveError('')
    setSaveMessage(msg)
    setTimeout(() => setSaveMessage(''), 4000)
  }

  // Hàm gọi API lưu toàn bộ thay đổi xuống MySQL (bảng worker_profiles, worker_skills, worker_districts)
  const persistWorkerProfile = async (
    nextDescription = description,
    nextSkills = skills,
    nextDistricts = districts
  ) => {
    if (!token) {
      setSaveError('Vui lòng đăng nhập để lưu hồ sơ.')
      return
    }
    try {
      setSaving(true)
      setSaveError('')
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
      setHasUnsavedChanges(false)
      showFeedback('Đã lưu cập nhật Hồ sơ & Dịch vụ vào cơ sở dữ liệu thành công!')
    } catch (err) {
      setSaveError(err.message || 'Không thể lưu cập nhật hồ sơ.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDescription = async (newDesc) => {
    setDraftDescription(newDesc)
    await persistWorkerProfile(newDesc, skills, districts)
  }

  const handleAddSkill = async (newSkill) => {
    if (skills.some((s) => s.skillId === newSkill.skillId)) return
    const nextSkills = [...skills, newSkill]
    setDraftSkills(nextSkills)
    setHasUnsavedChanges(true)
    await persistWorkerProfile(description, nextSkills, districts)
  }

  const handleRemoveSkill = async (skillId) => {
    const nextSkills = skills.filter((s) => s.skillId !== skillId)
    setDraftSkills(nextSkills)
    setHasUnsavedChanges(true)
    await persistWorkerProfile(description, nextSkills, districts)
  }

  const handleAddDistrict = async (newDist) => {
    if (districts.some((d) => d.districtCode === newDist.districtCode)) return
    const nextDistricts = [...districts, newDist]
    setDraftDistricts(nextDistricts)
    setHasUnsavedChanges(true)
    await persistWorkerProfile(description, skills, nextDistricts)
  }

  const handleRemoveDistrict = async (districtCode) => {
    const nextDistricts = districts.filter((d) => d.districtCode !== districtCode)
    setDraftDistricts(nextDistricts)
    setHasUnsavedChanges(true)
    await persistWorkerProfile(description, skills, nextDistricts)
  }

  const handleMessage = () => {
    const targetId = paramTaskerId || viewedTasker?.userId || location.state?.tasker?.userId || location.state?.tasker?.id
    if (onNavigate) {
      onNavigate('messages', { targetUserId: targetId, targetName: displayName })
    }
  }

  // Nội dung các khối CV dùng chung cho cả 2 chế độ
  const cvSections = (
    <div className="flex flex-col gap-6">
      {/* Thanh công cụ Lưu hồ sơ vào DB cho Tasker */}
      {isOwnerCVView && (
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:px-6 shadow-sm border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 text-primary flex items-center justify-center shrink-0">
              <Icon name="badge" size={22} />
            </div>
            <div>
              <h2 className="font-headline-sm text-sm sm:text-base font-extrabold text-on-surface">
                Quản lý Hồ sơ năng lực &amp; Dịch vụ (CV Tasker)
              </h2>
              <p className="text-xs text-on-surface-variant">
                Mọi thay đổi về Giới thiệu, Chuyên môn và Khu vực hoạt động được đồng bộ trực tiếp vào CSDL.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={saving ? 'sync' : 'save'}
            disabled={saving}
            onClick={() => persistWorkerProfile(description, skills, districts)}
            className="rounded-xl text-xs font-bold shrink-0 self-end sm:self-center"
          >
            {saving
              ? 'Đang lưu vào DB...'
              : hasUnsavedChanges
              ? 'Lưu thay đổi ngay'
              : 'Lưu cập nhật Hồ sơ'}
          </Button>
        </div>
      )}

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-primary-fixed/40 border border-primary/30 text-primary flex items-center gap-2.5 text-sm font-bold">
          <Icon name="check_circle" size={20} />
          <span>{saveMessage}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2.5 text-sm font-bold">
          <Icon name="error" size={20} />
          <span>{saveError}</span>
        </div>
      )}

      {isViewingOther && viewError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2.5 text-sm font-bold">
          <Icon name="error" size={20} />
          <span>{viewError}</span>
        </div>
      )}

      {/* Tasker Identity Header Card */}
      <TaskerHeader
        name={displayName}
        avatar={
          isViewingOther
            ? viewedTasker?.avatarUrl || DEFAULT_AVATAR
            : user?.avatarUrl || DEFAULT_AVATAR
        }
        profession={professionText}
        completedTasks={completedTasks}
        rating={rating}
        onMessage={handleMessage}
        isOwnerView={isOwnerCVView}
        onAvatarChange={handleAvatarChange}
        isUpdatingAvatar={updatingAvatar}
      />

      {/* About Me Section */}
      <AboutTasker
        description={description}
        createdAt={memberSince}
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
      <WorkGallery
        images={effectiveGalleryImages}
        editable={isOwnerCVView}
        onAddImage={handleAddGalleryImage}
        onDeleteImage={handleDeleteGalleryImage}
      />

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
              taskerSkills={skills}
              onSubmitOffer={(data) => {
                const target = {
                  id: viewedTasker?.workerProfileId || viewedTasker?.id || paramTaskerId,
                  userId: viewedTasker?.userId || paramTaskerId,
                  name: displayName,
                  avatar: viewedTasker?.avatarUrl || location.state?.tasker?.avatar,
                  rating: viewedTasker?.rating,
                  completedTasks: viewedTasker?.completedTasks,
                  skills: skills,
                };
                const taskDraft = {
                  title: data.jobDetail || data.skillName || 'Dịch vụ gia đình',
                  description: data.jobDetail,
                  skillId: data.skillId,
                  skillName: data.skillName,
                  amount: data.amount,
                  offeredPrice: data.amount,
                  selectedDate: data.selectedDate,
                  customDate: data.customDate,
                  startTime: data.startTime,
                  endTime: data.endTime,
                  allowNegotiate: data.allowRenegotiate,
                };
                if (onNavigate) {
                  onNavigate('task-detail', { taskDraft, targetTasker: target });
                } else {
                  navigate(ROUTES.TASK_DETAIL, { state: { taskDraft, targetTasker: target } });
                }
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
