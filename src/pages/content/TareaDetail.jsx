import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import {
  getTareaById,
  getEntregaByEstudiante,
  getEntregasByTarea,
  crearEntrega,
  calificarEntrega,
} from '../../lib/contentService'

export default function TareaDetail() {
  const { id: cursoId, tareaId } = useParams()
  const { user } = useAuth()
  const { isEstudiante, isDocente, isAdmin } = useRole()

  const [tarea, setTarea] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estudiante
  const [miEntrega, setMiEntrega] = useState(null)
  const [texto, setTexto] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState(null)

  // Docente
  const [entregas, setEntregas] = useState([])
  const [gradingId, setGradingId] = useState(null)
  const [gradeForm, setGradeForm] = useState({ calificacion: '', retroalimentacion: '' })
  const [savingGrade, setSavingGrade] = useState(false)

  const canEdit = isDocente || isAdmin

  useEffect(() => {
    async function cargar() {
      const { data: tareaData, error: err } = await getTareaById(tareaId)
      if (err || !tareaData) {
        setError('No se encontró la tarea.')
        setLoading(false)
        return
      }
      setTarea(tareaData)

      if (isEstudiante && user) {
        const { data } = await getEntregaByEstudiante(tareaId, user.id)
        setMiEntrega(data)
      }

      if (canEdit) {
        const { data } = await getEntregasByTarea(tareaId)
        setEntregas(data ?? [])
      }

      setLoading(false)
    }
    cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tareaId, user])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!texto.trim()) return
    setSubmitting(true)
    setSubmitMsg(null)
    const { data, error: err } = await crearEntrega(tareaId, user.id, texto.trim())
    setSubmitting(false)
    if (err) {
      setSubmitMsg({ tipo: 'error', texto: 'No se pudo enviar la entrega.' })
    } else {
      setMiEntrega(data)
      setTexto('')
      setSubmitMsg({ tipo: 'ok', texto: '¡Entrega enviada correctamente!' })
    }
  }

  async function handleCalificar(entregaId) {
    if (!gradeForm.calificacion) return
    setSavingGrade(true)
    const { data, error: err } = await calificarEntrega(
      entregaId,
      parseFloat(gradeForm.calificacion),
      gradeForm.retroalimentacion || null,
      user.id,
    )
    setSavingGrade(false)
    if (!err) {
      setEntregas(prev => prev.map(e => e.id === entregaId ? { ...e, ...data } : e))
      setGradingId(null)
      setGradeForm({ calificacion: '', retroalimentacion: '' })
    }
  }

  const vencida = tarea?.fecha_limite && new Date(tarea.fecha_limite) < new Date()
  const cursoTitulo = tarea?.unidades?.cursos?.titulo ?? 'Curso'
  const unidadTitulo = tarea?.unidades?.titulo ?? 'Unidad'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/courses" style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>Catálogo</Link>
          <span>›</span>
          <Link to={`/courses/${cursoId}`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>{cursoTitulo}</Link>
          <span>›</span>
          <Link to={`/courses/${cursoId}/content`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>{unidadTitulo}</Link>
          <span>›</span>
          <span>{tarea?.titulo ?? '...'}</span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando tarea...</div>
        )}
        {error && (
          <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        {!loading && tarea && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Info de la tarea */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0, color: 'var(--wine-800)', fontSize: '1.5rem', fontWeight: 800 }}>
                  {tarea.titulo}
                </h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {tarea.puntaje_maximo != null && (
                    <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'var(--wine-50)', color: 'var(--wine-800)', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--wine-100)' }}>
                      {tarea.puntaje_maximo} pts
                    </span>
                  )}
                  {tarea.fecha_limite && (
                    <span style={{ padding: '4px 12px', borderRadius: '6px', background: vencida ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)', color: vencida ? 'var(--error)' : 'var(--success)', fontSize: '0.8rem', fontWeight: 700, border: `1px solid ${vencida ? 'var(--error)' : 'var(--success)'}` }}>
                      {vencida ? 'Vencida' : 'Activa'} · {new Date(tarea.fecha_limite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {tarea.instrucciones && (
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {tarea.instrucciones}
                </p>
              )}
            </div>

            {/* Vista Estudiante */}
            {isEstudiante && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2rem' }}>
                <h2 style={{ margin: '0 0 1.25rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>
                  {miEntrega ? 'Mi Entrega' : 'Entregar Tarea'}
                </h2>

                {miEntrega ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Entrega existente */}
                    <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'var(--bg-section)', border: '1px solid var(--wine-100)' }}>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Enviada el {new Date(miEntrega.fecha_entrega).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                        {miEntrega.contenido_entrega}
                      </p>
                    </div>

                    {/* Calificación */}
                    {miEntrega.calificacion != null ? (
                      <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(22,163,74,0.08)', border: '1px solid var(--success)' }}>
                        <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>
                          Calificación: {miEntrega.calificacion}{tarea.puntaje_maximo != null ? ` / ${tarea.puntaje_maximo}` : ''} pts
                        </p>
                        {miEntrega.retroalimentacion && (
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                            {miEntrega.retroalimentacion}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(37,99,235,0.08)', border: '1px solid var(--info)' }}>
                        <p style={{ margin: 0, color: 'var(--info)', fontSize: '0.875rem', fontWeight: 600 }}>
                          Tu entrega está pendiente de calificación.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {vencida && (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)' }}>
                        <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.875rem' }}>
                          Esta tarea ya venció. Aun así puedes intentar entregar.
                        </p>
                      </div>
                    )}
                    <textarea
                      value={texto}
                      onChange={e => setTexto(e.target.value)}
                      placeholder="Escribe tu entrega aquí..."
                      rows={8}
                      style={{
                        padding: '0.75rem 1rem', borderRadius: '0.5rem',
                        border: '1px solid var(--wine-100)', outline: 'none',
                        fontSize: '0.875rem', lineHeight: 1.7, resize: 'vertical',
                        fontFamily: 'inherit', color: 'var(--text-primary)',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                    />
                    {submitMsg && (
                      <div style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', background: submitMsg.tipo === 'ok' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)', color: submitMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)', border: `1px solid ${submitMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)'}` }}>
                        {submitMsg.texto}
                      </div>
                    )}
                    <button
                      type="submit" disabled={submitting || !texto.trim()}
                      style={{ padding: '0.625rem 1.75rem', borderRadius: '0.5rem', border: 'none', background: submitting ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}
                    >
                      {submitting ? 'Enviando...' : 'Enviar entrega'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Vista Docente / Admin — lista de entregas */}
            {canEdit && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2rem' }}>
                <h2 style={{ margin: '0 0 1.25rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>
                  Entregas ({entregas.length})
                </h2>

                {entregas.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                    Ningún estudiante ha entregado aún.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {entregas.map(entrega => (
                      <div key={entrega.id} style={{ border: '1px solid var(--wine-100)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                        {/* Header entrega */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'var(--bg-section)', gap: '1rem', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--wine-800)', fontSize: '0.9rem' }}>
                              {entrega.usuarios?.nombre_completo ?? 'Estudiante'}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {new Date(entrega.fecha_entrega).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {entrega.calificacion != null ? (
                              <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(22,163,74,0.1)', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 700 }}>
                                {entrega.calificacion}{tarea.puntaje_maximo != null ? `/${tarea.puntaje_maximo}` : ''} pts
                              </span>
                            ) : (
                              <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(234,179,8,0.1)', color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 700 }}>
                                Sin calificar
                              </span>
                            )}
                            <button
                              onClick={() => { setGradingId(entrega.id === gradingId ? null : entrega.id); setGradeForm({ calificacion: entrega.calificacion ?? '', retroalimentacion: entrega.retroalimentacion ?? '' }) }}
                              style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--wine-200)', background: 'white', color: 'var(--wine-600)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {gradingId === entrega.id ? 'Cancelar' : 'Calificar'}
                            </button>
                          </div>
                        </div>

                        {/* Contenido entrega */}
                        <div style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', borderTop: '1px solid var(--wine-100)' }}>
                          {entrega.contenido_entrega}
                        </div>

                        {/* Retroalimentación existente */}
                        {entrega.retroalimentacion && gradingId !== entrega.id && (
                          <div style={{ padding: '0.75rem 1rem', background: 'rgba(22,163,74,0.05)', borderTop: '1px solid var(--wine-100)', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Retroalimentación: {entrega.retroalimentacion}
                          </div>
                        )}

                        {/* Formulario calificación */}
                        {gradingId === entrega.id && (
                          <div style={{ padding: '1rem', borderTop: '1px solid var(--wine-100)', background: 'var(--bg-section)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                  Calificación{tarea.puntaje_maximo != null ? ` / ${tarea.puntaje_maximo}` : ''}:
                                </label>
                                <input
                                  type="number" min="0" step="0.5"
                                  max={tarea.puntaje_maximo ?? undefined}
                                  value={gradeForm.calificacion}
                                  onChange={e => setGradeForm(p => ({ ...p, calificacion: e.target.value }))}
                                  style={{ width: '80px', padding: '0.375rem 0.5rem', borderRadius: '6px', border: '1px solid var(--wine-100)', fontSize: '0.875rem', outline: 'none' }}
                                />
                              </div>
                            </div>
                            <textarea
                              placeholder="Retroalimentación (opcional)..."
                              value={gradeForm.retroalimentacion}
                              onChange={e => setGradeForm(p => ({ ...p, retroalimentacion: e.target.value }))}
                              rows={2}
                              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--wine-100)', fontSize: '0.8rem', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleCalificar(entrega.id)}
                                disabled={savingGrade || !gradeForm.calificacion}
                                style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', background: 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                {savingGrade ? 'Guardando...' : 'Guardar calificación'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
