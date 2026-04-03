export default function ConfirmModal({ open, title, description, confirmLabel = 'Eliminar', onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '1.5rem',
          padding: '2rem', maxWidth: '400px', width: '100%',
          boxShadow: '0 32px 72px rgba(0,0,0,0.3)',
        }}
      >
        {/* Icono */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(220,38,38,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>

        {/* Título */}
        <h3 style={{ margin: '0 0 0.5rem', textAlign: 'center', fontSize: '1.125rem', fontWeight: 800, color: 'var(--wine-800)' }}>
          {title}
        </h3>

        {/* Descripción */}
        {description && (
          <p style={{ margin: '0 0 1.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {description}
          </p>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: '0.75rem',
              border: '1px solid var(--wine-100)', background: 'white',
              color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(); onCancel() }}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: '0.75rem',
              border: 'none', background: '#DC2626',
              color: 'white', fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#B91C1C')}
            onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
