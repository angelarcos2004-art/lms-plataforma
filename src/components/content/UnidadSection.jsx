import { useState } from 'react'
import { Link } from 'react-router-dom'
import MaterialItem from './MaterialItem'
import { crearMaterial, crearTarea, eliminarMaterial, eliminarTarea } from '../../lib/contentService'
import { eliminarCuestionario } from '../../lib/quizService'

export default function UnidadSection({ unidad, numero, cursoId, canEdit, entregasMap, intentosMap, onUnidadUpdate }) {
  const [expanded, setExpanded] = useState(true)

  // Formularios inline
  const [showMatForm, setShowMatForm] = useState(false)
  const [showTareaForm, setShowTareaForm] = useState(false)
  const [matForm, setMatForm] = useState({ titulo: '', tipo: 'texto', contenido: '' })
  const [tareaForm, setTareaForm] = useState({ titulo: '', instrucciones: '', fecha_limite: '', puntaje_maximo: '' })
  const [savingMat, setSavingMat] = useState(false)
  const [savingTarea, setSavingTarea] = useState(false)
  const [formError, setFormError] = useState(null)

  const materiales = [...(unidad.materiales ?? [])].sort((a, b) => a.orden - b.orden)
  const tareas = [...(unidad.tareas ?? [])].sort((a, b) => a.id - b.id)
  const cuestionarios = [...(unidad.cuestionarios ?? [])].sort((a, b) => a.id - b.id)

  async function handleAddMaterial(e) {
    e.preventDefault()
    if (!matForm.titulo.trim()) return setFormError('El título es obligatorio.')
    if (!matForm.contenido.trim()) return setFormError('El contenido es obligatorio.')
    setSavingMat(true)
    setFormError(null)
    const { error } = await crearMaterial(unidad.id, matForm)
    setSavingMat(false)
    if (error) return setFormError('No se pudo guardar el material.')
    setMatForm({ titulo: '', tipo: 'texto', contenido: '' })
    setShowMatForm(false)
    onUnidadUpdate()
  }

  async function handleAddTarea(e) {
    e.preventDefault()
    if (!tareaForm.titulo.trim()) return setFormError('El título es obligatorio.')
    setSavingTarea(true)
    setFormError(null)
    const { error } = await crearTarea(unidad.id, tareaForm)
    setSavingTarea(false)
    if (error) return setFormError('No se pudo guardar la tarea.')
    setTareaForm({ titulo: '', instrucciones: '', fecha_limite: '', puntaje_maximo: '' })
    setShowTareaForm(false)
    onUnidadUpdate()
  }

  async function handleDeleteMaterial(id) {
    if (!confirm('¿Eliminar este material?')) return
    await eliminarMaterial(id)
    onUnidadUpdate()
  }

  async function handleDeleteTarea(id) {
    if (!confirm('¿Eliminar esta tarea?')) return
    await eliminarTarea(id)
    onUnidadUpdate()
  }

  async function handleDeleteCuestionario(id) {
    if (!confirm('¿Eliminar este cuestionario? Se perderán todos los intentos.')) return
    await eliminarCuestionario(id)
    onUnidadUpdate()
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
      borderRadius: '1rem', overflow: 'hidden',
    }}>
      {/* Header de la unidad */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1.25rem 1.5rem', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--wine-600), var(--wine-800))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: '0.875rem',
        }}>
          {numero}
        </span>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, color: 'var(--wine-800)', fontSize: '1rem' }}>
            {unidad.titulo}
          </span>
          {unidad.descripcion && (
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {unidad.descripcion}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {materiales.length} material{materiales.length !== 1 ? 'es' : ''} · {tareas.length} tarea{tareas.length !== 1 ? 's' : ''} · {cuestionarios.length} quiz
          </span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-secondary)" strokeWidth="2"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Cuerpo de la unidad */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--wine-100)', padding: '1.5rem' }}>

          {/* Materiales */}
          <div style={{ marginBottom: tareas.length || canEdit ? '1.5rem' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Materiales
              </h4>
              {canEdit && (
                <button onClick={() => { setShowMatForm(v => !v); setFormError(null) }} style={addBtnStyle}>
                  + Agregar
                </button>
              )}
            </div>

            {materiales.length === 0 && !showMatForm && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Sin materiales aún.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {materiales.map(mat => (
                <MaterialItem
                  key={mat.id}
                  material={mat}
                  canDelete={canEdit}
                  onDelete={handleDeleteMaterial}
                />
              ))}
            </div>

            {/* Formulario nuevo material */}
            {showMatForm && (
              <form onSubmit={handleAddMaterial} style={inlineFormStyle}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    placeholder="Título del material"
                    value={matForm.titulo}
                    onChange={e => setMatForm(p => ({ ...p, titulo: e.target.value }))}
                    style={{ ...miniInputStyle, flex: '1 1 200px' }}
                  />
                  <select
                    value={matForm.tipo}
                    onChange={e => setMatForm(p => ({ ...p, tipo: e.target.value }))}
                    style={{ ...miniInputStyle, width: '130px' }}
                  >
                    <option value="texto">Texto</option>
                    <option value="enlace">Enlace</option>
                    <option value="video">Video</option>
                    <option value="documento">Documento</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <textarea
                  placeholder={matForm.tipo === 'enlace' ? 'URL del enlace (https://...)' : 'Contenido del material...'}
                  value={matForm.contenido}
                  onChange={e => setMatForm(p => ({ ...p, contenido: e.target.value }))}
                  rows={3}
                  style={{ ...miniInputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                {formError && <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.78rem' }}>{formError}</p>}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" disabled={savingMat} style={saveBtnStyle}>
                    {savingMat ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" onClick={() => setShowMatForm(false)} style={cancelBtnStyle}>Cancelar</button>
                </div>
              </form>
            )}
          </div>

          {/* Tareas */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tareas
              </h4>
              {canEdit && (
                <button onClick={() => { setShowTareaForm(v => !v); setFormError(null) }} style={addBtnStyle}>
                  + Agregar
                </button>
              )}
            </div>

            {tareas.length === 0 && !showTareaForm && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Sin tareas aún.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tareas.map(tarea => {
                const entrega = entregasMap?.[tarea.id]
                return (
                  <TareaItem
                    key={tarea.id}
                    tarea={tarea}
                    cursoId={cursoId}
                    entrega={entrega}
                    canDelete={canEdit}
                    onDelete={handleDeleteTarea}
                  />
                )
              })}
            </div>

            {/* Formulario nueva tarea */}
            {showTareaForm && (
              <form onSubmit={handleAddTarea} style={inlineFormStyle}>
                <input
                  placeholder="Título de la tarea"
                  value={tareaForm.titulo}
                  onChange={e => setTareaForm(p => ({ ...p, titulo: e.target.value }))}
                  style={{ ...miniInputStyle, width: '100%', boxSizing: 'border-box' }}
                />
                <textarea
                  placeholder="Instrucciones (opcional)..."
                  value={tareaForm.instrucciones}
                  onChange={e => setTareaForm(p => ({ ...p, instrucciones: e.target.value }))}
                  rows={2}
                  style={{ ...miniInputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Fecha límite</label>
                    <input
                      type="datetime-local"
                      value={tareaForm.fecha_limite}
                      onChange={e => setTareaForm(p => ({ ...p, fecha_limite: e.target.value }))}
                      style={miniInputStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Puntaje máx.</label>
                    <input
                      type="number" min="0" step="0.5"
                      placeholder="100"
                      value={tareaForm.puntaje_maximo}
                      onChange={e => setTareaForm(p => ({ ...p, puntaje_maximo: e.target.value }))}
                      style={{ ...miniInputStyle, width: '100px' }}
                    />
                  </div>
                </div>
                {formError && <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.78rem' }}>{formError}</p>}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" disabled={savingTarea} style={saveBtnStyle}>
                    {savingTarea ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" onClick={() => setShowTareaForm(false)} style={cancelBtnStyle}>Cancelar</button>
                </div>
              </form>
            )}
          </div>

          {/* Cuestionarios */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cuestionarios
              </h4>
              {canEdit && (
                <Link
                  to={`/courses/${cursoId}/cuestionarios/nuevo?unidadId=${unidad.id}`}
                  style={{ ...addBtnStyle, textDecoration: 'none' }}
                >
                  + Agregar
                </Link>
              )}
            </div>

            {cuestionarios.length === 0 && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Sin cuestionarios aún.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cuestionarios.map(quiz => (
                <QuizItem
                  key={quiz.id}
                  quiz={quiz}
                  cursoId={cursoId}
                  intento={intentosMap?.[quiz.id]}
                  canDelete={canEdit}
                  onDelete={handleDeleteCuestionario}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── TareaItem ─────────────────────────────────────────────────────────────────

function TareaItem({ tarea, cursoId, entrega, canDelete, onDelete }) {
  let estadoBadge = null
  if (entrega) {
    if (entrega.calificacion != null) {
      estadoBadge = { label: `${entrega.calificacion} pts`, color: 'var(--success)', bg: 'rgba(22,163,74,0.1)' }
    } else {
      estadoBadge = { label: 'Entregada', color: 'var(--info)', bg: 'rgba(37,99,235,0.1)' }
    }
  }

  const vencida = tarea.fecha_limite && new Date(tarea.fecha_limite) < new Date() && !entrega

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem 1rem', borderRadius: '0.5rem',
      border: '1px solid var(--wine-100)', background: 'var(--bg-page)',
    }}>
      {/* Ícono tarea */}
      <span style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: 'rgba(168,69,88,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--wine-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {tarea.titulo}
        </span>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2px', flexWrap: 'wrap' }}>
          {tarea.fecha_limite && (
            <span style={{ fontSize: '0.72rem', color: vencida ? 'var(--error)' : 'var(--text-secondary)' }}>
              📅 {new Date(tarea.fecha_limite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {tarea.puntaje_maximo != null && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {tarea.puntaje_maximo} pts
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {estadoBadge && (
          <span style={{
            padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem',
            fontWeight: 700, color: estadoBadge.color, background: estadoBadge.bg,
          }}>
            {estadoBadge.label}
          </span>
        )}
        {vencida && (
          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--error)', background: 'rgba(220,38,38,0.08)' }}>
            Vencida
          </span>
        )}

        <Link
          to={`/courses/${cursoId}/tareas/${tarea.id}`}
          style={{
            padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem',
            fontWeight: 600, textDecoration: 'none',
            background: 'var(--wine-600)', color: 'white',
          }}
        >
          {canDelete ? 'Ver entregas' : (entrega ? 'Ver entrega' : 'Entregar')}
        </Link>

        {canDelete && (
          <button
            onClick={() => onDelete(tarea.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.75rem', padding: '2px 4px' }}
            title="Eliminar tarea"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// ── QuizItem ──────────────────────────────────────────────────────────────────

function QuizItem({ quiz, cursoId, intento, canDelete, onDelete }) {
  const ahora = new Date()
  const disponible = !quiz.fecha_disponible || new Date(quiz.fecha_disponible) <= ahora
  const vencido = quiz.fecha_limite && new Date(quiz.fecha_limite) < ahora

  let estadoBadge = null
  if (intento) {
    const pct = intento.puntaje_maximo > 0 ? Math.round((intento.puntaje_obtenido / intento.puntaje_maximo) * 100) : 0
    estadoBadge = {
      label: `${intento.puntaje_obtenido}/${intento.puntaje_maximo} pts (${pct}%)`,
      color: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--error)',
      bg: pct >= 70 ? 'rgba(22,163,74,0.1)' : pct >= 40 ? 'rgba(234,179,8,0.1)' : 'rgba(220,38,38,0.08)',
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', background: 'var(--bg-page)' }}>
      <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168,69,88,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--wine-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{quiz.titulo}</span>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2px', flexWrap: 'wrap' }}>
          {!disponible && <span style={{ fontSize: '0.72rem', color: 'var(--warning)' }}>No disponible aún</span>}
          {disponible && vencido && !intento && <span style={{ fontSize: '0.72rem', color: 'var(--error)' }}>Vencido</span>}
          {quiz.tiempo_limite_minutos && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>⏱ {quiz.tiempo_limite_minutos} min</span>}
          {quiz.fecha_limite && disponible && !vencido && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>📅 {new Date(quiz.fecha_limite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {estadoBadge && (
          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, color: estadoBadge.color, background: estadoBadge.bg }}>
            {estadoBadge.label}
          </span>
        )}
        <Link
          to={`/courses/${cursoId}/cuestionarios/${quiz.id}`}
          style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', background: 'var(--wine-600)', color: 'white' }}
        >
          {canDelete ? 'Ver intentos' : (intento ? 'Ver resultado' : 'Tomar')}
        </Link>
        {canDelete && (
          <button onClick={() => onDelete(quiz.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.75rem', padding: '2px 4px' }} title="Eliminar cuestionario">✕</button>
        )}
      </div>
    </div>
  )
}

// ── Estilos compartidos ───────────────────────────────────────────────────────

const addBtnStyle = {
  padding: '3px 10px', borderRadius: '6px', border: '1px dashed var(--wine-200)',
  background: 'none', color: 'var(--wine-600)', fontSize: '0.78rem',
  fontWeight: 600, cursor: 'pointer',
}

const inlineFormStyle = {
  marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
  padding: '1rem', borderRadius: '0.5rem',
  background: 'var(--wine-50)', border: '1px dashed var(--wine-200)',
}

const miniInputStyle = {
  padding: '0.4rem 0.6rem', borderRadius: '6px',
  border: '1px solid var(--wine-100)', background: 'white',
  color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none',
}

const saveBtnStyle = {
  padding: '4px 14px', borderRadius: '6px', border: 'none',
  background: 'var(--wine-600)', color: 'white',
  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
}

const cancelBtnStyle = {
  padding: '4px 14px', borderRadius: '6px',
  border: '1px solid var(--wine-100)', background: 'white',
  color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
}
