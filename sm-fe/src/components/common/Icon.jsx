import {
  Search,
  SearchX,
  Home,
  MapPin,
  MapPinOff,
  LocateFixed,
  Navigation,
  Map,
  Radio,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  ZoomIn,
  RotateCw,
  RefreshCw,
  Hammer,
  Wrench,
  HardHat,
  Cog,
  Sparkles,
  SprayCan,
  Truck,
  Armchair,
  Bed,
  Tv,
  Trees,
  Droplets,
  Zap,
  Bike,
  Flame,
  Star,
  Shield,
  ShieldCheck,
  ShieldAlert,
  HeartHandshake,
  Check,
  CheckCircle2,
  CheckCheck,
  CheckSquare,
  Ban,
  Lock,
  KeyRound,
  Calendar,
  CalendarCheck,
  Clock,
  Timer,
  AlarmClockCheck,
  Hourglass,
  MessageSquare,
  MessagesSquare,
  Mail,
  MailQuestion,
  MailPlus,
  Inbox,
  Phone,
  PhoneCall,
  Send,
  Bell,
  BellRing,
  Headphones,
  Headset,
  Share2,
  ThumbsUp,
  Quote,
  Smile,
  User,
  UserCog,
  UserCheck,
  LogIn,
  LogOut,
  BadgeCheck,
  Award,
  Plus,
  PlusCircle,
  ListPlus,
  Trash2,
  Pencil,
  FileEdit,
  Save,
  SlidersHorizontal,
  Bookmark,
  CreditCard,
  Wallet,
  Image,
  ImagePlus,
  ImageOff,
  Images,
  Camera,
  Paperclip,
  UploadCloud,
  FileText,
  FilePlus,
  ScrollText,
  Info,
  AlertTriangle,
  AlertCircle,
  Flag,
  Loader2,
  Gauge,
  Handshake,
  TrendingUp,
  Brain,
  Globe,
  WifiOff,
  LayoutGrid,
  Grid,
  Footprints,
  MousePointerClick,
  SmartphoneCharging,
  Bot,
  CircleHelp,
} from 'lucide-react'

/**
 * Mapping dictionary from Material Symbols names to optimized Lucide SVG components
 */
const ICON_MAP = {
  // Navigation & UI
  search: Search,
  search_off: SearchX,
  home: Home,
  home_pin: MapPin,
  menu: Menu,
  close: X,
  cancel: X,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  expand_more: ChevronDown,
  arrow_drop_down: ChevronDown,
  expand_less: ChevronUp,
  refresh: RotateCw,
  sync: RefreshCw,
  swap_horiz: ArrowLeftRight,
  zoom_in: ZoomIn,

  // Services & Trades
  handyman: Hammer,
  build: Wrench,
  build_circle: Wrench,
  home_repair_service: Wrench,
  construction: HardHat,
  engineering: Cog,
  cleaning_services: Sparkles,
  sanitizer: SprayCan,
  local_shipping: Truck,
  chair: Armchair,
  bed: Bed,
  tv: Tv,
  yard: Trees,
  plumbing: Droplets,
  electric_bolt: Zap,
  bolt: Zap,
  electric_moped: Bike,
  delivery_dining: Bike,
  local_fire_department: Flame,

  // Trust, Verification & Status
  star: Star,
  stars: Sparkles,
  verified: ShieldCheck,
  verified_user: ShieldCheck,
  shield: Shield,
  security: ShieldCheck,
  health_and_safety: ShieldAlert,
  shield_with_heart: HeartHandshake,
  check: Check,
  check_circle: CheckCircle2,
  task_alt: CheckCircle2,
  done_all: CheckCheck,
  assignment_turned_in: CheckSquare,
  block: Ban,
  lock: Lock,
  lock_reset: KeyRound,

  // Time & Calendar
  calendar_month: Calendar,
  calendar_today: Calendar,
  event: Calendar,
  event_available: CalendarCheck,
  schedule: Clock,
  timer: Timer,
  alarm_on: AlarmClockCheck,
  timelapse: Hourglass,
  hourglass_top: Hourglass,
  hourglass_bottom: Hourglass,

  // Communication & Social
  chat: MessageSquare,
  chat_bubble: MessageSquare,
  chat_bubble_outline: MessageSquare,
  forum: MessagesSquare,
  mail: Mail,
  mark_email_unread: MailQuestion,
  forward_to_inbox: MailPlus,
  inbox: Inbox,
  phone: Phone,
  call: PhoneCall,
  send: Send,
  notifications: Bell,
  notifications_active: BellRing,
  headset_mic: Headphones,
  support_agent: Headset,
  share: Share2,
  thumb_up: ThumbsUp,
  format_quote: Quote,
  sentiment_satisfied: Smile,

  // User & Accounts
  person: User,
  account_box: User,
  account_circle: User,
  manage_accounts: UserCog,
  person_search: UserCheck,
  login: LogIn,
  logout: LogOut,
  badge: BadgeCheck,
  workspace_premium: Award,

  // Actions & Management
  add: Plus,
  add_circle: PlusCircle,
  add_task: ListPlus,
  delete: Trash2,
  edit: Pencil,
  edit_note: FileEdit,
  edit_document: FileEdit,
  save: Save,
  tune: SlidersHorizontal,
  bookmark: Bookmark,
  payments: CreditCard,
  account_balance_wallet: Wallet,

  // Location & Map
  location_on: MapPin,
  pin_drop: MapPin,
  near_me: Navigation,
  my_location: LocateFixed,
  location_off: MapPinOff,
  map: Map,
  radar: Radio,

  // Media & Files
  image: Image,
  photo_camera: Camera,
  add_a_photo: Camera,
  photo_library: Images,
  add_photo_alternate: ImagePlus,
  image_not_supported: ImageOff,
  attach_file: Paperclip,
  cloud_upload: UploadCloud,
  description: FileText,
  post_add: FilePlus,
  history_edu: ScrollText,

  // Status & Feedback
  info: Info,
  warning: AlertTriangle,
  report: Flag,
  report_problem: AlertTriangle,
  error: AlertCircle,
  error_outline: AlertCircle,
  progress_activity: Loader2,

  // Extras
  speed: Gauge,
  handshake: Handshake,
  trending_up: TrendingUp,
  auto_awesome: Sparkles,
  psychology: Brain,
  public: Globe,
  language: Globe,
  wifi_off: WifiOff,
  shelves: LayoutGrid,
  grid_view: Grid,
  directions_run: Footprints,
  touch_app: MousePointerClick,
  install_mobile: SmartphoneCharging,
  android: Bot,
}

/**
 * High-performance Pure SVG Icon component for TaskMate
 * Replaces remote font icons with instant-render SVG vectors (0ms wait, 0 layout shifts)
 */
export default function Icon({
  name,
  size = 20,
  filled = false,
  className = '',
  style = {},
  ...props
}) {
  const normalized = String(name || '').trim().toLowerCase()
  const LucideIcon = ICON_MAP[normalized]

  // Parse numeric size from number or '20px' string
  const numericSize =
    typeof size === 'number'
      ? size
      : parseInt(String(size).replace('px', ''), 10) || 20

  // 1. Primary: Render instant pure SVG component
  if (LucideIcon) {
    return (
      <LucideIcon
        size={numericSize}
        className={`inline-block shrink-0 select-none ${className}`}
        fill={filled ? 'currentColor' : 'none'}
        strokeWidth={2}
        style={style}
        aria-hidden="true"
        {...props}
      />
    )
  }

  // 2. Fallback: If icon name not mapped, render generic SVG helper instead of broken text
  return (
    <CircleHelp
      size={numericSize}
      className={`inline-block shrink-0 select-none text-outline ${className}`}
      style={style}
      aria-hidden="true"
      {...props}
    />
  )
}
