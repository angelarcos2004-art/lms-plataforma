export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={['bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--wine-100)] p-6', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={['mb-4', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={['text-lg font-semibold text-[var(--text-primary)]', className].join(' ')}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={['text-[var(--text-secondary)]', className].join(' ')}>
      {children}
    </div>
  )
}
