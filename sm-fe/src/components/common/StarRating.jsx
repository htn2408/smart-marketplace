import Icon from './Icon'

/**
 * Standardized Star Rating Component
 */
export default function StarRating({
  score = 5.0,
  count,
  starsCount = 1,
  size = 18,
  showScore = true,
  className = '',
}) {
  return (
    <div className={`inline-flex items-center gap-1 text-secondary-fixed-dim ${className}`}>
      {Array.from({ length: starsCount }).map((_, index) => (
        <Icon
          key={index}
          name="star"
          size={size}
          filled={true}
          className="text-secondary"
        />
      ))}
      {showScore && (
        <span className="font-label-md text-label-md font-bold text-on-surface ml-0.5">
          {typeof score === 'number' ? score.toFixed(2).replace(/\.00$/, '') : score}
        </span>
      )}
      {count !== undefined && (
        <span className="font-caption text-caption text-outline font-medium">
          ({count} đánh giá)
        </span>
      )}
    </div>
  )
}
