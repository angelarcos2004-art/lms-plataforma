import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const SPIN_KEYFRAME = `
  @keyframes lms-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`

export default function Login() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGoogleSignIn() {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch {
      setError('No se pudo iniciar sesión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{SPIN_KEYFRAME}</style>

      {/* Pantalla completa centrada */}
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--wine-800) 0%, var(--wine-900) 100%)',
        }}
      >
        {/* Blob — arriba derecha */}
        <div
          style={{
            position: 'absolute',
            top: '-8%',
            right: '-4%',
            width: '420px',
            height: '420px',
            borderRadius: '9999px',
            background: 'var(--wine-400)',
            opacity: 0.25,
            filter: 'blur(64px)',
            pointerEvents: 'none',
          }}
        />

        {/* Blob — abajo izquierda */}
        <div
          style={{
            position: 'absolute',
            bottom: '-6%',
            left: '-4%',
            width: '340px',
            height: '340px',
            borderRadius: '9999px',
            background: 'var(--gold)',
            opacity: 0.18,
            filter: 'blur(64px)',
            pointerEvents: 'none',
          }}
        />

        {/* Blob — centro izquierda */}
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '8%',
            width: '200px',
            height: '200px',
            borderRadius: '9999px',
            background: 'var(--wine-200)',
            opacity: 0.12,
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* Tarjeta glassmorphism */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '420px',
            margin: '0 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Logo y nombre */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--wine-400), var(--wine-600))',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'white' }}>
                EduLMS
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                Plataforma de aprendizaje en línea
              </p>
            </div>
          </div>

          {/* Separador */}
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.15)' }} />

          {/* Texto de bienvenida */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>
              Bienvenido de vuelta
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
              Accede con tu cuenta institucional de Google
            </p>
          </div>

          {/* Botón Google */}
          <GoogleButton loading={loading} onClick={handleGoogleSignIn} />

          {/* Mensaje de error */}
          {error && (
            <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center', color: '#FCA5A5' }}>
              {error}
            </p>
          )}

          {/* Footer */}
          <p style={{ margin: 0, fontSize: '0.72rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            Al ingresar aceptas los términos y condiciones de la plataforma
          </p>
        </div>
      </div>
    </>
  )
}

function GoogleButton({ loading, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '1rem 1.5rem',
        borderRadius: '1rem',
        fontWeight: 600,
        fontSize: '1rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'white',
        background: loading
          ? 'var(--wine-200)'
          : hovered
          ? 'var(--wine-800)'
          : 'var(--wine-600)',
        boxShadow: hovered && !loading
          ? '0 8px 25px rgba(0,0,0,0.4)'
          : '0 4px 15px rgba(0,0,0,0.25)',
        transform: hovered && !loading ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? <Spinner /> : <GoogleIcon />}
      {loading ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
    </button>
  )
}

function Spinner() {
  return (
    <svg
      width="20"
      height="20"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      style={{ animation: 'lms-spin 1s linear infinite' }}
    >
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
