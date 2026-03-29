const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-[3px]',
}

export function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={[
        'inline-block rounded-full border-[var(--wine-200)] border-t-[var(--wine-600)] animate-spin',
        sizes[size],
        className,
      ].join(' ')}
    />
  )
}
