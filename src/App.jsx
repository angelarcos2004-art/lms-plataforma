import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import Login from './components/auth/Login'
import Dashboard from './pages/Dashboard'

function LoadingScreen() {
  return (
    <>
      <style>{`@keyframes lms-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'linear-gradient(135deg, var(--wine-800) 0%, var(--wine-900) 100%)',
        }}
      >
        <svg
          style={{ animation: 'lms-spin 1s linear infinite' }}
          width="40"
          height="40"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0 }}>
          Cargando...
        </p>
      </div>
    </>
  )
}

function UpdatePasswordScreen() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) return setError('La contraseña debe tener mínimo 6 caracteres.')
    try {
      setLoading(true)
      await updatePassword(password)
      // Al tener éxito, AuthContext limpiará el estado isRecoveringPassword
    } catch {
      setError('Hubo un error al actualizar la contraseña.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--wine-800), var(--wine-900))', padding: '1rem'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'rgba(255,255,255,0.1)', padding: '2.5rem', borderRadius: '1.5rem',
        backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.2)',
        color: 'white', display: 'flex', flexDirection: 'column', gap: '1.25rem',
        width: '100%', maxWidth: '400px', boxShadow: '0 25px 60px rgba(0,0,0,0.45)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>Actualiza tu contraseña</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
            Por tu seguridad, establece una nueva contraseña ahora mismo.
          </p>
        </div>
        <input 
          type="password" placeholder="Nueva contraseña" value={password} onChange={e=>setPassword(e.target.value)} required
          style={{ 
            padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', 
            background: 'rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '1rem'
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
        />
        {error && <p style={{ color: '#FCA5A5', margin: 0, fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}
        <button disabled={loading} style={{
          padding: '0.85rem', borderRadius: '0.75rem', border: 'none', fontSize: '0.95rem',
          background: 'var(--gold)', color: 'var(--wine-900)', fontWeight: 700, cursor: 'pointer',
          marginTop: '0.5rem'
        }}>
          {loading ? 'Guardando...' : 'Guardar y entrar'}
        </button>
      </form>
    </div>
  )
}

function App() {
  const { session, isRecoveringPassword } = useAuth()

  // undefined = supabase aún no respondió
  if (session === undefined) return <LoadingScreen />

  // null = sin sesión activa → forzar login
  if (!session) return <Login />

  // intercepts dashboard entry if coming via password recovery
  if (isRecoveringPassword) return <UpdatePasswordScreen />

  // sesión activa → dashboard
  return <Dashboard />
}

export default App
