export default function AlertModal({ open, title, description, onClose }) {
  if (!open) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem',
        maxWidth: '400px', width: '90%', textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--wine-100)'
      }}>
        {/* Icono de advertencia */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(220, 38, 38, 0.1)', color: 'var(--error)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <svg style={{ width: '32px', height: '32px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: 'var(--wine-800)' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {description}
        </p>
        
        <button
          onClick={onClose}
          style={{
            background: 'var(--wine-600)', color: 'white', border: 'none',
            padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.2s', width: '100%'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--wine-800)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--wine-600)'}
        >
          Entendido
        </button>
      </div>
    </div>
  )
}
