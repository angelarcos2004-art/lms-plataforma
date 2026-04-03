import { useState } from 'react'
import { Link } from 'react-router-dom'
import MaterialItem from './MaterialItem'
import ConfirmModal from '../ui/ConfirmModal'
import { crearMaterial, crearTarea, eliminarMaterial, eliminarTarea, subirArchivo } from '../../lib/contentService'
import { eliminarCuestionario } from '../../lib/quizService'

function tipoDbDesdeUrl(url) {
  const ext = url.split('?')[0].split('.').pop().toLowerCase()
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'video'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'documento'
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'odp', 'ods', 'csv'].includes(ext)) return 'documento'
  if (url.startsWith('http')) return 'enlace'
  return 'texto'
}

export default function UnidadSection({ unidad, numero, cursoId, canEdit, entregasMap, intentosMap, onUnidadUpdate }) {
  const [expanded, setExpanded] = useState(true)

  // Formularios inline
  const [showMatForm, setShowMatForm] = useState(false)
  const [showTareaForm, setShowTareaForm] = useState(false)
  const [matTipo, setMatTipo] = useState('texto') // 'texto' | 'enlace' | 'archivo'
  const [matForm, setMatForm] = useState({ titulo: '', contenido: '' })
  const [matArchivos, setMatArchivos] = useState([]) // [{ id, nombre, url, uploading, error }]
  const [tareaForm, setTareaForm] = useState({ titulo: '', instrucciones: '', fecha_limite: '', fecha_cierre: '', puntaje_maximo: '' })
  const [savingMat, setSavingMat] = useState(false)
  const [savingTarea, setSavingTarea] = useState(false)
  const [formError, setFormError] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null) // { title, description, confirmLabel, onConfirm }

  const materiales = [...(unidad.materiales ?? [])].sort((a, b) => a.orden - b.orden)
  const tareas = [...(unidad.tareas ?? [])].sort((a, b) => a.id - b.id)
  const cuestionarios = [...(unidad.cuestionarios ?? [])].sort((a, b) => a.id - b.id)

  async function handleAddMaterial(e) {
    e.preventDefault()
    setFormError(null)

    if (matTipo === 'archivo') {
      const listos = matArchivos.filter(a => a.url && !a.uploading && !a.error)
      if (listos.length === 0) return setFormError('Sube al menos un archivo.')
      setSavingMat(true)
      for (const arch of listos) {
        const tipo = tipoDbDesdeUrl(arch.url)
        const { error } = await crearMaterial(unidad.id, { titulo: arch.nombre, tipo, contenido: arch.url })
        if (error) { setSavingMat(false); return setFormError('No se pudo guardar uno de los archivos.') }
      }
      setSavingMat(false)
    } else {
      if (!matForm.titulo.trim()) return setFormError('El título es obligatorio.')
      if (!matForm.contenido.trim()) return setFormError('Agrega contenido o un enlace.')
      setSavingMat(true)
      const tipo = matTipo === 'enlace' ? 'enlace' : 'texto'
      const { error } = await crearMaterial(unidad.id, { titulo: matForm.titulo.trim(), tipo, contenido: matForm.contenido.trim() })
      setSavingMat(false)
      if (error) return setFormError('No se pudo guardar el material.')
    }

    setMatForm({ titulo: '', contenido: '' })
    setMatArchivos([])
    setMatTipo('texto')
    setShowMatForm(false)
    onUnidadUpdate()
  }

  async function handleArchivosMultiples(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setFormError(null)
    const nuevos = files.map(f => ({ id: `${Date.now()}-${Math.random()}`, nombre: f.name, url: null, uploading: true, error: null }))
    setMatArchivos(prev => [...prev, ...nuevos])

    await Promise.all(nuevos.map(async (entry, i) => {
      const { data: url, error } = await subirArchivo(files[i], 'materiales')
      setMatArchivos(prev => prev.map(a =>
        a.id === entry.id ? { ...a, url: url ?? null, uploading: false, error: error ? 'Error al subir' : null } : a
      ))
    }))

    // reset input so same files can be re-selected if needed
    e.target.value = ''
  }

  function quitarArchivoMat(id) {
    setMatArchivos(prev => prev.filter(a => a.id !== id))
  }

  async function handleAddTarea(e) {
    e.preventDefault()
    if (!tareaForm.titulo.trim()) return setFormError('El título es obligatorio.')
    setSavingTarea(true)
    setFormError(null)
    const { error } = await crearTarea(unidad.id, tareaForm)
    setSavingTarea(false)
    if (error) return setFormError('No se pudo guardar la tarea.')
    setTareaForm({ titulo: '', instrucciones: '', fecha_limite: '', fecha_cierre: '', puntaje_maximo: '' })
    setShowTareaForm(false)
    onUnidadUpdate()
  }

  function handleDeleteMaterial(id) {
    const item = materiales.find(m => m.id === id)
    setConfirmModal({
      title: 'Eliminar material',
      description: item ? `"${item.titulo}" será eliminado permanentemente.` : 'Este material será eliminado permanentemente.',
      confirmLabel: 'Eliminar material',
      onConfirm: async () => { await eliminarMaterial(id); onUnidadUpdate() },
    })
  }

  function handleDeleteTarea(id) {
    const item = tareas.find(t => t.id === id)
    setConfirmModal({
      title: 'Eliminar tarea',
      description: item
        ? `"${item.titulo}" y todas sus entregas serán eliminadas permanentemente.`
        : 'Esta tarea y todas sus entregas serán eliminadas permanentemente.',
      confirmLabel: 'Eliminar tarea',
      onConfirm: async () => { await eliminarTarea(id); onUnidadUpdate() },
    })
  }

  function handleDeleteCuestionario(id) {
    const item = cuestionarios.find(q => q.id === id)
    setConfirmModal({
      title: 'Eliminar cuestionario',
      description: item
        ? `"${item.titulo}" y todos los intentos de los estudiantes serán eliminados permanentemente.`
        : 'Este cuestionario y todos los intentos serán eliminados permanentemente.',
      confirmLabel: 'Eliminar cuestionario',
      onConfirm: async () => { await eliminarCuestionario(id); onUnidadUpdate() },
    })
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
                {matTipo !== 'archivo' && (
                  <input
                    placeholder="Título del material"
                    value={matForm.titulo}
                    onChange={e => setMatForm(p => ({ ...p, titulo: e.target.value }))}
                    style={{ ...miniInputStyle, width: '100%', boxSizing: 'border-box' }}
                  />
                )}

                {/* Selector de tipo */}
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {[
                    { val: 'texto', label: 'Texto' },
                    { val: 'enlace', label: 'Enlace' },
                    { val: 'archivo', label: 'Archivo' },
                  ].map(op => (
                    <button
                      key={op.val} type="button"
                      onClick={() => { setMatTipo(op.val); setMatForm(p => ({ ...p, contenido: '' })) }}
                      style={{
                        padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${matTipo === op.val ? 'var(--wine-600)' : 'var(--wine-100)'}`,
                        background: matTipo === op.val ? 'rgba(123,45,59,0.08)' : 'white',
                        color: matTipo === op.val ? 'var(--wine-800)' : 'var(--text-secondary)',
                      }}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {matTipo === 'texto' && (
                  <textarea
                    placeholder="Escribe el contenido del material..."
                    value={matForm.contenido}
                    onChange={e => setMatForm(p => ({ ...p, contenido: e.target.value }))}
                    rows={3}
                    style={{ ...miniInputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                )}

                {matTipo === 'enlace' && (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={matForm.contenido}
                    onChange={e => setMatForm(p => ({ ...p, contenido: e.target.value }))}
                    style={{ ...miniInputStyle, width: '100%', boxSizing: 'border-box' }}
                  />
                )}

                {matTipo === 'archivo' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Chips de archivos */}
                    {matArchivos.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {matArchivos.map(arch => (
                          <div key={arch.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem',
                            border: `1px solid ${arch.error ? 'var(--error)' : arch.uploading ? 'var(--wine-200)' : 'var(--wine-300)'}`,
                            background: arch.error ? 'rgba(220,38,38,0.06)' : arch.uploading ? 'var(--wine-50)' : 'rgba(123,45,59,0.06)',
                            color: arch.error ? 'var(--error)' : 'var(--wine-800)',
                            maxWidth: '200px',
                          }}>
                            {arch.uploading ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                                <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9"/>
                              </svg>
                            ) : arch.error ? (
                              <span style={{ fontSize: '0.7rem' }}>✕</span>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {arch.error ?? arch.nombre}
                            </span>
                            <button type="button" onClick={() => quitarArchivoMat(arch.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'inherit', flexShrink: 0 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start',
                      padding: '0.4rem 0.875rem', borderRadius: '6px', cursor: 'pointer',
                      border: '1px solid var(--wine-200)', background: 'white',
                      color: 'var(--wine-700)', fontSize: '0.78rem', fontWeight: 600,
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Agregar archivos
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.csv,.mp4,.webm,.avi,.mov,.mkv,.mp3,.wav,.ogg,.flac,.m4a,.aac,.jpg,.jpeg,.png,.gif,.webp"
                        style={{ display: 'none' }}
                        onChange={handleArchivosMultiples}
                      />
                    </label>
                  </div>
                )}

                {formError && <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.78rem' }}>{formError}</p>}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" disabled={savingMat || matArchivos.some(a => a.uploading)} style={saveBtnStyle}>
                    {savingMat ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" onClick={() => { setShowMatForm(false); setMatTipo('texto'); setMatForm({ titulo: '', contenido: '' }); setMatArchivos([]) }} style={cancelBtnStyle}>Cancelar</button>
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
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Cierre (opcional)</label>
                    <input
                      type="datetime-local"
                      value={tareaForm.fecha_cierre}
                      onChange={e => setTareaForm(p => ({ ...p, fecha_cierre: e.target.value }))}
                      style={{ ...miniInputStyle, borderColor: tareaForm.fecha_cierre ? 'rgba(124,58,237,0.5)' : undefined }}
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

function colorCalificacion(cal, max) {
  if (max == null || max <= 0) return { color: 'var(--text-secondary)', bg: 'rgba(100,100,100,0.08)' }
  const pct = (cal / max) * 100
  if (pct >= 80) return { color: 'var(--success)', bg: 'rgba(22,163,74,0.1)' }
  if (pct >= 60) return { color: '#CA8A04', bg: 'rgba(202,138,4,0.1)' }
  if (pct >= 40) return { color: '#EA580C', bg: 'rgba(234,88,12,0.1)' }
  return { color: 'var(--error)', bg: 'rgba(220,38,38,0.08)' }
}

// ── TareaItem ─────────────────────────────────────────────────────────────────

function TareaItem({ tarea, cursoId, entrega, canDelete, onDelete }) {
  let estadoBadge = null
  if (entrega) {
    if (entrega.calificacion != null) {
      const c = colorCalificacion(entrega.calificacion, tarea.puntaje_maximo)
      estadoBadge = { label: `${entrega.calificacion}${tarea.puntaje_maximo != null ? `/${tarea.puntaje_maximo}` : ''} pts`, color: c.color, bg: c.bg }
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
