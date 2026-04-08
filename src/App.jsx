import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import Login from './components/auth/Login'
import Dashboard from './pages/Dashboard'
import CourseCatalog from './pages/courses/CourseCatalog'
import CourseDetail from './pages/courses/CourseDetail'
import CourseForm from './pages/courses/CourseForm'
import CourseContent from './pages/content/CourseContent'
import TareaDetail from './pages/content/TareaDetail'
import QuizForm from './pages/quiz/QuizForm'
import QuizAttempt from './pages/quiz/QuizAttempt'
import ForoPage from './pages/forum/ForoPage'
import HiloPage from './pages/forum/HiloPage'
import SoportePage from './pages/support/SoportePage'
import AdminPanel from './pages/admin/AdminPanel'
import StaffRoom from './pages/support/StaffRoom'
import FaqChatbot from './components/ui/FaqChatbot'

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
  const { session, profile, isRecoveringPassword } = useAuth()

  // undefined = supabase aún no respondió o perfil no ha cargado totalmente
  if (session === undefined || (session && profile === undefined)) return <LoadingScreen />

  // null = sin sesión activa → forzar login
  if (!session) return <Login />

  if (profile && profile.activo === false) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--wine-900)', color: 'white', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Cuenta desactivada</h1>
        <p style={{ opacity: 0.8 }}>Tu cuenta ha sido desactivada por un administrador temporalmente. Si crees que se trata de un error o deseas validar la razón, por favor usa nuestro Chatbot de Asistencia en la esquina inferior derecha para obtener instrucciones de contacto.</p>
        <button onClick={() => supabase.auth.signOut()} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: 'var(--gold)', color: 'var(--wine-900)', fontWeight: 700, cursor: 'pointer' }}>
          Cerrar sesión
        </button>
        <FaqChatbot />
      </div>
    )
  }

  // intercepts dashboard entry if coming via password recovery
  if (isRecoveringPassword) return <UpdatePasswordScreen />

  // sesión activa → app con rutas
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/new" element={<CourseForm />} />
        <Route path="/courses/:id/edit" element={<CourseForm />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:id/content" element={<CourseContent />} />
        <Route path="/courses/:id/tareas/:tareaId" element={<TareaDetail />} />
        <Route path="/courses/:id/cuestionarios/nuevo" element={<QuizForm />} />
        <Route path="/courses/:id/cuestionarios/:quizId/editar" element={<QuizForm />} />
        <Route path="/courses/:id/cuestionarios/:quizId" element={<QuizAttempt />} />
        <Route path="/courses/:id/foro" element={<ForoPage />} />
        <Route path="/courses/:id/foro/:hiloId" element={<HiloPage />} />
        <Route path="/soporte" element={<SoportePage />} />
        <Route path="/staff" element={<StaffRoom />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FaqChatbot />
    </BrowserRouter>
  )
}

export default App
