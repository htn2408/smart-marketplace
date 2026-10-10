import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Icon from '../components/common/Icon'
import Button from '../components/common/Button'
import AddressSelector from '../components/common/AddressSelector'
import { useAuth } from '../hooks/useAuth'
import { updateProfileApi, changePasswordApi } from '../services/authService'

/**
 * UserProfile Page - Quản lý thông tin cá nhân, địa chỉ và đổi mật khẩu
 */
export default function UserProfile({ onNavigate }) {
  const { user, token, updateUser } = useAuth()

  // Form thông tin cá nhân
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [addressData, setAddressData] = useState({
    address: '',
    latitude: null,
    longitude: null,
  })

  // Form đổi mật khẩu
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Feedback states
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Sync state từ current user
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhoneNumber(user.phoneNumber || '')
      setAddressData({
        address: user.address || '',
        latitude: user.latitude || null,
        longitude: user.longitude || null,
      })
    }
  }, [user])

  // Xử lý cập nhật thông tin cá nhân & địa chỉ
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileSuccess('')
    setProfileError('')

    if (!name.trim()) {
      setProfileError('Họ và tên không được để trống.')
      return
    }

    try {
      setProfileLoading(true)
      const payload = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        address: addressData.address,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
      }
      const updatedUser = await updateProfileApi(token, payload)
      updateUser(updatedUser)
      setProfileSuccess('Cập nhật thông tin và địa chỉ thành công!')
      setTimeout(() => setProfileSuccess(''), 4000)
    } catch (err) {
      setProfileError(err.message || 'Cập nhật thất bại. Vui lòng thử lại.')
    } finally {
      setProfileLoading(false)
    }
  }

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordSuccess('')
    setPasswordError('')

    if (!oldPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp với mật khẩu mới.')
      return
    }

    try {
      setPasswordLoading(true)
      await changePasswordApi(token, { oldPassword, newPassword })
      setPasswordSuccess('Đổi mật khẩu thành công!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(''), 4000)
    } catch (err) {
      setPasswordError(err.message || 'Đổi mật khẩu thất bại.')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Global Header */}
      <Header activePath="user-profile" onNavigate={onNavigate} />

      <main className="w-full pt-24 pb-16 bg-surface flex-1">
        <div className="max-w-[1000px] mx-auto px-6">
          {/* Header Title */}
          <div className="mb-8">
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Hồ sơ &amp; Tài khoản cá nhân
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Quản lý thông tin liên hệ, vị trí địa chỉ nhận việc và bảo mật tài khoản TaskMate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Card: Summary Avatar & Role */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-variant/30 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center font-bold text-3xl mb-4 ring-4 ring-primary/10">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                  {user?.name || 'Người dùng'}
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  {user?.email}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-on-primary">
                    {user?.role === 'WORKER' ? 'Thợ Tasker' : 'Khách hàng'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
                    Thành viên TaskMate
                  </span>
                </div>

                <div className="w-full border-t border-surface-variant/20 mt-6 pt-4 flex flex-col gap-2 text-left">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Icon name="mail" size={16} className="text-primary" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Icon name="phone" size={16} className="text-primary" />
                    <span>{user?.phoneNumber || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Icon name="home_pin" size={16} className="text-primary" />
                    <span className="truncate">{user?.address || 'Chưa lưu địa chỉ'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Forms */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Form 1: Thông tin cá nhân & Địa chỉ */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm border border-surface-variant/30">
                <div className="flex items-center gap-2.5 mb-6 border-b border-surface-variant/20 pb-4">
                  <Icon name="badge" size={24} className="text-primary" />
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                    Thông tin cá nhân &amp; Địa chỉ
                  </h3>
                </div>

                {profileSuccess && (
                  <div className="mb-5 p-3.5 bg-green-500/10 border border-green-500/30 text-green-700 text-sm rounded-xl flex items-center gap-2">
                    <Icon name="check_circle" size={18} className="text-green-600" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="mb-5 p-3.5 bg-error/10 border border-error/30 text-error text-sm rounded-xl flex items-center gap-2">
                    <Icon name="error" size={18} className="text-error" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Họ và tên */}
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                        Họ và tên <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập họ và tên"
                        className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all"
                        required
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0912345678"
                        className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Email (Readonly) */}
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                      Email đăng ký
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-surface-container-high/60 rounded-xl text-on-surface-variant font-body-md text-sm outline-none border border-surface-variant/30 cursor-not-allowed"
                    />
                    <span className="text-xs text-outline mt-1 block">
                      Email đăng ký là định danh tài khoản và không thể tự thay đổi.
                    </span>
                  </div>

                  {/* Component tái sử dụng: Chọn Địa chỉ */}
                  <div className="pt-2 border-t border-surface-variant/20">
                    <AddressSelector
                      initialAddress={addressData.address}
                      initialLat={addressData.latitude || 21.0285}
                      initialLng={addressData.longitude || 105.8542}
                      onChange={(data) => {
                        setAddressData({
                          address: data.fullAddress || data.specificAddress,
                          latitude: data.latitude,
                          longitude: data.longitude,
                        })
                      }}
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={profileLoading}
                      className="rounded-xl font-bold min-w-[140px] justify-center"
                    >
                      {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Form 2: Đổi mật khẩu */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm border border-surface-variant/30">
                <div className="flex items-center gap-2.5 mb-6 border-b border-surface-variant/20 pb-4">
                  <Icon name="lock_reset" size={24} className="text-primary" />
                  <div>
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                      Đổi mật khẩu
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                      Bắt buộc phải nhập đúng mật khẩu cũ để bảo vệ tài khoản.
                    </p>
                  </div>
                </div>

                {passwordSuccess && (
                  <div className="mb-5 p-3.5 bg-green-500/10 border border-green-500/30 text-green-700 text-sm rounded-xl flex items-center gap-2">
                    <Icon name="check_circle" size={18} className="text-green-600" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-5 p-3.5 bg-error/10 border border-error/30 text-error text-sm rounded-xl flex items-center gap-2">
                    <Icon name="error" size={18} className="text-error" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  {/* Mật khẩu cũ */}
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                      Mật khẩu cũ (hiện tại) <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full px-3.5 py-2.5 pr-10 bg-surface-container-low rounded-xl text-on-surface font-body-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 cursor-pointer"
                        title={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        <Icon name={showOldPassword ? 'visibility_off' : 'visibility'} size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mật khẩu mới */}
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                        Mật khẩu mới <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Ít nhất 6 ký tự"
                          className="w-full px-3.5 py-2.5 pr-10 bg-surface-container-low rounded-xl text-on-surface font-body-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 cursor-pointer"
                          title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          <Icon name={showNewPassword ? 'visibility_off' : 'visibility'} size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                        Xác nhận mật khẩu mới <span className="text-error">*</span>
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body-md text-sm outline-none border border-surface-variant/40 focus:border-primary transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <Button
                      type="submit"
                      variant="outline"
                      size="md"
                      disabled={passwordLoading}
                      className="rounded-xl font-bold border-primary text-primary hover:bg-primary-fixed/20 min-w-[140px] justify-center"
                    >
                      {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
