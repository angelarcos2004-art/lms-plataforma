import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import {
  getCuestionarioConPreguntas,
  getIntentoEstudiante,
  getIntentosByQuiz,
  crearIntento,
  submitIntento,
} from '../../lib/quizService'

// Fases para estudiante: 'loading' | 'intro' | 'taking' | 'results' | 'error'
// Para docente: 'loading' | 'docente' | 'error'

export default function QuizAttempt() {
  const { id: cursoId, quizId } = useParams()
  const { user } = useAuth()
  const { isEstudiante, isDocente, isAdmin } = useRole()

  const [quiz, setQuiz] = useState(null)
  const [phase, setPhase] = useState('loading')

  // Estudiante
  const [intentoActual, setIntentoActual] = useState(null)
  const [respuestas, setRespuestas] = useState({}) // { pregunta_id: { opcion_id, es_correcta } }
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState(null) // { puntaje_obtenido, puntaje_maximo, respuestasMap }

  // Timer
  const [timeLeft, setTimeLeft] = useState(null)
  const timerRef = useRef(null)

  // Docente
  const [intentos, setIntentos] = useState([])

  const canEdit = isDocente || isAdmin

  const startTimer = useCallback((segundos) => {
    setTimeLeft(segundos)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // Auto-submit cuando el timer llega a 0
  useEffect(() => {
    if (timeLeft === 0 && phase === 'taking') {
      handleSubmit(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    async function cargar() {
      const { data, error } = await getCuestionarioConPreguntas(quizId)
      if (error || !data) { setPhase('error'); return }

      // Ordenar preguntas y opciones
      data.preguntas = [...(data.preguntas ?? [])].sort((a, b) => a.orden - b.orden)
      data.preguntas.forEach(p => {
        p.opciones_respuesta = [...(p.opciones_respuesta ?? [])].sort((a, b) => a.orden - b.orden)
      })
      setQuiz(data)

      if (canEdit) {
        const { data: att } = await getIntentosByQuiz(quizId)
        setIntentos(att ?? [])
        setPhase('docente')
        return
      }

      if (isEstudiante && user) {
        const { data: intento } = await getIntentoEstudiante(quizId, user.id)
        if (intento?.fecha_fin) {
          // Reconstruir resultado desde respuestas guardadas
          const respMap = {}
          for (const r of intento.respuestas_estudiante ?? []) {
            respMap[r.pregunta_id] = r.opcion_seleccionada_id
          }
          setResultado({
            puntaje_obtenido: intento.puntaje_obtenido,
            puntaje_maximo: intento.puntaje_maximo,
            respuestasMap: respMap,
          })
          setPhase('results')
          return
        }
        if (intento && !intento.fecha_fin) {
          // Intento sin terminar → continuar
          setIntentoActual(intento)
          if (data.tiempo_limite_minutos) {
            const elapsed = Math.floor((Date.now() - new Date(intento.fecha_inicio)) / 1000)
            const remaining = data.tiempo_limite_minutos * 60 - elapsed
            if (remaining > 0) startTimer(remaining)
            else { /* ya venció, mostrar directamente */ }
          }
          setPhase('taking')
          return
        }
        setPhase('intro')
      }
    }
    if (user !== undefined) cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, user, isEstudiante, canEdit])

  async function handleIniciar() {
    const { data, error } = await crearIntento(quizId, user.id)
    if (error || !data) return
    setIntentoActual(data)
    if (quiz.tiempo_limite_minutos) startTimer(quiz.tiempo_limite_minutos * 60)
    setPhase('taking')
  }

  async function handleSubmit(autoSubmit = false) {
    if (submitting) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const preguntas = quiz.preguntas
    let puntajeObtenido = 0
    let puntajeMaximo = 0
    const respuestasData = []

    for (const p of preguntas) {
      puntajeMaximo += parseFloat(p.puntaje) || 1
      const sel = respuestas[p.id]
      if (sel) {
        const esCorrecta = sel.es_correcta
        if (esCorrecta) puntajeObtenido += parseFloat(p.puntaje) || 1
        respuestasData.push({
          intento_id: intentoActual.id,
          pregunta_id: p.id,
          opcion_seleccionada_id: sel.opcion_id,
          es_correcta: esCorrecta,
        })
      }
    }

    const { error } = await submitIntento(intentoActual.id, respuestasData, puntajeObtenido, puntajeMaximo)

    setSubmitting(false)
    if (error) return

    const respMap = {}
    for (const r of respuestasData) respMap[r.pregunta_id] = r.opcion_seleccionada_id
    setResultado({ puntaje_obtenido: puntajeObtenido, puntaje_maximo: puntajeMaximo, respuestasMap: respMap })
    setPhase('results')
  }

  const cursoTitulo = quiz?.unidades?.cursos?.titulo ?? 'Curso'
  const unidadTitulo = quiz?.unidades?.titulo ?? 'Unidad'
  const ahora = new Date()
  const disponible = !quiz?.fecha_disponible || new Date(quiz.fecha_disponible) <= ahora
  const vencido = quiz?.fecha_limite && new Date(quiz.fecha_limite) < ahora

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          <Link to={`/courses/${cursoId}`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>{cursoTitulo}</Link>
          <span>›</span>
          <Link to={`/courses/${cursoId}/content`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>{unidadTitulo}</Link>
          <span>›</span>
          <span>{quiz?.titulo ?? '...'}</span>
        </div>

        {phase === 'loading' && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando...</div>
        )}

        {phase === 'error' && (
          <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)', color: 'var(--error)' }}>
            No se encontró el cuestionario.
          </div>
        )}

        {/* ── INTRO ── */}
        {phase === 'intro' && quiz && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--wine-400), var(--wine-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h1 style={{ margin: '0 0 0.5rem', color: 'var(--wine-800)', fontSize: '1.5rem', fontWeight: 800 }}>{quiz.titulo}</h1>
            {quiz.descripcion && <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)' }}>{quiz.descripcion}</p>}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <Stat label="Preguntas" value={quiz.preguntas.length} />
              <Stat label="Puntaje total" value={`${quiz.preguntas.reduce((s, p) => s + (parseFloat(p.puntaje) || 1), 0)} pts`} />
              {quiz.tiempo_limite_minutos && <Stat label="Tiempo límite" value={`${quiz.tiempo_limite_minutos} min`} />}
              {quiz.fecha_limite && <Stat label="Fecha límite" value={new Date(quiz.fecha_limite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />}
            </div>

            {!disponible && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(234,179,8,0.1)', border: '1px solid var(--warning)', color: '#92400e', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Este cuestionario estará disponible a partir del {new Date(quiz.fecha_disponible).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}.
              </div>
            )}
            {vencido && disponible && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Este cuestionario ya venció. Aún puedes intentarlo.
              </div>
            )}

            <button
              onClick={handleIniciar}
              disabled={!disponible}
              style={{ padding: '0.75rem 2.5rem', borderRadius: '0.5rem', border: 'none', background: disponible ? 'var(--wine-600)' : 'var(--wine-200)', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: disponible ? 'pointer' : 'not-allowed' }}
            >
              Iniciar cuestionario
            </button>
          </div>
        )}

        {/* ── TAKING ── */}
        {phase === 'taking' && quiz && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header con timer */}
            <div style={{ background: 'var(--wine-800)', borderRadius: '1rem', padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{quiz.titulo}</h1>
              {timeLeft !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: timeLeft < 60 ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Preguntas */}
            {quiz.preguntas.map((p, idx) => (
              <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: respuestas[p.id] ? 'var(--wine-600)' : 'var(--wine-50)', border: `2px solid ${respuestas[p.id] ? 'var(--wine-600)' : 'var(--wine-200)'}`, color: respuestas[p.id] ? 'white' : 'var(--wine-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>{p.texto_pregunta}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '2.5rem' }}>
                  {p.opciones_respuesta.map(op => {
                    const selected = respuestas[p.id]?.opcion_id === op.id
                    return (
                      <label
                        key={op.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.625rem 1rem', borderRadius: '0.5rem',
                          border: `1px solid ${selected ? 'var(--wine-600)' : 'var(--wine-100)'}`,
                          background: selected ? 'rgba(123,45,59,0.06)' : 'var(--bg-page)',
                          cursor: 'pointer', transition: 'all 0.1s',
                        }}
                      >
                        <input
                          type="radio"
                          name={`p-${p.id}`}
                          checked={selected}
                          onChange={() => setRespuestas(prev => ({ ...prev, [p.id]: { opcion_id: op.id, es_correcta: op.es_correcta } }))}
                          style={{ accentColor: 'var(--wine-600)', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{op.texto_opcion}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Enviar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {Object.keys(respuestas).length}/{quiz.preguntas.length} respondidas
              </span>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                style={{ padding: '0.75rem 2rem', borderRadius: '0.5rem', border: 'none', background: submitting ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Enviando...' : 'Enviar respuestas'}
              </button>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && quiz && resultado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Score card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2rem', textAlign: 'center' }}>
              <h1 style={{ margin: '0 0 1rem', color: 'var(--wine-800)', fontSize: '1.5rem', fontWeight: 800 }}>{quiz.titulo}</h1>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: getScoreColor(resultado.puntaje_obtenido, resultado.puntaje_maximo), margin: '0 0 0.25rem' }}>
                {resultado.puntaje_obtenido}<span style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/{resultado.puntaje_maximo}</span>
              </div>
              <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                {resultado.puntaje_maximo > 0 ? Math.round((resultado.puntaje_obtenido / resultado.puntaje_maximo) * 100) : 0}% correcto
              </p>
              {/* Barra progreso */}
              <div style={{ height: '10px', borderRadius: '9999px', background: 'var(--wine-100)', overflow: 'hidden', maxWidth: '400px', margin: '0 auto' }}>
                <div style={{ height: '100%', borderRadius: '9999px', background: getScoreColor(resultado.puntaje_obtenido, resultado.puntaje_maximo), width: `${resultado.puntaje_maximo > 0 ? (resultado.puntaje_obtenido / resultado.puntaje_maximo) * 100 : 0}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>

            {/* Detalle por pregunta */}
            <h2 style={{ margin: '0', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>Revisión de respuestas</h2>
            {quiz.preguntas.map((p, idx) => {
              const selectedId = resultado.respuestasMap[p.id]
              const selectedOpcion = p.opciones_respuesta.find(o => o.id === selectedId)
              const correctaOpcion = p.opciones_respuesta.find(o => o.es_correcta)
              const esCorrecta = selectedOpcion?.es_correcta === true
              const noRespondida = !selectedId

              return (
                <div key={p.id} style={{ background: 'var(--bg-card)', border: `1px solid ${noRespondida ? 'var(--wine-100)' : esCorrecta ? 'var(--success)' : 'var(--error)'}`, borderRadius: '1rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: noRespondida ? 'var(--wine-100)' : esCorrecta ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem' }}>
                      {noRespondida ? '—' : esCorrecta ? '✓' : '✗'}
                    </span>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, flex: 1 }}>{idx + 1}. {p.texto_pregunta}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', paddingLeft: '2.25rem' }}>
                    {p.opciones_respuesta.map(op => {
                      const isSelected = op.id === selectedId
                      const isCorrect = op.es_correcta
                      let bg = 'var(--bg-page)', border = 'var(--wine-100)', color = 'var(--text-primary)'
                      if (isCorrect) { bg = 'rgba(22,163,74,0.08)'; border = 'var(--success)'; color = 'var(--success)' }
                      if (isSelected && !isCorrect) { bg = 'rgba(220,38,38,0.08)'; border = 'var(--error)'; color = 'var(--error)' }
                      return (
                        <div key={op.id} style={{ padding: '0.5rem 0.875rem', borderRadius: '0.5rem', border: `1px solid ${border}`, background: bg, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', flexShrink: 0 }}>
                            {isCorrect ? '✓' : isSelected ? '✗' : '○'}
                          </span>
                          <span style={{ fontSize: '0.875rem', color, fontWeight: isCorrect || isSelected ? 600 : 400 }}>
                            {op.texto_opcion}
                            {isSelected && !isCorrect && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem' }}>(tu respuesta)</span>}
                            {isCorrect && !isSelected && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem' }}>(respuesta correcta)</span>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <Link to={`/courses/${cursoId}/content`} style={{ alignSelf: 'flex-start', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', background: 'var(--wine-600)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
              ← Volver al curso
            </Link>
          </div>
        )}

        {/* ── DOCENTE ── */}
        {phase === 'docente' && quiz && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                  <h1 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.4rem', fontWeight: 800 }}>{quiz.titulo}</h1>
                  {quiz.descripcion && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{quiz.descripcion}</p>}
                </div>
                <Link to={`/courses/${cursoId}/cuestionarios/${quizId}/editar`} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', background: 'var(--wine-50)', color: 'var(--wine-800)', border: '1px solid var(--wine-100)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  Editar cuestionario
                </Link>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <Stat label="Preguntas" value={quiz.preguntas.length} />
                <Stat label="Puntaje total" value={`${quiz.preguntas.reduce((s, p) => s + (parseFloat(p.puntaje) || 1), 0)} pts`} />
                {quiz.tiempo_limite_minutos && <Stat label="Tiempo" value={`${quiz.tiempo_limite_minutos} min`} />}
                <Stat label="Intentos" value={intentos.length} />
              </div>
            </div>

            <h2 style={{ margin: 0, color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>
              Intentos de estudiantes ({intentos.length})
            </h2>

            {intentos.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Ningún estudiante ha completado este cuestionario aún.
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', overflow: 'hidden' }}>
                {intentos.map((intento, i) => {
                  const pct = intento.puntaje_maximo > 0 ? Math.round((intento.puntaje_obtenido / intento.puntaje_maximo) * 100) : 0
                  return (
                    <div key={intento.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderTop: i === 0 ? 'none' : '1px solid var(--wine-100)', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {intento.usuarios?.nombre_completo ?? 'Estudiante'}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(intento.fecha_fin).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '80px', height: '6px', borderRadius: '9999px', background: 'var(--wine-100)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '9999px', background: getScoreColor(intento.puntaje_obtenido, intento.puntaje_maximo), width: `${pct}%` }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: getScoreColor(intento.puntaje_obtenido, intento.puntaje_maximo), minWidth: '80px', textAlign: 'right' }}>
                          {intento.puntaje_obtenido}/{intento.puntaje_maximo} ({pct}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScoreColor(obtenido, maximo) {
  if (!maximo) return 'var(--text-secondary)'
  const pct = obtenido / maximo
  if (pct >= 0.7) return 'var(--success)'
  if (pct >= 0.4) return 'var(--warning)'
  return 'var(--error)'
}

function Stat({ label, value }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--wine-800)' }}>{value}</span>
    </div>
  )
}
