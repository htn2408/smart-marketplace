import Icon from '../common/Icon'
import Button from '../common/Button'
import Badge from '../common/Badge'
import StarRating from '../common/StarRating'

/**
 * Standardized Tasker Card Component
 * Supports both 'home' grid variant and 'search' list with AI match variant
 */
export default function TaskerCard({
  tasker,
  variant = 'home',
  onSelect,
  onMessage,
  onViewProfile,
}) {
  const {
    name,
    avatar,
    badge = 'Elite Tasker',
    jobsCount,
    rating = 5.0,
    reviewsCount,
    distance,
    matchScore,
    responseTime = '5 phút',
    aiMatchTitle,
    aiMatchPoints = [],
    quote,
    quoteAuthor,
    specialties = [],
    equipments = [],
    availableTime,
    priceText,
    priceSubtext,
  } = tasker

  if (variant === 'search') {
    return (
      <article className="bg-surface-container-lowest rounded-xl p-6 shadow-md transition-all hover:shadow-lg relative overflow-hidden flex flex-col gap-4">
        {/* Top Accent Ribbon for best match */}
        {matchScore && matchScore >= 95 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-secondary-container" />
        )}

        {/* Header: Avatar, Name, Badges, Price/Match */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-1">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={name}
                className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-primary/10"
              />
              <span
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow text-[10px]"
                title="Đã xác minh danh tính VNeID"
              >
                <Icon name="verified" size={13} filled={true} />
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  {name}
                </h3>
                <Badge variant="gold" icon="stars" iconFilled={true}>
                  {badge}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-on-surface-variant font-body-sm text-body-sm">
                <StarRating
                  score={rating}
                  count={reviewsCount}
                  size={16}
                  starsCount={1}
                />
                {distance && (
                  <>
                    <span className="text-outline-variant">•</span>
                    <span>Cách {distance}</span>
                  </>
                )}
                {jobsCount && (
                  <>
                    <span className="text-outline-variant">•</span>
                    <span className="text-primary font-medium">
                      {jobsCount} hoàn thành đúng hẹn
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Match Pill & Status */}
          <div className="flex flex-col items-start sm:items-end shrink-0">
            {matchScore && (
              <Badge variant="primaryVariant" icon="bolt">
                Match AI: {matchScore}/100
              </Badge>
            )}
            <div className="pt-2 text-left sm:text-right space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Sẵn sàng nhận việc
              </span>
              <p className="font-caption text-caption text-on-surface-variant flex items-center gap-1 sm:justify-end">
                <Icon name="schedule" size={14} />
                Phản hồi: ~{responseTime}
              </p>
            </div>
          </div>
        </div>

        {/* AI Match Explanation Block if available */}
        {aiMatchTitle && (
          <div className="bg-surface-container-low rounded-lg p-3.5">
            <div className="flex items-start gap-2.5">
              <Icon
                name="psychology"
                size={20}
                className="text-primary shrink-0 mt-0.5"
              />
              <div className="font-body-sm text-body-sm text-on-surface space-y-1">
                <p className="font-semibold text-primary">{aiMatchTitle}</p>
                {aiMatchPoints.length > 0 && (
                  <div className="flex flex-wrap gap-y-1 gap-x-4 text-on-surface-variant font-caption text-caption">
                    {aiMatchPoints.map((point, index) => (
                      <span key={index} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {point}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quote / Introduction */}
        {quote && (
          <p className="font-body-sm text-body-sm text-on-surface bg-surface p-3.5 rounded-lg italic">
            "{quote}"
          </p>
        )}

        {/* Equipments & Arrival Schedule */}
        {(equipments.length > 0 || availableTime) && (
          <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 border-t border-surface-variant/40">
            {equipments.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-caption text-caption text-on-surface-variant font-semibold">
                  Đồ nghề:
                </span>
                {equipments.map((tool, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-surface-container font-caption text-caption text-on-surface"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
            {availableTime && (
              <div className="flex items-center gap-1.5 text-on-surface font-label-sm text-label-sm">
                <Icon name="alarm_on" size={16} className="text-primary" />
                <span>
                  Khung giờ: <strong>{availableTime}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Button Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-surface-variant/40">
          <Button
            variant="tonalHigh"
            size="sm"
            icon="account_box"
            onClick={() => onViewProfile && onViewProfile(tasker)}
          >
            Xem hồ sơ ({reviewsCount || 186} việc)
          </Button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="tonal"
              size="sm"
              icon="chat"
              onClick={() => onMessage && onMessage(tasker)}
            >
              Nhắn tin
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="send"
              iconPosition="left"
              onClick={() => onSelect && onSelect(tasker)}
            >
              Mời thợ (Offer 450k)
            </Button>
          </div>
        </div>
      </article>
    )
  }

  // Default 'home' variant: Clean Card
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Header: Avatar & Info */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt={name}
              className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-primary/10"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <Icon
                name="check"
                size={11}
                className="text-on-primary font-bold"
              />
            </span>
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">
                {name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" icon="workspace_premium" size="xs">
                {badge}
              </Badge>
              {jobsCount && (
                <Badge variant="primary" size="xs">
                  {jobsCount}
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <StarRating score={rating} count={reviewsCount} size={18} />
            </div>
          </div>
        </div>

        {/* Specialties */}
        {specialties.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-surface-container-low flex flex-col gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
            {specialties.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Icon
                  name={item.icon || 'verified'}
                  size={18}
                  className="text-primary"
                />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Customer Review Snippet */}
        {quote && (
          <div className="mt-4 p-3 rounded-lg bg-surface-container font-body-sm text-body-sm text-on-surface-variant italic relative">
            <Icon
              name="format_quote"
              size={20}
              className="absolute top-2 right-2 text-outline-variant not-italic"
            />
            "{quote}"
            {quoteAuthor && (
              <div className="not-italic font-label-sm text-label-sm font-bold text-on-surface mt-2">
                — {quoteAuthor}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Price & CTA */}
      <div className="mt-6 pt-4 flex items-center justify-between gap-3 border-t border-surface-variant/30">
        <div>
          <span className="font-caption text-caption text-outline block">
            Thù lao mong muốn
          </span>
          <span className="font-headline-sm text-headline-sm font-extrabold text-primary">
            {priceText || 'từ 180.000₫'}
          </span>
          <span className="font-caption text-caption text-on-surface-variant">
            {priceSubtext || '/h (Thương lượng)'}
          </span>
        </div>
        <Button
          variant="primaryContainer"
          size="sm"
          icon="assignment_turned_in"
          onClick={() => onSelect && onSelect(tasker)}
        >
          Gửi đề xuất việc
        </Button>
      </div>
    </div>
  )
}
