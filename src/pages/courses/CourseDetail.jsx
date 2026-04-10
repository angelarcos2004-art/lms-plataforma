import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import {
  getCursoById, checkInscripcion, desinscribirse,
  inscribirseConCodigo, solicitarAcceso,
  getSolicitudesPendientes, aprobarSolicitud, rechazarSolicitud,
  eliminarCurso,
} from '../../lib/coursesService'
import ConfirmModal from '../../components/ui/ConfirmModal'
import CourseStudentsTab from '../../components/courses/CourseStudentsTab'
import CourseEnrollmentManager from '../../components/courses/CourseEnrollmentManager'
import SalaVirtual from '../../components/courses/SalaVirtual'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { isEstudiante, isDocente, isAdmin } = useRole()
  const displayName = profile?.nombre_completo ?? user?.email ?? 'Usuario'

  const [curso, setCurso] = useState(null)
  const [inscripcion, setInscripcion] = useState(null) // { id, estado } | null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estudiante
  const [codigo, setCodigo] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)

  // Docente / Admin
  const [solicitudes, setSolicitudes] = useState([])
  const [copiado, setCopiado] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)

  const [tabAlumnos, setTabAlumnos] = useState('gestion')

  const esDocente = isDocente && curso?.docente_id === user?.id
  const puedeGestionar = esDocente || isAdmin
  const inscritoActivo = inscripcion?.estado === 'activa'
  const inscritoFinalizado = inscripcion?.estado === 'finalizado'

  useEffect(() => {
    async function cargar() {
      const { data, error: err } = await getCursoById(id)
      if (err || !data) { setError('No se encontró el curso.'); setLoading(false); return }
      setCurso(data)

      if (isEstudiante && user) {
        const { data: inscData } = await checkInscripcion(id, user.id)
        setInscripcion(inscData ?? null)
      }

      if ((isDocente || isAdmin) && data) {
        const { data: sols } = await getSolicitudesPendientes(id)
        setSolicitudes(sols ?? [])
      }

      setLoading(false)
    }
    cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEstudiante, isDocente, isAdmin, user])

  async function handleInscribirseConCodigo(e) {
    e.preventDefault()
    if (!codigo.trim()) return setActionMsg({ tipo: 'error', texto: 'Ingresa el código de invitación.' })
    setActionLoading(true)
    setActionMsg(null)
    const { data, error: err } = await inscribirseConCodigo(id, codigo.trim())
    setActionLoading(false)
    if (err) {
      setActionMsg({ tipo: 'error', texto: err.message ?? 'Código incorrecto.' })
    } else {
      setInscripcion({ estado: 'activa' })
      setActionMsg({ tipo: 'ok', texto: '¡Te inscribiste correctamente!' })
    }
  }

  async function handleSolicitarAcceso() {
    setActionLoading(true)
    setActionMsg(null)
    const { error: err } = await solicitarAcceso(id, user.id)
    setActionLoading(false)
    if (err) {
      setActionMsg({ tipo: 'error', texto: 'No se pudo enviar la solicitud.' })
    } else {
      setInscripcion({ estado: 'pendiente' })
      setActionMsg({ tipo: 'ok', texto: 'Solicitud enviada. Espera la aprobación del docente.' })
    }
  }

  async function requestDesinscribirse() {
    setConfirmModal({
      title: '¿Cancelar inscripción?',
      description: 'Dejarás de pertenecer a este curso y no tendrás acceso al contenido ni a las calificaciones.',
      confirmLabel: 'Desinscribirme',
      onConfirm: async () => {
        setConfirmModal(null)
        setActionLoading(true)
        setActionMsg(null)
        const { error: err } = await desinscribirse(id, user.id)
        setActionLoading(false)
        if (err) {
          setActionMsg({ tipo: 'error', texto: 'No se pudo cancelar la inscripción.' })
        } else {
          setInscripcion(null)
          setActionMsg(null)
        }
      }
    })
  }

  async function handleAprobar(inscripcionId) {
    const { error: err } = await aprobarSolicitud(inscripcionId)
    if (!err) setSolicitudes(prev => prev.filter(s => s.id !== inscripcionId))
  }

  async function handleRechazar(inscripcionId) {
    const { error: err } = await rechazarSolicitud(inscripcionId)
    if (!err) setSolicitudes(prev => prev.filter(s => s.id !== inscripcionId))
  }

  function copiarCodigo() {
    if (!curso?.codigo_invitacion) return
    navigator.clipboard.writeText(curso.codigo_invitacion)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function handleEliminar() {
    const { error: err } = await eliminarCurso(id)
    if (err) {
      setShowDeleteModal(false)
      setError(`No se pudo eliminar el curso: ${err.message ?? err.code ?? JSON.stringify(err)}`)
    } else {
      navigate('/courses')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Breadcrumb + Regresar */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <Link to="/courses" style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>Catálogo</Link>
            <span style={{ margin: '0 0.5rem' }}>›</span>
            <span>{curso?.titulo ?? '...'}</span>
          </div>
          <Link to="/courses" style={{ fontSize: '0.8rem', color: 'var(--wine-600)', textDecoration: 'none' }}>
            ← Regresar al catálogo
          </Link>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando curso...</div>}

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)', borderRadius: '0.75rem', padding: '1rem 1.25rem', color: 'var(--error)' }}>
            {error}{' '}
            <button onClick={() => navigate('/courses')} style={{ background: 'none', border: 'none', color: 'var(--wine-600)', cursor: 'pointer', textDecoration: 'underline' }}>
              Volver al catálogo
            </button>
          </div>
        )}

        {!loading && curso && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── Header card ── */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', overflow: 'hidden' }}>
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
                      <span style={{ display: 'inline-block', marginBottom: '0.5rem', background: 'var(--wine-50)', color: 'var(--wine-800)', border: '1px solid var(--wine-100)', padding: '2px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {curso.categorias.nombre}
                      </span>
                    )}
                    <h1 style={{ margin: '0 0 0.5rem', color: 'var(--wine-800)', fontSize: '1.75rem', fontWeight: 800 }}>{curso.titulo}</h1>
                    {curso.usuarios?.nombre_completo && (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Impartido por <strong style={{ color: 'var(--wine-600)' }}>{curso.usuarios.nombre_completo}</strong>
                      </p>
                    )}
                  </div>

                  {/* Botones editar / eliminar (docente/admin) */}
                  {puedeGestionar && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link to={`/courses/${id}/edit`} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: 'var(--wine-50)', color: 'var(--wine-800)', border: '1px solid var(--wine-100)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        Editar curso
                      </Link>
                      {(isAdmin || esDocente) && (
                        <button onClick={() => setShowDeleteModal(true)} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: 'var(--error)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Eliminar curso
                        </button>
                      )}
                    </div>
                  )}

                  {/* Botón cancelar inscripción (estudiante activo) */}
                  {isEstudiante && inscritoActivo && (
                    <button onClick={requestDesinscribirse} disabled={actionLoading} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid var(--wine-200)', background: 'white', color: 'var(--wine-600)', fontWeight: 600, fontSize: '0.875rem' }}>
                      {actionLoading ? 'Procesando...' : 'Cancelar inscripción'}
                    </button>
                  )}
                </div>

                {actionMsg && (
                  <div style={{ marginTop: '1rem', padding: '0.625rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', background: actionMsg.tipo === 'ok' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)', color: actionMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)', border: `1px solid ${actionMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)'}` }}>
                    {actionMsg.texto}
                  </div>
                )}
              </div>
            </div>

            {/* ── Descripción ── */}
            {curso.descripcion && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.75rem' }}>
                <h2 style={{ margin: '0 0 1rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>Descripción</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{curso.descripcion}</p>
              </div>
            )}

            {/* ── ESTUDIANTE: Acceso al curso ── */}
            {isEstudiante && !inscritoActivo && !inscritoFinalizado && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.75rem' }}>

                {inscripcion?.estado === 'pendiente' ? (
                  /* Solicitud en espera */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(234,179,8,0.12)', border: '1px solid var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--wine-800)', fontSize: '0.95rem' }}>Solicitud pendiente</p>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>El docente revisará tu solicitud pronto.</p>
                      </div>
                    </div>
                    <button onClick={requestDesinscribirse} disabled={actionLoading} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--wine-100)', borderRadius: '0.375rem', padding: '0.375rem 0.875rem', cursor: 'pointer' }}>
                      Cancelar solicitud
                    </button>
                  </div>
                ) : (
                  /* Sin inscripción: código o solicitud */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <h2 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>Unirse al curso</h2>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Ingresa el código de invitación o solicita acceso al docente.</p>
                    </div>

                    {/* Formulario código */}
                    <form onSubmit={handleInscribirseConCodigo} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input
                        value={codigo}
                        onChange={e => setCodigo(e.target.value.toUpperCase())}
                        placeholder="Código de invitación"
                        maxLength={12}
                        style={{ flex: '1 1 180px', padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.1em', outline: 'none', color: 'var(--wine-800)', background: 'var(--bg-page)' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                      />
                      <button type="submit" disabled={actionLoading || !codigo.trim()} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: actionLoading ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: actionLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                        {actionLoading ? 'Verificando...' : 'Unirme con código'}
                      </button>
                    </form>

                    {/* Separador */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, height: '1px', background: 'var(--wine-100)' }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>o sin código</span>
                      <div style={{ flex: 1, height: '1px', background: 'var(--wine-100)' }} />
                    </div>

                    {/* Solicitar acceso */}
                    <button onClick={handleSolicitarAcceso} disabled={actionLoading} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: '1px solid var(--wine-200)', background: 'white', color: 'var(--wine-700)', fontWeight: 600, fontSize: '0.875rem', cursor: actionLoading ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
                      Solicitar acceso al docente
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── DOCENTE/ADMIN: Código de invitación ── */}
            {puedeGestionar && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.5rem' }}>
                <h2 style={{ margin: '0 0 0.875rem', color: 'var(--wine-800)', fontSize: '1rem', fontWeight: 700 }}>Código de invitación</h2>
                {curso.codigo_invitacion ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--wine-800)', background: 'var(--wine-50)', border: '1px solid var(--wine-100)', padding: '0.5rem 1.25rem', borderRadius: '0.5rem' }}>
                      {curso.codigo_invitacion}
                    </span>
                    <button onClick={copiarCodigo} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', background: copiado ? 'rgba(22,163,74,0.08)' : 'white', color: copiado ? 'var(--success)' : 'var(--wine-600)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                      {copiado ? '✓ Copiado' : 'Copiar'}
                    </button>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Comparte este código con tus estudiantes</span>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Este curso no tiene código aún. <Link to={`/courses/${id}/edit`} style={{ color: 'var(--wine-600)' }}>Edita el curso</Link> para generar uno.
                  </p>
                )}
              </div>
            )}

            {/* ── DOCENTE/ADMIN: Solicitudes pendientes ── */}
            {puedeGestionar && solicitudes.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.5rem' }}>
                <h2 style={{ margin: '0 0 1rem', color: 'var(--wine-800)', fontSize: '1rem', fontWeight: 700 }}>
                  Solicitudes de acceso <span style={{ background: 'var(--wine-600)', color: 'white', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.75rem', marginLeft: '0.375rem' }}>{solicitudes.length}</span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {solicitudes.map(sol => (
                    <div key={sol.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'var(--bg-page)', border: '1px solid var(--wine-100)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--wine-400), var(--wine-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                          {(sol.usuarios?.nombre_completo ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{sol.usuarios?.nombre_completo ?? 'Estudiante'}</p>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{new Date(sol.fecha_inscripcion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleAprobar(sol.id)} style={{ padding: '0.375rem 0.875rem', borderRadius: '0.375rem', border: 'none', background: 'rgba(22,163,74,0.1)', color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                          Aprobar
                        </button>
                        <button onClick={() => handleRechazar(sol.id)} style={{ padding: '0.375rem 0.875rem', borderRadius: '0.375rem', border: 'none', background: 'rgba(220,38,38,0.08)', color: 'var(--error)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Foro (solo inscritos activos / docente / admin) ── */}
            {(inscritoActivo || inscritoFinalizado || puedeGestionar) && (
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

            {/* ── Contenido (solo inscritos activos / docente / admin) ── */}
            {(inscritoActivo || inscritoFinalizado || puedeGestionar) && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>Contenido del curso</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Unidades, materiales y tareas.</p>
                </div>
                <Link to={`/courses/${id}/content`} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.5rem', background: 'var(--wine-600)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {puedeGestionar ? 'Gestionar contenido' : 'Ir al contenido'}
                </Link>
              </div>
            )}

            {/* ── SALA VIRTUAL (inscritos activos + docente + admin) ── */}
            {(inscritoActivo || inscritoFinalizado || puedeGestionar) && (
              <SalaVirtual
                cursoId={id}
                cursoTitulo={curso?.titulo}
                userName={displayName}
                esDocente={puedeGestionar}
              />
            )}

            {/* ── PANEL ALUMNOS CON PESTAÑAS (solo docente/admin) ── */}
            {puedeGestionar && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', overflow: 'hidden' }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--wine-100)' }}>
                  {[
                    { key: 'gestion', label: 'Gestión de Alumnos' },
                    { key: 'calificaciones', label: 'Lista y Calificaciones' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setTabAlumnos(tab.key)}
                      style={{
                        flex: 1, padding: '0.75rem 0.5rem',
                        background: tabAlumnos === tab.key ? 'var(--bg-page)' : 'transparent',
                        color: tabAlumnos === tab.key ? 'var(--wine-800)' : 'var(--text-secondary)',
                        border: 'none',
                        borderBottom: tabAlumnos === tab.key ? '2px solid var(--wine-600)' : '2px solid transparent',
                        fontWeight: tabAlumnos === tab.key ? 700 : 500,
                        fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                        cursor: 'pointer', transition: 'all 0.15s',
                        lineHeight: 1.3, textAlign: 'center',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {/* Tab content */}
                <div style={{ padding: '1.75rem' }}>
                  {tabAlumnos === 'gestion'
                    ? <CourseEnrollmentManager cursoId={id} embedded />
                    : <CourseStudentsTab cursoId={id} embedded />
                  }
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Modal eliminar curso */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '1.25rem', padding: '2rem', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h2 style={{ margin: '0 0 0.5rem', color: 'var(--wine-800)', fontSize: '1.2rem', fontWeight: 800, textAlign: 'center' }}>
              ¿Eliminar este curso?
            </h2>
            <p style={{ margin: '0 0 0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
              Estás a punto de eliminar <strong style={{ color: 'var(--wine-800)' }}>{curso?.titulo}</strong>.
            </p>
            <p style={{ margin: '0 0 1.75rem', color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center' }}>
              Se borrarán también todas sus unidades, contenidos, evaluaciones e inscripciones. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '0.625rem', border: '1px solid var(--wine-100)', background: 'white', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '0.625rem', border: 'none', background: 'var(--error)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal confirmación general */}
      <ConfirmModal
        open={confirmModal !== null}
        title={confirmModal?.title ?? ''}
        description={confirmModal?.description}
        confirmLabel={confirmModal?.confirmLabel}
        onConfirm={confirmModal?.onConfirm ?? (() => {})}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  )
}
