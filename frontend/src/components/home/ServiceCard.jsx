import Icon from '../common/Icon'

/**
 * Service category card for Homepage
 */
export default function ServiceCard({
  icon,
  iconBgColor = 'primary',
  title,
  description,
  priceText,
  onClick,
}) {
  const iconContainerStyles = {
    primary:
      'bg-primary-fixed/30 text-primary group-hover:bg-primary group-hover:text-on-primary',
    secondary:
      'bg-secondary-fixed/40 text-secondary group-hover:bg-secondary-container group-hover:text-on-secondary-container',
    tonal:
      'bg-surface-container-high text-primary group-hover:bg-primary group-hover:text-on-primary',
  }

  return (
    <div
      onClick={onClick}
      className="group bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer border border-transparent hover:border-primary/10"
    >
      <div className="flex flex-col gap-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
            iconContainerStyles[iconBgColor] || iconContainerStyles.primary
          }`}
        >
          <Icon name={icon} size={28} />
        </div>
        <div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 flex items-center justify-between border-t border-surface-variant/30">
        <span className="font-caption text-caption text-outline font-medium">
          Khách thường đề xuất
        </span>
        <span className="font-label-md text-label-md font-bold text-primary">
          {priceText}
        </span>
      </div>
    </div>
  )
}
