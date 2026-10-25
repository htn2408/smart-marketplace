import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TASKMATE_LOGO_URL } from '../../assets/constants'
import Icon from '../../components/common/Icon'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { validateLoginForm, validateRegisterForm } from '../../utils/validation'
import { ROUTES } from '../../routes/paths'
import { forgotPasswordApi, verifyOtpApi, resetPasswordApi } from '../../services/authService'

/**
 * TaskMate Login & Registration Page
 * Styled with TaskMate theme, full-screen craftsman background, and seamless BE integration
 */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isAuthenticated } = useAuth()

  // Redirect destination after successful auth
  const searchParams = new URLSearchParams(location.search)
  const fromQuery = searchParams.get('from')
  const from =
    (typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname) ||
    fromQuery ||
    ROUTES.HOME

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login')

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
  })

  // Password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Validation & Server errors
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [forgotStep, setForgotStep] = useState(1) // 1: input email, 2: verify otp, 3: set new password
  const [resendCountdown, setResendCountdown] = useState(0)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Đếm ngược 60 giây gửi lại mã OTP
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  // Clear errors when toggling mode
  const handleToggleMode = (newMode) => {
    setMode(newMode)
    setErrors({})
    setServerError('')
    setSuccessMessage('')
    if (newMode === 'forgot-password') {
      setForgotStep(1)
      setForgotOtp('')
      setNewPassword('')
      setConfirmNewPassword('')
      if (loginForm.email) setForgotEmail(loginForm.email)
    }
  }

  // Gửi mã OTP xác thực qua email (Bước 1)
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    setServerError('')
    setSuccessMessage('')

    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setErrors({ forgotEmail: 'Vui lòng nhập địa chỉ email hợp lệ.' })
      return
    }

    setErrors({})
    setIsSendingOtp(true)
    try {
      const res = await forgotPasswordApi(forgotEmail)
      setSuccessMessage(res.message || 'Mã xác thực OTP đã được gửi đến email của bạn!')
      setForgotStep(2)
      setResendCountdown(60)
    } catch (err) {
      setServerError(err.message || 'Không thể gửi mã xác nhận. Vui lòng kiểm tra lại email.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Xác thực mã OTP (Bước 2)
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    setServerError('')
    setSuccessMessage('')

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setErrors({ forgotOtp: 'Vui lòng nhập đủ 6 chữ số mã OTP.' })
      return
    }

    setErrors({})
    setIsVerifyingOtp(true)
    try {
      const res = await verifyOtpApi({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
      })
      setSuccessMessage(res.message || 'Mã OTP hợp lệ! Hãy tạo mật khẩu mới.')
      setForgotStep(3)
    } catch (err) {
      setServerError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Đặt lại mật khẩu mới sau khi đã xác thực OTP (Bước 3)
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccessMessage('')

    const newErrors = {}
    if (!newPassword || newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có tối thiểu 6 ký tự.'
    }
    if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = 'Xác nhận mật khẩu mới không khớp.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsResettingPassword(true)

    try {
      const res = await resetPasswordApi({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      })
      setSuccessMessage(res.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.')
      setMode('login')
      setLoginForm((prev) => ({ ...prev, email: forgotEmail, password: '' }))
      setForgotStep(1)
      setForgotOtp('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      setServerError(err.message || 'Không thể đặt lại mật khẩu.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccessMessage('')

    const validation = validateLoginForm(loginForm)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      await login(loginForm)
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(err.message || 'Email hoặc mật khẩu không chính xác.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccessMessage('')

    const validation = validateRegisterForm(registerForm)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      await register(registerForm)
      // Tự động đăng nhập ngay sau khi đăng ký thành công
      await login({
        email: registerForm.email,
        password: registerForm.password,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      setIsSubmitting(false)
    }
  }

  // Demo Google Login notice
  const handleGoogleLogin = () => {
    alert('Tính năng Đăng nhập với Google đang được tích hợp qua OAuth 2.0. Vui lòng đăng nhập bằng Email và Mật khẩu.')
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Image with Craftsman/TaskMate atmosphere */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.45] scale-105 transition-transform duration-700"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80')",
        }}
      />
      {/* Ambient Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/60 via-black/40 to-black/70 backdrop-blur-xs" />

      {/* Back to Home button */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.HOME)}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full font-label-md text-sm transition-all cursor-pointer shadow-md"
      >
        <Icon name="arrow_back" size={18} />
        <span>Về trang chủ</span>
      </button>

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-surface-container-lowest rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-surface-variant/30 p-7 sm:p-9 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-10 flex items-center justify-center mb-3">
            <img
              src={TASKMATE_LOGO_URL}
              alt="TaskMate Logo"
              className="h-9 w-auto object-contain"
            />
          </div>
          <h1 className="font-headline-md text-2xl sm:text-[28px] font-extrabold text-on-surface tracking-tight">
            {mode === 'login'
              ? 'Chào mừng'
              : mode === 'register'
                ? 'Tạo tài khoản mới'
                : forgotStep === 1
                  ? 'Quên mật khẩu?'
                  : forgotStep === 2
                    ? 'Nhập mã xác nhận'
                    : 'Tạo mật khẩu mới'}
          </h1>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1">
            {mode === 'login'
              ? 'Đăng nhập để kết nối với hàng nghìn Tasker lành nghề'
              : mode === 'register'
                ? 'Gia nhập cộng đồng dịch vụ tiện ích hàng đầu'
                : forgotStep === 1
                  ? 'Nhập email để nhận mã OTP xác minh khôi phục tài khoản'
                  : forgotStep === 2
                    ? `Mã OTP đã được gửi về: ${forgotEmail}`
                    : 'Nhập mật khẩu mới an toàn cho tài khoản của bạn'}
          </p>
        </div>

        {/* Global Server Error Alert */}
        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs animate-in fade-in">
            <Icon name="error" size={18} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{serverError}</span>
          </div>
        )}

        {/* Global Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2.5 text-primary text-xs animate-in fade-in">
            <Icon name="check_circle" size={18} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ===================== MODE: LOGIN ===================== */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Field: Email / Username */}
            <div>
              <label
                htmlFor="login-email"
                className="block font-label-sm text-xs font-bold text-on-surface mb-1.5"
              >
                Tên đăng nhập / Email <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Nhập email của bạn (vd: ban@email.com)"
                  className={`w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all ${
                    errors.email
                      ? 'border-error focus:ring-2 focus:ring-error/20'
                      : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-error text-xs mt-1.5 font-medium flex items-center gap-1">
                  <Icon name="info" size={14} />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Field: Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block font-label-sm text-xs font-bold text-on-surface mb-1.5"
              >
                Mật khẩu <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Nhập mật khẩu"
                  className={`w-full pl-4 pr-11 py-3 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all ${
                    errors.password
                      ? 'border-error focus:ring-2 focus:ring-error/20'
                      : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  <Icon
                    name={showPassword ? 'visibility_off' : 'visibility'}
                    size={20}
                  />
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-xs mt-1.5 font-medium flex items-center gap-1">
                  <Icon name="info" size={14} />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Support / Forgot Password link */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => handleToggleMode('forgot-password')}
                className="text-primary hover:text-primary/80 text-xs font-bold transition-colors cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              className="py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all mt-2"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                'Tiếp tục'
              )}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-surface-variant/60 w-full" />
              <span className="bg-surface-container-lowest px-3 text-xs font-bold text-outline uppercase tracking-wider">
                Hoặc
              </span>
              <div className="border-t border-surface-variant/60 w-full" />
            </div>

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-full border border-surface-variant/60 hover:bg-surface-container-low transition-all flex items-center justify-center gap-3 font-label-md text-sm font-semibold text-on-surface cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Đăng nhập với Google</span>
            </button>

            {/* Switch to Register button */}
            <button
              type="button"
              onClick={() => handleToggleMode('register')}
              className="w-full py-3 px-4 rounded-full border border-surface-variant/60 hover:bg-surface-container-low transition-all font-label-md text-sm font-semibold text-on-surface cursor-pointer text-center block active:scale-[0.99]"
            >
              Đăng ký tài khoản mới
            </button>
          </form>
        )}

        {/* ===================== MODE: REGISTER ===================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Field: Full Name */}
            <div>
              <label
                htmlFor="register-name"
                className="block font-label-sm text-xs font-bold text-on-surface mb-1"
              >
                Họ và tên <span className="text-error">*</span>
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ví dụ: Nguyễn Văn An"
                className={`w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all ${
                  errors.name
                    ? 'border-error focus:ring-2 focus:ring-error/20'
                    : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                }`}
              />
              {errors.name && (
                <p className="text-error text-xs mt-1 font-medium flex items-center gap-1">
                  <Icon name="info" size={14} />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Field: Email */}
            <div>
              <label
                htmlFor="register-email"
                className="block font-label-sm text-xs font-bold text-on-surface mb-1"
              >
                Email <span className="text-error">*</span>
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Ví dụ: an.nguyen@email.com"
                className={`w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all ${
                  errors.email
                    ? 'border-error focus:ring-2 focus:ring-error/20'
                    : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                }`}
              />
              {errors.email && (
                <p className="text-error text-xs mt-1 font-medium flex items-center gap-1">
                  <Icon name="info" size={14} />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Field: Phone Number */}
            <div>
              <label
                htmlFor="register-phone"
                className="block font-label-sm text-xs font-bold text-on-surface mb-1"
              >
                Số điện thoại <span className="text-error">*</span>
              </label>
              <input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                value={registerForm.phoneNumber}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                placeholder="Ví dụ: 0987654321"
                className={`w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all ${
                  errors.phoneNumber
                    ? 'border-error focus:ring-2 focus:ring-error/20'
                    : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                }`}
              />
              {errors.phoneNumber && (
                <p className="text-error text-xs mt-1 font-medium flex items-center gap-1">
                  <Icon name="info" size={14} />
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Field: Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block font-label-sm text-xs font-bold text-on-surface mb-1"
              >
                Mật khẩu <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Tối thiểu 6 ký tự"
                  className={`w-full pl-4 pr-11 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all ${
                    errors.password
                      ? 'border-error focus:ring-2 focus:ring-error/20'
                      : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  <Icon
                    name={showPassword ? 'visibility_off' : 'visibility'}
                    size={20}
                  />
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-xs mt-1 font-medium flex items-center gap-1">
                  <Icon name="info" size={14} />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Register Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              className="py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all mt-3"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tạo tài khoản...</span>
                </div>
              ) : (
                'Tạo tài khoản TaskMate'
              )}
            </Button>

            {/* Back to Login button */}
            <button
              type="button"
              onClick={() => handleToggleMode('login')}
              className="w-full py-2.5 px-4 text-center font-label-md text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer block"
            >
              Đã có tài khoản? Đăng nhập ngay
            </button>
          </form>
        )}

        {/* ===================== MODE: FORGOT PASSWORD ===================== */}
        {mode === 'forgot-password' && (
          <div className="space-y-4">
            {/* Bước 1: Nhập email gửi OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block font-label-sm text-xs font-bold text-on-surface mb-1.5"
                  >
                    Email tài khoản của bạn <span className="text-error">*</span>
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Nhập email đã đăng ký (vd: ban@email.com)"
                    className={`w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all ${
                      errors.forgotEmail
                        ? 'border-error focus:ring-2 focus:ring-error/20'
                        : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {errors.forgotEmail && (
                    <p className="text-error text-xs mt-1.5 font-medium flex items-center gap-1">
                      <Icon name="info" size={14} />
                      {errors.forgotEmail}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSendingOtp}
                  className="py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {isSendingOtp ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang gửi mã qua Gmail...</span>
                    </div>
                  ) : (
                    'Gửi mã xác minh OTP'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => handleToggleMode('login')}
                  className="w-full py-2.5 px-4 text-center font-label-md text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer block"
                >
                  ← Quay lại Đăng nhập
                </button>
              </form>
            )}

            {/* Bước 2: Nhập và xác thực mã OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="forgot-otp"
                      className="block font-label-sm text-xs font-bold text-on-surface"
                    >
                      Mã xác nhận OTP (6 số) <span className="text-error">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="forgot-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      className={`w-full py-3.5 bg-surface-container-low rounded-xl text-center text-on-surface font-mono text-2xl tracking-[12px] font-bold outline-none border transition-all ${
                        errors.forgotOtp
                          ? 'border-error focus:ring-2 focus:ring-error/20'
                          : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                      }`}
                    />
                  </div>
                  {errors.forgotOtp && (
                    <p className="text-error text-xs mt-1.5 font-medium flex items-center justify-center gap-1">
                      <Icon name="info" size={14} />
                      {errors.forgotOtp}
                    </p>
                  )}
                </div>

                {/* Resend countdown */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-on-surface-variant">Chưa nhận được mã?</span>
                  {resendCountdown > 0 ? (
                    <span className="text-on-surface-variant font-medium">
                      Gửi lại sau <strong className="text-primary font-bold">{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="text-primary hover:text-primary/80 font-bold cursor-pointer"
                    >
                      {isSendingOtp ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isVerifyingOtp || forgotOtp.length !== 6}
                  className="py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all mt-1"
                >
                  {isVerifyingOtp ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang kiểm tra mã OTP...</span>
                    </div>
                  ) : (
                    'Xác nhận mã OTP'
                  )}
                </Button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="py-1 text-center font-label-md text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  >
                    ← Đổi email khác
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('login')}
                    className="py-1 text-center font-label-md text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            )}

            {/* Bước 3: Tạo mật khẩu mới sau khi OTP hợp lệ */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                {/* New Password */}
                <div>
                  <label
                    htmlFor="forgot-new-password"
                    className="block font-label-sm text-xs font-bold text-on-surface mb-1"
                  >
                    Mật khẩu mới <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="forgot-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className={`w-full pl-4 pr-11 py-3 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all ${
                        errors.newPassword
                          ? 'border-error focus:ring-2 focus:ring-error/20'
                          : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      <Icon
                        name={showNewPassword ? 'visibility_off' : 'visibility'}
                        size={20}
                      />
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-error text-xs mt-1 font-medium flex items-center gap-1">
                      <Icon name="info" size={14} />
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="forgot-confirm-password"
                    className="block font-label-sm text-xs font-bold text-on-surface mb-1"
                  >
                    Xác nhận mật khẩu mới <span className="text-error">*</span>
                  </label>
                  <input
                    id="forgot-confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-label-md text-sm outline-none border transition-all ${
                      errors.confirmNewPassword
                        ? 'border-error focus:ring-2 focus:ring-error/20'
                        : 'border-surface-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {errors.confirmNewPassword && (
                    <p className="text-error text-xs mt-1 font-medium flex items-center gap-1">
                      <Icon name="info" size={14} />
                      {errors.confirmNewPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isResettingPassword}
                  className="py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all mt-2"
                >
                  {isResettingPassword ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu mật khẩu mới...</span>
                    </div>
                  ) : (
                    'Lưu mật khẩu mới'
                  )}
                </Button>

                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleMode('login')}
                    className="py-1 text-center font-label-md text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    ← Quay lại Đăng nhập
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

