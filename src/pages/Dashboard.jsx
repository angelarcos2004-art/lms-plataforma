import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import CourseCard from '../components/courses/CourseCard'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../hooks/useRole'
import { getMisCursos, getCursosByDocente, getTodosCursos } from '../lib/coursesService'
import { getAdminStats } from '../lib/socialService'
import { getProgresoCursoEstudiante } from '../lib/contentService'

function MotivationalQuote() {
  const [quote, setQuote] = useState({ text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' })
  const [loading, setLoading] = useState(false)

  const fetchQuote = async () => {
    setLoading(true)
    try {
      // 1. Obtener cita en inglés
      const res = await fetch(`https://dummyjson.com/quotes/random?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('API 1 Fail')
      const data = await res.json()
      
      if (data && data.quote) {
        // 2. Traducir al español usando MyMemory Translation API
        const textToTranslate = encodeURIComponent(data.quote)
        const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${textToTranslate}&langpair=en|es`)
        
        let finalQuote = data.quote // Fallback a inglés por defecto
        if (transRes.ok) {
          const transData = await transRes.json()
          if (transData?.responseData?.translatedText) {
            finalQuote = transData.responseData.translatedText
          }
        }

        setQuote({ text: finalQuote, author: data.author })
        setLoading(false)
        return
      }
    } catch (e) {
      console.error('Error fetching quote APIs:', e)
      // Fallback local robusto (garantía de español si no hay internet)
      const locales = [
        { text: 'La educación es el arma más ponderosa para cambiar el mundo.', author: 'Nelson Mandela' },
        { text: 'Cree en ti mismo y en todo lo que eres.', author: 'Christian D. Larson' },
        { text: 'Aprender es descubrir que algo es posible.', author: 'Fritz Perls' },
        { text: 'El único modo de hacer un gran trabajo es amar lo que haces.', author: 'Steve Jobs' }
      ]
      setQuote(locales[Math.floor(Math.random() * locales.length)])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQuote()
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--wine-800), var(--wine-900))',
      color: 'white', padding: '1.5rem', borderRadius: '1rem',
      marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontStyle: 'italic', lineHeight: 1.5, opacity: 0.95 }}>
            "{quote.text}"
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold, #FBBF24)' }}>
            — {quote.author}
          </p>
        </div>
        <button
          onClick={fetchQuote}
          disabled={loading}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', padding: '0.5rem', borderRadius: '0.5rem',
            cursor: loading ? 'wait' : 'pointer', transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Nueva cita"
        >
          <svg style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { isAdmin, isDocente, isEstudiante } = useRole()

  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminStats, setAdminStats] = useState(null)

  const displayName =
    profile?.nombre_completo ??
    user?.user_metadata?.nombre ??
    user?.user_metadata?.full_name ??
    user?.email ??
    'Usuario'

  useEffect(() => {
    if (!user) return

    async function cargar() {
      let res
      if (isEstudiante) {
        res = await getMisCursos(user.id)
        if (!res.error) {
          const misCursos = (res.data ?? []).map(i => i.cursos).filter(Boolean)
          const conProgreso = await Promise.all(misCursos.map(async c => {
            const { avance } = await getProgresoCursoEstudiante(c.id, user.id)
            return { ...c, avance }
          }))
          setCursos(conProgreso)
        }
      } else if (isDocente) {
        res = await getCursosByDocente(user.id)
        if (!res.error) setCursos(res.data ?? [])
      } else if (isAdmin) {
        res = await getTodosCursos()
        if (!res.error) setCursos(res.data ?? [])
        const stats = await getAdminStats()
        setAdminStats(stats)
      }
      setLoading(false)
    }
    cargar()
  }, [user, isEstudiante, isDocente, isAdmin])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Saludo */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.75rem', fontWeight: 800 }}>
            ¡Hola, {displayName.split(' ')[0]}!
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {isEstudiante && 'Aquí están tus cursos inscritos.'}
            {isDocente && 'Gestiona tus cursos desde aquí.'}
            {isAdmin && 'Vista general de todos los cursos en la plataforma.'}
          </p>
        </div>

        {/* Motivational Quote para Estudiantes */}
        {isEstudiante && <MotivationalQuote />}

        {/* Stats admin */}
        {isAdmin && adminStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Usuarios', value: adminStats.totalUsuarios, color: 'var(--wine-600)' },
              { label: 'Cursos', value: adminStats.totalCursos, color: 'var(--info)' },
              { label: 'Inscripciones activas', value: adminStats.totalInscripciones, color: 'var(--success)' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.25rem' }}>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}


        {/* Sección de cursos */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--wine-800)', fontSize: '1.2rem', fontWeight: 700 }}>
            {isEstudiante && 'Mis Cursos Inscritos'}
            {isDocente && 'Mis Cursos'}
            {isAdmin && 'Todos los Cursos'}
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isEstudiante && (
              <Link
                to="/courses"
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                  background: 'var(--wine-600)', color: 'white',
                  textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--wine-800)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--wine-600)')}
              >
                Explorar catálogo
              </Link>
            )}
            {(isDocente || isAdmin) && (
              <Link
                to="/courses/new"
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                  background: 'var(--wine-600)', color: 'white',
                  textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--wine-800)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--wine-600)')}
              >
                + Crear curso
              </Link>
            )}
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Cargando cursos...
          </div>
        )}

        {/* Estado vacío */}
        {!loading && cursos.length === 0 && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
            borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--wine-400), var(--wine-600))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h2 style={{ color: 'var(--wine-800)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              {isEstudiante ? 'Aún no estás inscrito en ningún curso' : 'Aún no has creado ningún curso'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
              {isEstudiante ? 'Explora el catálogo y encuentra un curso que te interese.' : 'Crea tu primer curso para que los estudiantes puedan inscribirse.'}
            </p>
            {isEstudiante ? (
              <Link
                to="/courses"
                style={{
                  display: 'inline-block', padding: '0.625rem 1.5rem',
                  background: 'var(--wine-600)', color: 'white',
                  textDecoration: 'none', borderRadius: '0.5rem',
                  fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Ir al catálogo
              </Link>
            ) : (
              <Link
                to="/courses/new"
                style={{
                  display: 'inline-block', padding: '0.625rem 1.5rem',
                  background: 'var(--wine-600)', color: 'white',
                  textDecoration: 'none', borderRadius: '0.5rem',
                  fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Crear primer curso
              </Link>
            )}
          </div>
        )}

        {/* Grid de cursos */}
        {!loading && cursos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {cursos.map(curso => (
              <CourseCard
                key={curso.id}
                curso={curso}
                badge={isEstudiante ? 'Inscrito' : null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
