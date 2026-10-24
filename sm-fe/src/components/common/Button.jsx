import Icon from './Icon'

/**
 * Standardized Button component for TaskMate Design System
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  iconFilled = false,
  fullWidth = false,
  disabled = false,
  className = '',
  href,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all select-none rounded-lg active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-label-sm gap-1.5 rounded-md',
    md: 'px-5 py-2.5 text-label-md gap-2 rounded-lg',
    lg: 'px-8 py-3.5 text-label-lg gap-2.5 rounded-xl shadow-md hover:shadow-lg',
    pill: 'px-4 py-2 text-label-md rounded-full gap-2',
    iconOnly: 'p-2 rounded-full',
  }

  const variantStyles = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-container shadow-sm hover:shadow',
    primaryContainer:
      'bg-primary-container hover:bg-primary text-on-primary shadow-md hover:shadow-lg',
    secondary:
      'bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container shadow-md hover:shadow-lg',
    outline:
      'bg-surface-container-lowest text-primary ring-1 ring-primary/20 hover:bg-primary-container hover:text-on-primary-container shadow-sm',
    ghost:
      'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
    tonal:
      'bg-surface-container-low text-on-surface hover:bg-surface-container',
    tonalHigh:
      'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
    white:
      'bg-surface-container-lowest text-primary hover:bg-surface-container-low shadow-md',
  }

  const computedClass = [
    baseStyles,
    sizeStyles[size] || sizeStyles.md,
    variantStyles[variant] || variantStyles.primary,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const renderIcon = (iconName) => {
    if (!iconName) return null
    if (typeof iconName === 'string') {
      const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18
      return <Icon name={iconName} size={iconSize} filled={iconFilled} />
    }
    return iconName
  }

  if (href) {
    return (
      <a href={href} className={computedClass} {...props}>
        {icon && iconPosition === 'left' && renderIcon(icon)}
        {children}
        {icon && iconPosition === 'right' && renderIcon(icon)}
      </a>
    )
  }

  return (
    <button
      type={type}
      className={computedClass}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && iconPosition === 'left' && renderIcon(icon)}
      {children}
      {icon && iconPosition === 'right' && renderIcon(icon)}
    </button>
  )
}
