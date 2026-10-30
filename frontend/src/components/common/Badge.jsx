import Icon from './Icon'

/**
 * Standardized Badge / Chip component
 */
export default function Badge({
  children,
  variant = 'primary',
  icon,
  iconFilled = false,
  className = '',
  size = 'sm',
}) {
  const variantStyles = {
    primary: 'bg-primary-fixed/40 text-primary font-semibold',
    primaryVariant: 'bg-primary-fixed text-on-primary-fixed-variant font-bold',
    secondary: 'bg-secondary-fixed text-on-secondary-fixed font-bold',
    gold: 'bg-secondary-container text-on-secondary-container font-bold shadow-sm',
    neutral: 'bg-surface-container-high text-on-surface-variant font-semibold',
    surface: 'bg-surface-container text-on-surface font-semibold',
    outline: 'border border-outline-variant text-outline font-semibold',
  }

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-label-sm gap-1.5',
    md: 'px-3 py-1 text-label-sm gap-2',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeStyles[size] || sizeStyles.sm} ${variantStyles[variant] || variantStyles.primary} ${className}`}
    >
      {icon && (
        <Icon
          name={icon}
          size={size === 'xs' ? 12 : 14}
          filled={iconFilled}
        />
      )}
      {children}
    </span>
  )
}
