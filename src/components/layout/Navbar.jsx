import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { useDarkMode } from '../../hooks/useDarkMode'
import NotificationBell from '../notifications/NotificationBell'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { isDocente, isAdmin } = useRole()
  const { pathname } = useLocation()
  const [dark, toggleDark] = useDarkMode()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName =
    profile?.nombre_completo ??
    user?.user_metadata?.nombre ??
    user?.user_metadata?.full_name ??
    user?.email ??
    'Usuario'
  const rolLabel = profile ? (profile?.roles?.nombre ?? 'estudiante') : '...'

  const navLinks = [
    { to: '/', label: 'Inicio', show: true, active: pathname === '/' },
    { to: '/courses', label: 'Catálogo', show: !isAdmin && !isDocente, active: pathname.startsWith('/courses') },
    { to: '/courses/new', label: '+ Crear Curso', show: isDocente || isAdmin, active: pathname === '/courses/new' },
    { to: '/calendario', label: '📅 Calendario', show: true, active: pathname === '/calendario' },
    { to: '/staff', label: '💬 Sala de Staff', show: isDocente || isAdmin, active: pathname === '/staff' },
    { to: '/soporte', label: 'Soporte', show: true, active: pathname === '/soporte' },
    { to: '/admin', label: 'Panel Admin', show: isAdmin, active: pathname === '/admin' },
  ].filter(l => l.show)

  return (
    <header className="paideia-navbar" style={{ background: 'var(--navbar-bg)' }}>
      {/* Logo + Nav desktop */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'white', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
            <img src="/logo-paideia.png" alt="Paideia" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Paideia</span>
        </Link>

        {/* Nav desktop */}
        <nav className="navbar-nav-desktop">
          {navLinks.map(l => <NavItem key={l.to} to={l.to} active={l.active}>{l.label}</NavItem>)}
        </nav>
      </div>

      {/* Controles derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <NotificationBell />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title={dark ? 'Modo claro' : 'Modo oscuro'}
          style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', width: '34px', height: '34px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Nombre + rol (oculto en móvil pequeño) */}
        <span className="navbar-username" style={{ fontSize: '0.875rem', opacity: 0.75 }}>{displayName}</span>
        <span style={{ background: 'var(--gold)', color: 'var(--wine-900)', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.03em', flexShrink: 0 }}>
          {rolLabel}
        </span>

        <button
          onClick={signOut}
          className="navbar-signout"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', transition: 'background 0.2s', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        >
          Salir
        </button>

        {/* Hamburguesa (solo móvil) */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {menuOpen && (
        <nav className="navbar-mobile-menu">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', padding: '0.75rem 1rem',
                color: l.active ? 'white' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none', fontWeight: l.active ? 600 : 400,
                background: l.active ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderRadius: '6px', fontSize: '0.9rem',
              }}
            >
              {l.label}
            </Link>
          ))}
          <button onClick={signOut} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.9rem', borderRadius: '6px' }}>
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  )
}

function NavItem({ to, active, children }) {
  return (
    <Link
      to={to}
      style={{
        color: active ? 'white' : 'rgba(255,255,255,0.7)',
        textDecoration: 'none', padding: '6px 12px', borderRadius: '8px',
        fontSize: '0.875rem', fontWeight: active ? 600 : 400,
        background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' } }}
    >
      {children}
    </Link>
  )
}
