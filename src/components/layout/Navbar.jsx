import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import NotificationBell from '../notifications/NotificationBell'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { isDocente, isAdmin } = useRole()
  const { pathname } = useLocation()

  const displayName =
    profile?.nombre_completo ??
    user?.user_metadata?.nombre ??
    user?.user_metadata?.full_name ??
    user?.email ??
    'Usuario'
  const rolLabel = profile?.roles?.nombre ?? 'estudiante'

  return (
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
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo + Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'white' }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '4px', flexShrink: 0,
          }}>
            <img src="/logo-paideia.png" alt="Paideia" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Paideia</span>
        </Link>

        <nav style={{ display: 'flex', gap: '0.25rem' }}>
          <NavItem to="/" active={pathname === '/'}>Inicio</NavItem>
          <NavItem to="/courses" active={pathname.startsWith('/courses')}>Catálogo</NavItem>
          {(isDocente || isAdmin) && (
            <NavItem to="/courses/new" active={pathname === '/courses/new'}>+ Crear Curso</NavItem>
          )}
        </nav>
      </div>

      {/* User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <NotificationBell />
        <span style={{ fontSize: '0.875rem', opacity: 0.75 }}>{displayName}</span>

        <span style={{
          background: 'var(--gold)', color: 'var(--wine-900)',
          padding: '2px 10px', borderRadius: '9999px',
          fontSize: '0.72rem', fontWeight: 700,
          textTransform: 'capitalize', letterSpacing: '0.03em',
        }}>
          {rolLabel}
        </span>

        <button
          onClick={signOut}
          style={{
            background: 'rgba(255,255,255,0.12)', color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '6px 14px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '0.82rem', transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}

function NavItem({ to, active, children }) {
  return (
    <Link
      to={to}
      style={{
        color: active ? 'white' : 'rgba(255,255,255,0.7)',
        textDecoration: 'none',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: active ? 600 : 400,
        background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' } }}
    >
      {children}
    </Link>
  )
}
