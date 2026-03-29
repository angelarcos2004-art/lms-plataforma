const variants = {
  primary: 'bg-[var(--wine-600)] text-[var(--text-on-wine)] hover:bg-[var(--wine-800)] focus-visible:ring-[var(--wine-400)]',
  secondary: 'bg-transparent text-[var(--wine-600)] border border-[var(--wine-600)] hover:bg-[var(--wine-100)] focus-visible:ring-[var(--wine-400)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--wine-100)] focus-visible:ring-[var(--wine-400)]',
  danger: 'bg-[var(--error)] text-white hover:opacity-90 focus-visible:ring-red-400',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
