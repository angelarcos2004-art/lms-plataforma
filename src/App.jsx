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

function App() {
  const { session } = useAuth()

  // undefined = supabase aún no respondió
  if (session === undefined) return <LoadingScreen />

  // null = sin sesión activa → forzar login
  if (!session) return <Login />

  // sesión activa → dashboard
  return <Dashboard />
}

export default App
