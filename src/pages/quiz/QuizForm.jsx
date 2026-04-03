import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useRole } from '../../hooks/useRole'
import { getCursoById } from '../../lib/coursesService'
import {
  getCuestionarioConPreguntas,
  crearCuestionario,
  actualizarCuestionario,
  crearPregunta,
  crearOpciones,
} from '../../lib/quizService'

const newOpcion = (key) => ({ _key: key, texto_opcion: '', es_correcta: false })
const newPregunta = (key) => ({
  _key: key,
  texto_pregunta: '',
  puntaje: 1,
  opciones: [newOpcion(0), newOpcion(1), newOpcion(2), newOpcion(3)],
})

export default function QuizForm() {
  const { id: cursoId, quizId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isDocente, isAdmin } = useRole()

  const unidadId = searchParams.get('unidadId')
  const isEdit = !!quizId

  const [cursoTitulo, setCursoTitulo] = useState('')
  const [meta, setMeta] = useState({
    titulo: '',
    descripcion: '',
    fecha_disponible: '',
    fecha_limite: '',
    tiempo_limite_minutos: '',
    mostrar_resultados: true,
  })
  const [preguntas, setPreguntas] = useState([newPregunta(0)])
  const [nextKey, setNextKey] = useState(1)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data: curso } = await getCursoById(cursoId)
      if (curso) setCursoTitulo(curso.titulo)

      if (isEdit) {
        const { data, error: err } = await getCuestionarioConPreguntas(quizId)
        if (err || !data) { setError('No se encontró el cuestionario.'); setLoading(false); return }
        setMeta({
          titulo: data.titulo ?? '',
          descripcion: data.descripcion ?? '',
          fecha_disponible: data.fecha_disponible ? data.fecha_disponible.slice(0, 16) : '',
          fecha_limite: data.fecha_limite ? data.fecha_limite.slice(0, 16) : '',
          tiempo_limite_minutos: data.tiempo_limite_minutos ?? '',
          mostrar_resultados: data.mostrar_resultados ?? true,
        })
        // Preguntas existentes → read-only (no editar preguntas ya usadas en intentos)
        const pregs = [...(data.preguntas ?? [])].sort((a, b) => a.orden - b.orden)
        setPreguntas(pregs.map((p, i) => ({
          _key: i,
          _saved: true, // ya existe en DB, solo mostrar
          id: p.id,
          texto_pregunta: p.texto_pregunta,
          puntaje: p.puntaje,
          opciones: [...(p.opciones_respuesta ?? [])].sort((a, b) => a.orden - b.orden).map((o, j) => ({
            _key: j, _saved: true, id: o.id,
            texto_opcion: o.texto_opcion, es_correcta: o.es_correcta,
          })),
        })))
        setNextKey(pregs.length)
        setLoading(false)
      }
    }
    cargar()
  }, [cursoId, quizId, isEdit])

  // ── Handlers de preguntas ────────────────────────────────────────────────────

  function addPregunta() {
    setPreguntas(prev => [...prev, newPregunta(nextKey)])
    setNextKey(k => k + 1)
  }

  function removePregunta(key) {
    setPreguntas(prev => prev.filter(p => p._key !== key))
  }

  function updatePregunta(key, field, value) {
    setPreguntas(prev => prev.map(p => p._key === key ? { ...p, [field]: value } : p))
  }

  function addOpcion(pKey) {
    setPreguntas(prev => prev.map(p => {
      if (p._key !== pKey) return p
      const nk = Math.max(...p.opciones.map(o => o._key)) + 1
      return { ...p, opciones: [...p.opciones, newOpcion(nk)] }
    }))
  }

  function updateOpcion(pKey, oKey, field, value) {
    setPreguntas(prev => prev.map(p => {
      if (p._key !== pKey) return p
      const opciones = p.opciones.map(o => {
        if (field === 'es_correcta') {
          // radio: solo una correcta por pregunta
          return { ...o, es_correcta: o._key === oKey ? value : false }
        }
        return o._key === oKey ? { ...o, [field]: value } : o
      })
      return { ...p, opciones }
    }))
  }

  function removeOpcion(pKey, oKey) {
    setPreguntas(prev => prev.map(p => {
      if (p._key !== pKey) return p
      return { ...p, opciones: p.opciones.filter(o => o._key !== oKey) }
    }))
  }

  // ── Validación ───────────────────────────────────────────────────────────────

  function validate() {
    if (!meta.titulo.trim()) return 'El título es obligatorio.'
    const nuevas = preguntas.filter(p => !p._saved)
    for (const p of nuevas) {
      if (!p.texto_pregunta.trim()) return 'Todas las preguntas deben tener texto.'
      if (p.opciones.length < 2) return 'Cada pregunta debe tener al menos 2 opciones.'
      if (p.opciones.some(o => !o.texto_opcion.trim())) return 'Todas las opciones deben tener texto.'
      if (!p.opciones.some(o => o.es_correcta)) return 'Cada pregunta debe tener una opción correcta marcada.'
    }
    return null
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────

  async function handleSave(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) return setError(validationError)

    setSaving(true)
    setError(null)

    const metaPayload = {
      titulo: meta.titulo.trim(),
      descripcion: meta.descripcion.trim() || null,
      fecha_disponible: meta.fecha_disponible || null,
      fecha_limite: meta.fecha_limite || null,
      tiempo_limite_minutos: meta.tiempo_limite_minutos ? parseInt(meta.tiempo_limite_minutos) : null,
      mostrar_resultados: meta.mostrar_resultados,
    }

    let quizDbId = quizId ? parseInt(quizId) : null

    if (isEdit) {
      const { error: err } = await actualizarCuestionario(quizDbId, metaPayload)
      if (err) { setError('No se pudo actualizar el cuestionario.'); setSaving(false); return }
    } else {
      const { data, error: err } = await crearCuestionario({ ...metaPayload, unidad_id: parseInt(unidadId) })
      if (err) { setError('No se pudo crear el cuestionario.'); setSaving(false); return }
      quizDbId = data.id
    }

    // Guardar solo las preguntas nuevas (no las ya guardadas en edit mode)
    const nuevasPreguntas = preguntas.filter(p => !p._saved)
    for (let i = 0; i < nuevasPreguntas.length; i++) {
      const p = nuevasPreguntas[i]
      const { data: pregData, error: pregErr } = await crearPregunta({
        cuestionario_id: quizDbId,
        texto_pregunta: p.texto_pregunta.trim(),
        puntaje: parseFloat(p.puntaje) || 1,
        orden: (preguntas.filter(x => x._saved).length) + i + 1,
      })
      if (pregErr) { setError(`Error guardando pregunta: ${pregErr.message}`); setSaving(false); return }

      const opcionesPayload = p.opciones.map((o, j) => ({
        pregunta_id: pregData.id,
        texto_opcion: o.texto_opcion.trim(),
        es_correcta: o.es_correcta,
        orden: j + 1,
      }))
      const { error: opErr } = await crearOpciones(opcionesPayload)
      if (opErr) { setError(`Error guardando opciones: ${opErr.message}`); setSaving(false); return }
    }

    navigate(`/courses/${cursoId}/content`)
  }

  if (!isDocente && !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Sin permisos.</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        <h1 style={{ margin: '0 0 2rem', color: 'var(--wine-800)', fontSize: '1.5rem', fontWeight: 800 }}>
          {isEdit ? 'Editar Cuestionario' : 'Nuevo Cuestionario'}
          {cursoTitulo && <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>— {cursoTitulo}</span>}
        </h1>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Cargando...</p>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Metadata */}
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Información del cuestionario</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Field label="Título *">
                  <input
                    value={meta.titulo} onChange={e => setMeta(p => ({ ...p, titulo: e.target.value }))}
                    placeholder="Ej. Evaluación Unidad 1"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                  />
                </Field>
                <Field label="Descripción">
                  <textarea
                    value={meta.descripcion} onChange={e => setMeta(p => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Instrucciones generales (opcional)..."
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <Field label="Disponible desde">
                    <input type="datetime-local" value={meta.fecha_disponible}
                      onChange={e => setMeta(p => ({ ...p, fecha_disponible: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                    />
                  </Field>
                  <Field label="Fecha límite">
                    <input type="datetime-local" value={meta.fecha_limite}
                      onChange={e => setMeta(p => ({ ...p, fecha_limite: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                    />
                  </Field>
                  <Field label="Tiempo límite (min)">
                    <input type="number" min="1" placeholder="Sin límite"
                      value={meta.tiempo_limite_minutos}
                      onChange={e => setMeta(p => ({ ...p, tiempo_limite_minutos: e.target.value }))}
                      style={{ ...inputStyle, width: '120px' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                    />
                  </Field>
                </div>

                {/* Toggle mostrar resultados */}
                <div
                  onClick={() => setMeta(p => ({ ...p, mostrar_resultados: !p.mostrar_resultados }))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', background: 'var(--bg-page)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      Mostrar resultados al estudiante
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {meta.mostrar_resultados
                        ? 'El estudiante verá su calificación y respuestas correctas al terminar.'
                        : 'El estudiante solo verá que su respuesta fue enviada, sin puntaje ni revisión.'}
                    </p>
                  </div>
                  <div style={{
                    width: '44px', height: '24px', borderRadius: '9999px', flexShrink: 0, marginLeft: '1rem',
                    background: meta.mostrar_resultados ? 'var(--wine-600)' : 'var(--wine-200)',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: meta.mostrar_resultados ? '23px' : '3px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'white', transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>

              </div>
            </div>

            {/* Preguntas */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ ...sectionTitleStyle, margin: 0 }}>
                  Preguntas ({preguntas.length})
                </h2>
                <button type="button" onClick={addPregunta} style={addBtnStyle}>
                  + Agregar pregunta
                </button>
              </div>

              {isEdit && preguntas.some(p => p._saved) && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(37,99,235,0.08)', border: '1px solid var(--info)', fontSize: '0.82rem', color: 'var(--info)' }}>
                  Las preguntas ya guardadas se muestran como referencia. Puedes agregar nuevas preguntas al final.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {preguntas.map((preg, idx) => (
                  <PreguntaBlock
                    key={preg._key}
                    pregunta={preg}
                    numero={idx + 1}
                    readOnly={!!preg._saved}
                    onUpdate={(field, value) => updatePregunta(preg._key, field, value)}
                    onRemove={() => removePregunta(preg._key)}
                    onAddOpcion={() => addOpcion(preg._key)}
                    onUpdateOpcion={(oKey, field, value) => updateOpcion(preg._key, oKey, field, value)}
                    onRemoveOpcion={(oKey) => removeOpcion(preg._key, oKey)}
                  />
                ))}
              </div>
            </div>

            {/* Error y botones */}
            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => navigate(-1)} style={cancelBtnStyle}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ ...saveBtnStyle, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear cuestionario')}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function PreguntaBlock({ pregunta, numero, readOnly, onUpdate, onRemove, onAddOpcion, onUpdateOpcion, onRemoveOpcion }) {
  return (
    <div style={{
      border: `1px solid ${readOnly ? 'var(--wine-100)' : 'var(--wine-200)'}`,
      borderRadius: '0.75rem', overflow: 'hidden',
      background: readOnly ? 'var(--bg-section)' : 'white',
    }}>
      <div style={{ padding: '1rem 1.25rem', background: readOnly ? 'var(--wine-50)' : 'var(--bg-section)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--wine-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
          {numero}
        </span>
        <div style={{ flex: 1 }}>
          {readOnly ? (
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pregunta.texto_pregunta}</span>
          ) : (
            <input
              value={pregunta.texto_pregunta}
              onChange={e => onUpdate('texto_pregunta', e.target.value)}
              placeholder="Escribe la pregunta..."
              style={{ ...inputStyle, fontWeight: 600 }}
              onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
              onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {!readOnly && (
            <>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Pts:
                <input
                  type="number" min="0.5" step="0.5"
                  value={pregunta.puntaje}
                  onChange={e => onUpdate('puntaje', e.target.value)}
                  style={{ ...inputStyle, width: '55px', marginLeft: '4px', padding: '3px 6px' }}
                />
              </label>
              <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.8rem' }} title="Eliminar pregunta">✕</button>
            </>
          )}
          {readOnly && (
            <span style={{ fontSize: '0.75rem', color: 'var(--wine-400)', fontWeight: 600 }}>{pregunta.puntaje} pt{pregunta.puntaje !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Opciones */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {pregunta.opciones.map(opcion => (
          <div key={opcion._key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {readOnly ? (
              <>
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${opcion.es_correcta ? 'var(--success)' : 'var(--wine-200)'}`, background: opcion.es_correcta ? 'var(--success)' : 'white', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: opcion.es_correcta ? 'var(--success)' : 'var(--text-primary)', fontWeight: opcion.es_correcta ? 600 : 400 }}>
                  {opcion.texto_opcion}
                </span>
              </>
            ) : (
              <>
                <input
                  type="radio"
                  name={`correcta-${pregunta._key}`}
                  checked={opcion.es_correcta}
                  onChange={() => onUpdateOpcion(opcion._key, 'es_correcta', true)}
                  title="Marcar como correcta"
                  style={{ cursor: 'pointer', accentColor: 'var(--success)', flexShrink: 0 }}
                />
                <input
                  value={opcion.texto_opcion}
                  onChange={e => onUpdateOpcion(opcion._key, 'texto_opcion', e.target.value)}
                  placeholder={`Opción ${opcion._key + 1}`}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                />
                {pregunta.opciones.length > 2 && (
                  <button type="button" onClick={() => onRemoveOpcion(opcion._key)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                )}
              </>
            )}
          </div>
        ))}

        {!readOnly && (
          <button type="button" onClick={onAddOpcion} style={{ alignSelf: 'flex-start', marginTop: '0.25rem', ...addBtnStyle }}>
            + Opción
          </button>
        )}
        {!readOnly && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Selecciona el radio de la opción correcta.
          </p>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</label>
      {children}
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const sectionStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
  borderRadius: '1rem', padding: '1.75rem',
}

const sectionTitleStyle = {
  margin: '0 0 1.25rem', color: 'var(--wine-800)', fontSize: '1.05rem', fontWeight: 700,
}

const inputStyle = {
  padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
  border: '1px solid var(--wine-100)', background: 'var(--bg-page)',
  color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

const addBtnStyle = {
  padding: '4px 12px', borderRadius: '6px',
  border: '1px dashed var(--wine-200)', background: 'none',
  color: 'var(--wine-600)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
}

const saveBtnStyle = {
  padding: '0.625rem 1.75rem', borderRadius: '0.5rem', border: 'none',
  background: 'var(--wine-600)', color: 'white', fontWeight: 700,
  fontSize: '0.875rem', cursor: 'pointer',
}

const cancelBtnStyle = {
  padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
  border: '1px solid var(--wine-100)', background: 'white',
  color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
}
