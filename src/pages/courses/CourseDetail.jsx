import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { getCursoById, checkInscripcion, inscribirse, desinscribirse } from '../../lib/coursesService'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isEstudiante, isDocente, isAdmin } = useRole()

  const [curso, setCurso] = useState(null)
  const [inscrito, setInscrito] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [actionMsg, setActionMsg] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data, error: err } = await getCursoById(id)
      if (err || !data) {
        setError('No se encontró el curso.')
        setLoading(false)
        return
      }
      setCurso(data)

      if (isEstudiante && user) {
        const { data: inscData } = await checkInscripcion(id, user.id)
        setInscrito(!!inscData)
      }

      setLoading(false)
    }
    cargar()
  }, [id, isEstudiante, user])

  async function handleInscribirse() {
    setActionLoading(true)
    setActionMsg(null)
    const { error: err } = await inscribirse(id, user.id)
    if (err) {
      setActionMsg({ tipo: 'error', texto: 'No se pudo completar la inscripción.' })
    } else {
      setInscrito(true)
      setActionMsg({ tipo: 'ok', texto: '¡Te inscribiste correctamente!' })
    }
    setActionLoading(false)
  }

  async function handleDesinscribirse() {
    setActionLoading(true)
    setActionMsg(null)
    const { error: err } = await desinscribirse(id, user.id)
    if (err) {
      setActionMsg({ tipo: 'error', texto: 'No se pudo cancelar la inscripción.' })
    } else {
      setInscrito(false)
      setActionMsg({ tipo: 'ok', texto: 'Inscripción cancelada.' })
    }
    setActionLoading(false)
  }

  const esDocente = isDocente && curso?.docente_id === user?.id

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <Link to="/courses" style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>Catálogo</Link>
          <span style={{ margin: '0 0.5rem' }}>›</span>
          <span>{curso?.titulo ?? '...'}</span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Cargando curso...
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)',
            borderRadius: '0.75rem', padding: '1rem 1.25rem', color: 'var(--error)',
          }}>
            {error}{' '}
            <button onClick={() => navigate('/courses')} style={{ background: 'none', border: 'none', color: 'var(--wine-600)', cursor: 'pointer', textDecoration: 'underline' }}>
              Volver al catálogo
            </button>
          </div>
        )}

        {!loading && curso && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header card */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
              borderRadius: '1rem', overflow: 'hidden',
            }}>
              {/* Banner */}
              <div style={{
                height: '200px',
                background: curso.imagen_url
                  ? `url(${curso.imagen_url}) center/cover`
                  : 'linear-gradient(135deg, var(--wine-800) 0%, var(--wine-600) 100%)',
                display: 'flex', alignItems: 'flex-end', padding: '1.5rem',
              }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>
                  {curso.titulo.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    {curso.categorias?.nombre && (
                      <span style={{
                        display: 'inline-block', marginBottom: '0.5rem',
                        background: 'var(--wine-50)', color: 'var(--wine-800)',
                        border: '1px solid var(--wine-100)',
                        padding: '2px 10px', borderRadius: '6px',
                        fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        {curso.categorias.nombre}
                      </span>
                    )}

                    <h1 style={{ margin: '0 0 0.5rem', color: 'var(--wine-800)', fontSize: '1.75rem', fontWeight: 800 }}>
                      {curso.titulo}
                    </h1>

                    {curso.usuarios?.nombre_completo && (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Impartido por <strong style={{ color: 'var(--wine-600)' }}>{curso.usuarios.nombre_completo}</strong>
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', minWidth: '160px' }}>
                    {isEstudiante && (
                      inscrito ? (
                        <button
                          onClick={handleDesinscribirse}
                          disabled={actionLoading}
                          style={{
                            padding: '0.625rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer',
                            border: '1px solid var(--wine-200)', background: 'white',
                            color: 'var(--wine-600)', fontWeight: 600, fontSize: '0.875rem',
                          }}
                        >
                          {actionLoading ? 'Procesando...' : 'Cancelar inscripción'}
                        </button>
                      ) : (
                        <button
                          onClick={handleInscribirse}
                          disabled={actionLoading}
                          style={{
                            padding: '0.625rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer',
                            border: 'none', background: 'var(--wine-600)',
                            color: 'white', fontWeight: 700, fontSize: '0.875rem',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--wine-800)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'var(--wine-600)')}
                        >
                          {actionLoading ? 'Inscribiendo...' : 'Inscribirme'}
                        </button>
                      )
                    )}

                    {(esDocente || isAdmin) && (
                      <Link
                        to={`/courses/${id}/edit`}
                        style={{
                          padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
                          background: 'var(--wine-50)', color: 'var(--wine-800)',
                          border: '1px solid var(--wine-100)',
                          textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
                          textAlign: 'center',
                        }}
                      >
                        Editar curso
                      </Link>
                    )}
                  </div>
                </div>

                {/* Mensaje de acción */}
                {actionMsg && (
                  <div style={{
                    marginTop: '1rem', padding: '0.625rem 1rem',
                    borderRadius: '0.5rem', fontSize: '0.875rem',
                    background: actionMsg.tipo === 'ok' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)',
                    color: actionMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)',
                    border: `1px solid ${actionMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)'}`,
                  }}>
                    {actionMsg.texto}
                  </div>
                )}
              </div>
            </div>

            {/* Descripción */}
            {curso.descripcion && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
                borderRadius: '1rem', padding: '1.75rem',
              }}>
                <h2 style={{ margin: '0 0 1rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>
                  Descripción
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {curso.descripcion}
                </p>
              </div>
            )}

            {/* CTA al foro del curso */}
            {(inscrito || esDocente || isAdmin) && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>Foro del curso</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Discute y resuelve dudas con tus compañeros.</p>
                </div>
                <Link to={`/courses/${id}/foro`} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.5rem', background: 'var(--info)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  Ir al foro
                </Link>
              </div>
            )}

            {/* CTA al contenido del curso */}
            {(inscrito || esDocente || isAdmin) && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
                borderRadius: '1rem', padding: '1.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '1rem', flexWrap: 'wrap',
              }}>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>
                    Contenido del curso
                  </h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Unidades, materiales y tareas.
                  </p>
                </div>
                <Link
                  to={`/courses/${id}/content`}
                  style={{
                    padding: '0.625rem 1.5rem', borderRadius: '0.5rem',
                    background: 'var(--wine-600)', color: 'white',
                    textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {esDocente || isAdmin ? 'Gestionar contenido' : 'Ir al contenido'}
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
