import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const SPIN_KEYFRAME = `
  @keyframes lms-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`

export default function Login() {
  const { signInWithGoogle, signInWithPassword, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot_password'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Campos
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function switchMode(next) {
    setMode(next)
    setError(null)
    setSuccess(null)
    setNombre('')
    setEmail('')
    setPassword('')
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch {
      setError('No se pudo iniciar sesión con Google. Intenta de nuevo.')
      setLoading(false)
    }
  }

  async function handleEmailLogin(e) {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      await signInWithPassword(email, password)
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : 'No se pudo iniciar sesión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await signUp(email, password, nombre)
      setSuccess('Cuenta creada. Revisa tu correo para confirmar tu cuenta.')
      setLoading(false)
    } catch (err) {
      setError(err.message.includes('already registered')
        ? 'Este correo ya está registrado.'
        : 'No se pudo crear la cuenta. Intenta de nuevo.')
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await resetPassword(email)
      setSuccess('Si el correo existe, recibirás un enlace de recuperación en breve.')
      setLoading(false)
    } catch {
      setError('No se pudo enviar el enlace de recuperación. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{SPIN_KEYFRAME}</style>

      {/* Pantalla completa */}
      <div style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--wine-800) 0%, var(--wine-900) 100%)',
      }}>

        {/* Blob arriba derecha */}
        <div style={{
          position: 'absolute', top: '-8%', right: '-4%',
          width: '420px', height: '420px', borderRadius: '9999px',
          background: 'var(--wine-400)', opacity: 0.25, filter: 'blur(64px)', pointerEvents: 'none',
        }} />

        {/* Blob abajo izquierda */}
        <div style={{
          position: 'absolute', bottom: '-6%', left: '-4%',
          width: '340px', height: '340px', borderRadius: '9999px',
          background: 'var(--gold)', opacity: 0.18, filter: 'blur(64px)', pointerEvents: 'none',
        }} />

        {/* Blob centro izquierda */}
        <div style={{
          position: 'absolute', top: '38%', left: '8%',
          width: '200px', height: '200px', borderRadius: '9999px',
          background: 'var(--wine-200)', opacity: 0.12, filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        {/* Tarjeta glassmorphism */}
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '420px', margin: '0 1rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
          borderRadius: '1.5rem', padding: '2.5rem',
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'white',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              padding: '8px'
            }}>
              <img src="/logo-paideia.png" alt="Paideia Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'white' }}>
                Paideia
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                Plataforma de aprendizaje en línea
              </p>
            </div>
          </div>

          {/* Tabs */}
          {mode !== 'forgot_password' && (
            <div style={{
              width: '100%', display: 'flex', gap: '0',
              background: 'rgba(0,0,0,0.2)', borderRadius: '0.75rem', padding: '4px',
            }}>
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1, padding: '0.5rem',
                    borderRadius: '0.6rem', border: 'none',
                    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                    background: mode === m ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: mode === m ? 'white' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>
          )}

          {/* Formulario login */}
          {mode === 'login' && (
            <form onSubmit={handleEmailLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <InputField
                type="email" placeholder="Correo electrónico"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <InputField
                type="password" placeholder="Contraseña"
                value={password} onChange={e => setPassword(e.target.value)} required
              />

              <SubmitButton loading={loading} label="Inicia sesión" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ width: '170px', textAlign: 'right' }}>¿Olvidaste tu contraseña?</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); switchMode('forgot_password'); }} style={{ width: '90px', textAlign: 'left', color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Haz clic aquí</a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ width: '170px', textAlign: 'right' }}>¿Eres nuevo aquí?</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); switchMode('register'); }} style={{ width: '90px', textAlign: 'left', color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Regístrate</a>
                </div>
              </div>
            </form>
          )}

          {/* Formulario registro */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <InputField
                type="text" placeholder="Nombre completo"
                value={nombre} onChange={e => setNombre(e.target.value)} required
              />
              <InputField
                type="email" placeholder="Correo electrónico"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <InputField
                type="password" placeholder="Contraseña (mínimo 6 caracteres)"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
              <SubmitButton loading={loading} label="Registrarse" />

              <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                ¿Ya tienes una cuenta?&nbsp;&nbsp;<a href="#" onClick={(e) => { e.preventDefault(); switchMode('login'); }} style={{ color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Inicia sesión</a>
              </div>
            </form>
          )}

          {/* Formulario Recuperar Contraseña */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleResetPassword} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                Ingresa tu correo y te enviaremos un enlace mágico para recuperar el acceso a tu cuenta.
              </div>
              <InputField
                type="email" placeholder="Correo electrónico"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <SubmitButton loading={loading} label="Enviar enlace de recuperación" />

              <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                ¿Lo recordaste?&nbsp;&nbsp;<a href="#" onClick={(e) => { e.preventDefault(); switchMode('login'); }} style={{ color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Volver a Iniciar sesión</a>
              </div>
            </form>
          )}

          {/* Mensajes */}
          {error && (
            <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center', color: '#FCA5A5' }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center', color: '#86EFAC' }}>
              {success}
            </p>
          )}

          {/* Divisor */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              o continuar con
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Botón Google */}
          <GoogleButton loading={loading} onClick={handleGoogleSignIn} />

          {/* Footer */}
          <p style={{ margin: 0, fontSize: '0.72rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            Al ingresar aceptas los términos y condiciones de la plataforma
          </p>
        </div>
      </div>
    </>
  )
}

function InputField({ type, placeholder, value, onChange, required }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={{
        width: '100%', padding: '0.75rem 1rem',
        borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.08)', color: 'white',
        fontSize: '0.9rem', outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
    />
  )
}

function SubmitButton({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%', padding: '0.85rem',
        borderRadius: '0.75rem', border: 'none',
        background: loading ? 'var(--wine-200)' : 'var(--wine-600)',
        color: 'white', fontWeight: 600, fontSize: '0.95rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'background 0.2s',
      }}
    >
      {loading ? 'Procesando...' : label}
    </button>
  )
}

function GoogleButton({ loading, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.75rem', padding: '0.85rem 1.5rem',
        borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.95rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        border: '1px solid rgba(255,255,255,0.15)', color: 'white',
        background: loading ? 'var(--wine-200)' : hovered ? 'var(--wine-800)' : 'rgba(255,255,255,0.08)',
        boxShadow: hovered && !loading ? '0 8px 25px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.25)',
        transform: hovered && !loading ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'background 0.25s, box-shadow 0.25s, transform 0.2s',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? <SpinnerIcon /> : <GoogleIcon />}
      Google
    </button>
  )
}

function SpinnerIcon() {
  return (
    <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      style={{ animation: 'lms-spin 1s linear infinite' }}>
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
