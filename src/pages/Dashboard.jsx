import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()

  const rolLabel = profile?.roles?.nombre ?? 'estudiante'
  const displayName = profile?.nombre_completo ?? user?.email ?? 'Usuario'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Navbar */}
      <header
        style={{
          background: 'var(--wine-800)',
          color: 'white',
          padding: '0 2rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
          EduLMS
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', opacity: 0.75 }}>{displayName}</span>

          <span
            style={{
              background: 'var(--gold)',
              color: 'var(--wine-900)',
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'capitalize',
              letterSpacing: '0.03em',
            }}
          >
            {rolLabel}
          </span>

          <button
            onClick={signOut}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido placeholder */}
      <main style={{ maxWidth: '1200px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid var(--wine-100)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--wine-400), var(--wine-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>

          <h2
            style={{
              color: 'var(--wine-800)',
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: '0 0 0.5rem',
            }}
          >
            ¡Sesión iniciada correctamente!
          </h2>

          <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.25rem' }}>
            Bienvenido, <strong style={{ color: 'var(--wine-600)' }}>{displayName}</strong>
          </p>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            El dashboard completo estará disponible en el Wave 2.
          </p>
        </div>
      </main>
    </div>
  )
}
