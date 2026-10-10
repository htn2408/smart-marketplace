/**
 * Standardized Material Symbols Outlined Icon component
 */
export default function Icon({
  name,
  size = 20,
  filled = false,
  className = '',
  style = {},
  ...props
}) {
  const customStyle = {
    fontSize: typeof size === 'number' ? `${size}px` : size,
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    ...style,
  }

  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={customStyle}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  )
}
