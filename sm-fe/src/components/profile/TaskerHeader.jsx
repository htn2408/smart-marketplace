import Icon from '../common/Icon'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { DEFAULT_AVATAR } from '../../assets/constants'

/**
 * Tasker Identity Header Card on Tasker Profile
 */
export default function TaskerHeader({
  name = 'Chưa cập nhật tên',
  avatar,
  profession = 'Đối tác Tasker trên TaskMate',
  completedTasks = 0,
  rating = 5.0,
  onMessage,
  isOwnerView = false,
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5">
          {/* Avatar Profile with Online Indicator & Gold Badge */}
          <div className="relative shrink-0">
            <img
              alt={`Chân dung ${name}`}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md ring-4 ring-primary/10"
              src={avatar || DEFAULT_AVATAR}
            />
            {/* Online Green Status Indicator */}
            <span
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-primary ring-2 ring-surface-container-lowest shadow-sm"
              title="Đang trực tuyến"
            />
            {/* Elite Tasker Badge Floating on Top */}
            <div className="absolute -top-2 -right-2">
              <Badge variant="gold" icon="workspace_premium" size="xs">
                Elite
              </Badge>
            </div>
          </div>

          {/* Main Name & Trust Verifications */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {name}
              </h1>
              <Badge
                variant="primary"
                icon="verified"
                title="TaskMate đã thẩm định giấy tờ tuỳ thân và hồ sơ tư pháp"
              >
                Đã xác thực danh tính
              </Badge>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
              <Icon name="handyman" size={18} className="text-tertiary" />
              <span>{profession}</span>
            </p>

            {/* Core Stats Lockup */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm">
                <Icon name="task_alt" size={18} className="text-primary" />
                <span>
                  <strong className="font-semibold text-on-surface">
                    {completedTasks}
                  </strong>{' '}
                  việc hoàn thành
                </span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm">
                <Icon name="star" size={18} className="text-amber-500" />
                <span>
                  <strong className="font-semibold text-on-surface">
                    {Number(rating || 5.0).toFixed(2)}
                  </strong>{' '}
                  điểm đánh giá
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        {!isOwnerView && onMessage && (
          <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Button
              variant="tonal"
              size="md"
              icon="chat"
              className="w-full sm:w-36 text-primary"
              onClick={onMessage}
            >
              Gửi tin nhắn
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
