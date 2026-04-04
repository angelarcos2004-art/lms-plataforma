import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import CourseCard from '../components/courses/CourseCard'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../hooks/useRole'
import { getMisCursos, getCursosByDocente, getTodosCursos } from '../lib/coursesService'
import { getAdminStats } from '../lib/socialService'

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
        if (!res.error) setCursos((res.data ?? []).map(i => i.cursos).filter(Boolean))
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
