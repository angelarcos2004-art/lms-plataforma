import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import {
  getTareaById,
  getEntregaByEstudiante,
  getEntregasByTarea,
  crearEntrega,
  actualizarEntrega,
  cancelarEntrega,
  calificarEntrega,
  subirArchivo,
  actualizarFechasTarea,
  getMensajesTarea,
  enviarMensajeTarea,
} from '../../lib/contentService'
import { supabase } from '../../lib/supabase'

// Parsea contenido_entrega: puede ser JSON array, URL suelta o texto plano
function parsearContenido(raw) {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return { tipo: 'archivos', archivos: parsed }
  } catch {}
  if (/^https?:\/\//i.test(raw)) return { tipo: 'url', url: raw }
  return { tipo: 'texto', texto: raw }
}

const EXT_INFO = {
  pdf:  { label: 'PDF',        color: '#DC2626' },
  doc:  { label: 'Word',       color: '#2563EB' },
  docx: { label: 'Word',       color: '#2563EB' },
  ppt:  { label: 'PPT',        color: '#EA580C' },
  pptx: { label: 'PPT',        color: '#EA580C' },
  xls:  { label: 'Excel',      color: '#16A34A' },
  xlsx: { label: 'Excel',      color: '#16A34A' },
  csv:  { label: 'CSV',        color: '#16A34A' },
  mp4:  { label: 'Video',      color: '#7C3AED' },
  avi:  { label: 'Video',      color: '#7C3AED' },
  mov:  { label: 'Video',      color: '#7C3AED' },
  mp3:  { label: 'Audio',      color: '#DB2777' },
  wav:  { label: 'Audio',      color: '#DB2777' },
  ogg:  { label: 'Audio',      color: '#DB2777' },
  flac: { label: 'Audio',      color: '#DB2777' },
  m4a:  { label: 'Audio',      color: '#DB2777' },
  aac:  { label: 'Audio',      color: '#DB2777' },
  jpg:  { label: 'Imagen',     color: '#0891B2' },
  jpeg: { label: 'Imagen',     color: '#0891B2' },
  png:  { label: 'Imagen',     color: '#0891B2' },
  gif:  { label: 'Imagen',     color: '#0891B2' },
  webp: { label: 'Imagen',     color: '#0891B2' },
  zip:  { label: 'ZIP',        color: '#78716C' },
}

const OFFICE_EXTS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'odp', 'ods']
const VIDEO_NATIVOS = ['mp4', 'webm', 'ogv']
const AUDIO_NATIVOS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']

function getExt(nombre = '') {
  return nombre.split('?')[0].split('.').pop().toLowerCase()
}

function resolverUrl(url) {
  const ext = getExt(url)
  if (OFFICE_EXTS.includes(ext)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
  }
  return url
}

function ArchivoChip({ url, nombre, onRemove }) {
  const [mediaExpanded, setMediaExpanded] = useState(false)
  const ext = getExt(nombre || url)
  const info = EXT_INFO[ext] ?? { label: ext.toUpperCase(), color: 'var(--wine-600)' }
  const esVideoNativo = VIDEO_NATIVOS.includes(ext)
  const esAudioNativo = AUDIO_NATIVOS.includes(ext)
  const esExpandible = esVideoNativo || esAudioNativo

  return (
    <div style={{ borderRadius: '0.5rem', border: `1px solid ${info.color}30`, background: `${info.color}0d`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem' }}>
        <span style={{ padding: '1px 6px', borderRadius: '4px', background: info.color, color: 'white', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
          {info.label}
        </span>
        {esExpandible ? (
          <button
            onClick={() => setMediaExpanded(v => !v)}
            style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', color: info.color, fontWeight: 600, padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}
          >
            {nombre || (esVideoNativo ? 'Video' : 'Audio')}
          </button>
        ) : (
          <a href={resolverUrl(url)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: '0.8rem', color: info.color, fontWeight: 600, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
            {nombre || 'Archivo'}
          </a>
        )}
        {onRemove && (
          <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem', flexShrink: 0, lineHeight: 1 }}>✕</button>
        )}
      </div>
      {esVideoNativo && mediaExpanded && (
        <video src={url} controls style={{ width: '100%', display: 'block', maxHeight: '360px', background: '#000' }} />
      )}
      {esAudioNativo && mediaExpanded && (
        <div style={{ padding: '0.5rem 0.75rem' }}>
          <audio src={url} controls style={{ width: '100%' }} />
        </div>
      )}
    </div>
  )
}

function EntregaContenido({ contenido }) {
  if (!contenido) return null
  const parsed = parsearContenido(contenido)

  if (parsed.tipo === 'archivos') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {parsed.archivos.map((a, i) => (
          <ArchivoChip key={i} url={a.url} nombre={a.nombre} />
        ))}
      </div>
    )
  }
  if (parsed.tipo === 'url') {
    const ext = getExt(parsed.url)
    const info = EXT_INFO[ext]
    if (info) return <ArchivoChip url={parsed.url} nombre={parsed.url.split('/').pop()} />
    return <a href={parsed.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--wine-600)', wordBreak: 'break-all', fontSize: '0.875rem' }}>{parsed.url}</a>
  }
  return <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{parsed.texto}</p>
}

function colorCalificacion(cal, max) {
  if (max == null || max <= 0) return { color: 'var(--text-secondary)', bg: 'rgba(100,100,100,0.08)', border: 'rgba(100,100,100,0.25)' }
  const pct = (cal / max) * 100
  if (pct >= 80) return { color: 'var(--success)', bg: 'rgba(22,163,74,0.08)', border: 'var(--success)' }
  if (pct >= 60) return { color: '#CA8A04', bg: 'rgba(202,138,4,0.1)', border: '#CA8A04' }
  if (pct >= 40) return { color: '#EA580C', bg: 'rgba(234,88,12,0.1)', border: '#EA580C' }
  return { color: 'var(--error)', bg: 'rgba(220,38,38,0.08)', border: 'var(--error)' }
}

export default function TareaDetail() {
  const { id: cursoId, tareaId } = useParams()
  const { user } = useAuth()
  const { isEstudiante, isDocente, isAdmin } = useRole()

  const [tarea, setTarea] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estudiante
  const [miEntrega, setMiEntrega] = useState(null)
  const [tipoEntrega, setTipoEntrega] = useState('texto')
  const [texto, setTexto] = useState('')
  const [archivos, setArchivos] = useState([]) // [{ id, nombre, url, uploading, error }]
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState(null)

  // Docente
  const [entregas, setEntregas] = useState([])
  const [gradingId, setGradingId] = useState(null)
  const [gradeForm, setGradeForm] = useState({ calificacion: '', retroalimentacion: '' })
  const [savingGrade, setSavingGrade] = useState(false)

  // Editar fecha límite
  const [editandoFecha, setEditandoFecha] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevaFechaCierre, setNuevaFechaCierre] = useState('')
  const [savingFecha, setSavingFecha] = useState(false)

  // Editar entrega existente
  const [editandoEntrega, setEditandoEntrega] = useState(false)

  // Chat por tarea
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)
  const chatEndRef = useRef(null)

  const canEdit = isDocente || isAdmin

  useEffect(() => {
    async function cargar() {
      const { data: tareaData, error: err } = await getTareaById(tareaId)
      if (err || !tareaData) { setError('No se encontró la tarea.'); setLoading(false); return }
      setTarea(tareaData)
      setNuevaFecha(tareaData.fecha_limite ? tareaData.fecha_limite.slice(0, 16) : '')
      setNuevaFechaCierre(tareaData.fecha_cierre ? tareaData.fecha_cierre.slice(0, 16) : '')

      if (isEstudiante && user) {
        const { data } = await getEntregaByEstudiante(tareaId, user.id)
        setMiEntrega(data)
      }
      if (canEdit) {
        const { data } = await getEntregasByTarea(tareaId)
        setEntregas(data ?? [])
      }

      const { data: msgs } = await getMensajesTarea(tareaId)
      setMensajes(msgs ?? [])
      setLoading(false)
    }
    cargar()

    const chatChannel = supabase
      .channel(`tarea-chat-${tareaId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes_tarea',
        filter: `tarea_id=eq.${tareaId}`,
      }, async () => {
        const { data } = await getMensajesTarea(tareaId)
        setMensajes(data ?? [])
      })
      .subscribe()

    const entregasChannel = supabase
      .channel(`tarea-entregas-${tareaId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'entregas',
        filter: `tarea_id=eq.${tareaId}`,
      }, async () => {
        const { data } = await getEntregasByTarea(tareaId)
        setEntregas(data ?? [])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(entregasChannel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tareaId, user])

  // ── Subida de archivos ──────────────────────────────────────────────────────

  async function handleArchivos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    e.target.value = ''

    const nuevos = files.map(f => ({ id: `${Date.now()}-${Math.random()}`, nombre: f.name, url: null, uploading: true, error: null, _file: f }))
    setArchivos(prev => [...prev, ...nuevos])

    for (const item of nuevos) {
      const { data: url, error: err } = await subirArchivo(item._file, 'entregas')
      setArchivos(prev => prev.map(a => a.id === item.id ? { ...a, url, uploading: false, error: err ? 'Error al subir' : null } : a))
    }
  }

  function quitarArchivo(id) {
    setArchivos(prev => prev.filter(a => a.id !== id))
  }

  // ── Submit entrega ──────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    let contenido
    if (tipoEntrega === 'archivo') {
      const listos = archivos.filter(a => a.url && !a.uploading)
      if (!listos.length) return
      contenido = JSON.stringify(listos.map(a => ({ url: a.url, nombre: a.nombre })))
    } else {
      if (!texto.trim()) return
      contenido = texto.trim()
    }

    setSubmitting(true)
    setSubmitMsg(null)
    const { data, error: err } = await crearEntrega(tareaId, user.id, contenido)
    setSubmitting(false)
    if (err) {
      setSubmitMsg({ tipo: 'error', texto: 'No se pudo enviar la entrega.' })
    } else {
      setMiEntrega(data)
      setTexto('')
      setArchivos([])
      setSubmitMsg({ tipo: 'ok', texto: '¡Entrega enviada correctamente!' })
    }
  }

  // ── Calificar ───────────────────────────────────────────────────────────────

  async function handleCalificar(entregaId) {
    if (!gradeForm.calificacion) return
    setSavingGrade(true)
    const { data, error: err } = await calificarEntrega(entregaId, parseFloat(gradeForm.calificacion), gradeForm.retroalimentacion || null, user.id)
    setSavingGrade(false)
    if (!err) {
      setEntregas(prev => prev.map(e => e.id === entregaId ? { ...e, ...data } : e))
      setGradingId(null)
      setGradeForm({ calificacion: '', retroalimentacion: '' })
    }
  }

  // ── Editar fecha límite ─────────────────────────────────────────────────────

  async function handleGuardarFecha() {
    setSavingFecha(true)
    const { data, error: err } = await actualizarFechasTarea(tareaId, nuevaFecha, nuevaFechaCierre)
    setSavingFecha(false)
    if (!err && data) {
      setTarea(prev => ({ ...prev, fecha_limite: data.fecha_limite, fecha_cierre: data.fecha_cierre }))
      setEditandoFecha(false)
    }
  }

  function iniciarEdicionEntrega() {
    const parsed = parsearContenido(miEntrega.contenido_entrega)
    if (parsed.tipo === 'archivos') {
      setTipoEntrega('archivo')
      setArchivos(parsed.archivos.map((a, i) => ({ id: `existing-${i}`, nombre: a.nombre, url: a.url, uploading: false, error: null })))
    } else if (parsed.tipo === 'url') {
      setTipoEntrega('enlace')
      setTexto(parsed.url)
    } else {
      setTipoEntrega('texto')
      setTexto(parsed.texto ?? '')
    }
    setEditandoEntrega(true)
  }

  async function handleCancelarEntrega() {
    if (!window.confirm('¿Seguro que deseas cancelar tu entrega? Esta acción no se puede deshacer.')) return
    setSubmitting(true)
    const { error: err } = await cancelarEntrega(miEntrega.id)
    setSubmitting(false)
    if (!err) {
      setMiEntrega(null)
      setTexto('')
      setArchivos([])
      setEditandoEntrega(false)
      setSubmitMsg({ tipo: 'ok', texto: 'Entrega cancelada.' })
    }
  }

  async function handleActualizarEntrega(e) {
    e.preventDefault()
    let contenido
    if (tipoEntrega === 'archivo') {
      const listos = archivos.filter(a => a.url && !a.uploading)
      if (!listos.length) return
      contenido = JSON.stringify(listos.map(a => ({ url: a.url, nombre: a.nombre })))
    } else {
      if (!texto.trim()) return
      contenido = texto.trim()
    }
    setSubmitting(true)
    setSubmitMsg(null)
    const { data, error: err } = await actualizarEntrega(miEntrega.id, contenido)
    setSubmitting(false)
    if (err) {
      setSubmitMsg({ tipo: 'error', texto: 'No se pudo actualizar la entrega.' })
    } else {
      setMiEntrega(data)
      setEditandoEntrega(false)
      setTexto('')
      setArchivos([])
      setSubmitMsg({ tipo: 'ok', texto: 'Entrega actualizada correctamente.' })
    }
  }

  async function handleCancelarEntregaDocente(entregaId) {
    if (!window.confirm('¿Cancelar la entrega de este estudiante? Podrá volver a entregar desde cero.')) return
    const { error: err } = await cancelarEntrega(entregaId)
    if (!err) {
      setEntregas(prev => prev.filter(e => e.id !== entregaId))
      if (gradingId === entregaId) { setGradingId(null); setGradeForm({ calificacion: '', retroalimentacion: '' }) }
    }
  }

  async function handleEnviarMensaje(e) {
    e.preventDefault()
    if (!nuevoMensaje.trim()) return
    setEnviandoMensaje(true)
    const { error: err } = await enviarMensajeTarea(tareaId, user.id, nuevoMensaje.trim())
    setEnviandoMensaje(false)
    if (!err) {
      setNuevoMensaje('')
      const { data } = await getMensajesTarea(tareaId)
      setMensajes(data ?? [])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const uploading = archivos.some(a => a.uploading)
  const archivosListos = archivos.filter(a => a.url && !a.uploading)
  const ahora = new Date()
  const vencida = tarea?.fecha_limite && new Date(tarea.fecha_limite) < ahora
  const fechaCierreObj = tarea?.fecha_cierre ? new Date(tarea.fecha_cierre) : null
  const cerrada = fechaCierreObj && ahora > fechaCierreObj
  const plazoModificacion = fechaCierreObj ?? (tarea?.fecha_limite ? new Date(tarea.fecha_limite) : null)
  const puedeModificarEntrega = miEntrega && miEntrega.calificacion == null && (!plazoModificacion || ahora <= plazoModificacion)
  const cursoTitulo = tarea?.unidades?.cursos?.titulo ?? 'Curso'
  const unidadTitulo = tarea?.unidades?.titulo ?? 'Unidad'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/courses" style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>Catálogo</Link>
            <span>›</span>
            <Link to={`/courses/${cursoId}`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>{cursoTitulo}</Link>
            <span>›</span>
            <Link to={`/courses/${cursoId}/content`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>{unidadTitulo}</Link>
            <span>›</span>
            <span>{tarea?.titulo ?? '...'}</span>
          </div>
          <Link to={`/courses/${cursoId}/content`} style={{ fontSize: '0.8rem', color: 'var(--wine-600)', textDecoration: 'none' }}>
            ← Regresar al contenido
          </Link>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando tarea...</div>}
        {error && <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)', color: 'var(--error)' }}>{error}</div>}

        {!loading && tarea && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Info de la tarea */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0, color: 'var(--wine-800)', fontSize: '1.5rem', fontWeight: 800 }}>{tarea.titulo}</h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {tarea.puntaje_maximo != null && (
                    <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'var(--wine-50)', color: 'var(--wine-800)', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--wine-100)' }}>
                      {tarea.puntaje_maximo} pts
                    </span>
                  )}

                  {/* Fechas + editar */}
                  {!editandoFecha ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {tarea.fecha_limite && (
                        <span style={{ padding: '4px 12px', borderRadius: '6px', background: cerrada ? 'rgba(220,38,38,0.12)' : vencida ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)', color: cerrada ? 'var(--error)' : vencida ? 'var(--error)' : 'var(--success)', fontSize: '0.8rem', fontWeight: 700, border: `1px solid ${(cerrada || vencida) ? 'var(--error)' : 'var(--success)'}` }}>
                          {cerrada ? 'Cerrada' : vencida ? 'Vencida' : 'Activa'} · {new Date(tarea.fecha_limite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {tarea.fecha_cierre && (
                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(124,58,237,0.08)', color: '#7C3AED', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(124,58,237,0.3)' }}>
                          Cierre: {new Date(tarea.fecha_cierre).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => setEditandoFecha(true)}
                          title="Modificar fechas"
                          style={{ background: 'var(--wine-50)', border: '1px solid var(--wine-100)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'var(--wine-600)', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          {tarea.fecha_limite ? 'Cambiar fechas' : '+ Fechas'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', background: 'var(--bg-page)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '90px' }}>Entrega límite:</label>
                        <input
                          type="datetime-local"
                          value={nuevaFecha}
                          onChange={e => setNuevaFecha(e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--wine-400)', fontSize: '0.8rem', outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '90px' }}>Cierre (opcional):</label>
                        <input
                          type="datetime-local"
                          value={nuevaFechaCierre}
                          onChange={e => setNuevaFechaCierre(e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(124,58,237,0.5)', fontSize: '0.8rem', outline: 'none' }}
                        />
                        {nuevaFechaCierre && (
                          <button onClick={() => setNuevaFechaCierre('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Quitar</button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button
                          onClick={handleGuardarFecha}
                          disabled={savingFecha}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          {savingFecha ? '...' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => { setEditandoFecha(false); setNuevaFecha(tarea.fecha_limite ? tarea.fecha_limite.slice(0, 16) : ''); setNuevaFechaCierre(tarea.fecha_cierre ? tarea.fecha_cierre.slice(0, 16) : '') }}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--wine-100)', background: 'white', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
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

                {miEntrega && !editandoEntrega ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'var(--bg-section)', border: '1px solid var(--wine-100)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Enviada el {new Date(miEntrega.fecha_entrega).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {puedeModificarEntrega && (
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button
                              onClick={iniciarEdicionEntrega}
                              style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--wine-200)', background: 'white', color: 'var(--wine-600)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Editar entrega
                            </button>
                            <button
                              onClick={handleCancelarEntrega}
                              disabled={submitting}
                              style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: 'var(--error)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {submitting ? '...' : 'Cancelar entrega'}
                            </button>
                          </div>
                        )}
                      </div>
                      <EntregaContenido contenido={miEntrega.contenido_entrega} />
                    </div>

                    {submitMsg && (
                      <div style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', background: submitMsg.tipo === 'ok' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)', color: submitMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)', border: `1px solid ${submitMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)'}` }}>
                        {submitMsg.texto}
                      </div>
                    )}

                    {miEntrega.calificacion != null ? (() => {
                      const c = colorCalificacion(miEntrega.calificacion, tarea.puntaje_maximo)
                      return (
                        <div style={{ padding: '1rem', borderRadius: '0.5rem', background: c.bg, border: `1px solid ${c.border}` }}>
                          <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: c.color, fontSize: '1rem' }}>
                            Calificación: {miEntrega.calificacion}{tarea.puntaje_maximo != null ? ` / ${tarea.puntaje_maximo}` : ''} pts
                          </p>
                          {miEntrega.retroalimentacion && (
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                              {miEntrega.retroalimentacion}
                            </p>
                          )}
                        </div>
                      )
                    })() : (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(37,99,235,0.08)', border: '1px solid var(--info)' }}>
                        <p style={{ margin: 0, color: 'var(--info)', fontSize: '0.875rem', fontWeight: 600 }}>Tu entrega está pendiente de calificación.</p>
                      </div>
                    )}
                  </div>
                ) : miEntrega && editandoEntrega ? (
                  <form onSubmit={handleActualizarEntrega} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(37,99,235,0.06)', border: '1px solid var(--info)', fontSize: '0.8rem', color: 'var(--info)', fontWeight: 600 }}>
                      Editando tu entrega anterior
                    </div>

                    {/* Selector tipo */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[{ val: 'texto', label: 'Texto' }, { val: 'enlace', label: 'Enlace / URL' }, { val: 'archivo', label: 'Archivos' }].map(op => (
                        <label key={op.val} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.375rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', border: `1px solid ${tipoEntrega === op.val ? 'var(--wine-600)' : 'var(--wine-100)'}`, background: tipoEntrega === op.val ? 'rgba(123,45,59,0.06)' : 'var(--bg-page)', fontSize: '0.82rem', fontWeight: 600, color: tipoEntrega === op.val ? 'var(--wine-800)' : 'var(--text-secondary)' }}>
                          <input type="radio" name="tipoEntregaEdit" value={op.val} checked={tipoEntrega === op.val} onChange={() => { setTipoEntrega(op.val); setTexto(''); setArchivos([]) }} style={{ display: 'none' }} />
                          {op.label}
                        </label>
                      ))}
                    </div>

                    {tipoEntrega === 'texto' && (
                      <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escribe tu entrega aquí..." rows={8}
                        style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', outline: 'none', fontSize: '0.875rem', lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', color: 'var(--text-primary)' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                      />
                    )}

                    {tipoEntrega === 'enlace' && (
                      <input type="url" value={texto} onChange={e => setTexto(e.target.value)} placeholder="https://..."
                        style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                      />
                    )}

                    {tipoEntrega === 'archivo' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {archivos.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {archivos.map(a => (
                              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: `1px solid ${a.uploading ? 'var(--wine-200)' : `${(EXT_INFO[getExt(a.nombre)]?.color ?? 'var(--wine-600)')}30`}`, background: a.uploading ? 'var(--wine-50)' : `${(EXT_INFO[getExt(a.nombre)]?.color ?? 'var(--wine-600)')}0d` }}>
                                {a.uploading ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--wine-400)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                ) : (
                                  <span style={{ padding: '1px 5px', borderRadius: '3px', background: EXT_INFO[getExt(a.nombre)]?.color ?? 'var(--wine-600)', color: 'white', fontSize: '0.62rem', fontWeight: 800, flexShrink: 0 }}>
                                    {(EXT_INFO[getExt(a.nombre)]?.label ?? getExt(a.nombre).toUpperCase())}
                                  </span>
                                )}
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {a.uploading ? 'Subiendo...' : a.nombre}
                                </span>
                                <button onClick={() => quitarArchivo(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem', flexShrink: 0 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '1.25rem', borderRadius: '0.75rem', border: '2px dashed var(--wine-200)', background: 'var(--bg-page)', cursor: 'pointer' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wine-400)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--wine-600)' }}>Agregar archivos</span>
                          <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.csv,.mp4,.webm,.avi,.mov,.mkv,.mp3,.wav,.ogg,.flac,.m4a,.aac,.jpg,.jpeg,.png,.gif,.webp,.zip" style={{ display: 'none' }} onChange={handleArchivos} />
                        </label>
                      </div>
                    )}

                    {submitMsg && (
                      <div style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', background: submitMsg.tipo === 'ok' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)', color: submitMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)', border: `1px solid ${submitMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)'}` }}>
                        {submitMsg.texto}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="submit"
                        disabled={submitting || uploading || (tipoEntrega === 'archivo' ? archivos.filter(a => a.url && !a.uploading).length === 0 : !texto.trim())}
                        style={{ padding: '0.625rem 1.75rem', borderRadius: '0.5rem', border: 'none', background: (submitting || uploading) ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: (submitting || uploading) ? 'not-allowed' : 'pointer' }}
                      >
                        {uploading ? 'Subiendo...' : submitting ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditandoEntrega(false); setTexto(''); setArchivos([]) }}
                        style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', background: 'white', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                      >
                        Cancelar edición
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {vencida && (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)' }}>
                        <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.875rem' }}>Esta tarea ya venció. Aun así puedes intentar entregar.</p>
                      </div>
                    )}

                    {/* Selector tipo */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[{ val: 'texto', label: 'Texto' }, { val: 'enlace', label: 'Enlace / URL' }, { val: 'archivo', label: 'Archivos' }].map(op => (
                        <label key={op.val} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.375rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', border: `1px solid ${tipoEntrega === op.val ? 'var(--wine-600)' : 'var(--wine-100)'}`, background: tipoEntrega === op.val ? 'rgba(123,45,59,0.06)' : 'var(--bg-page)', fontSize: '0.82rem', fontWeight: 600, color: tipoEntrega === op.val ? 'var(--wine-800)' : 'var(--text-secondary)' }}>
                          <input type="radio" name="tipoEntrega" value={op.val} checked={tipoEntrega === op.val} onChange={() => { setTipoEntrega(op.val); setTexto(''); setArchivos([]) }} style={{ display: 'none' }} />
                          {op.label}
                        </label>
                      ))}
                    </div>

                    {tipoEntrega === 'texto' && (
                      <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escribe tu entrega aquí..." rows={8}
                        style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', outline: 'none', fontSize: '0.875rem', lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', color: 'var(--text-primary)' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                      />
                    )}

                    {tipoEntrega === 'enlace' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <input type="url" value={texto} onChange={e => setTexto(e.target.value)} placeholder="https://drive.google.com/... o cualquier URL"
                          style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)' }}
                          onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                          onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                        />
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Google Drive, Dropbox, OneDrive, GitHub, etc.</p>
                      </div>
                    )}

                    {tipoEntrega === 'archivo' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Archivos ya cargados */}
                        {archivos.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {archivos.map(a => (
                              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: `1px solid ${a.error ? 'var(--error)' : a.uploading ? 'var(--wine-200)' : `${(EXT_INFO[getExt(a.nombre)]?.color ?? 'var(--wine-600)')}30`}`, background: a.error ? 'rgba(220,38,38,0.06)' : a.uploading ? 'var(--wine-50)' : `${(EXT_INFO[getExt(a.nombre)]?.color ?? 'var(--wine-600)')}0d` }}>
                                {a.uploading ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--wine-400)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                ) : a.error ? (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--error)' }}>✕</span>
                                ) : (
                                  <span style={{ padding: '1px 5px', borderRadius: '3px', background: EXT_INFO[getExt(a.nombre)]?.color ?? 'var(--wine-600)', color: 'white', fontSize: '0.62rem', fontWeight: 800, flexShrink: 0 }}>
                                    {(EXT_INFO[getExt(a.nombre)]?.label ?? getExt(a.nombre).toUpperCase())}
                                  </span>
                                )}
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: a.error ? 'var(--error)' : 'var(--text-primary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {a.error ? 'Error al subir' : a.uploading ? 'Subiendo...' : a.nombre}
                                </span>
                                <button onClick={() => quitarArchivo(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem', flexShrink: 0 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Zona de agregar archivos */}
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '1.25rem', borderRadius: '0.75rem', border: '2px dashed var(--wine-200)', background: 'var(--bg-page)', cursor: 'pointer' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--wine-400)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--wine-600)' }}>Agregar archivos</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>PDF, Word, PPT, Excel, imágenes, video — puedes subir varios</span>
                          <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.csv,.mp4,.webm,.avi,.mov,.mkv,.mp3,.wav,.ogg,.flac,.m4a,.aac,.jpg,.jpeg,.png,.gif,.webp,.zip" style={{ display: 'none' }} onChange={handleArchivos} />
                        </label>
                      </div>
                    )}

                    {submitMsg && (
                      <div style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', background: submitMsg.tipo === 'ok' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)', color: submitMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)', border: `1px solid ${submitMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)'}` }}>
                        {submitMsg.texto}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || uploading || (tipoEntrega === 'archivo' ? archivosListos.length === 0 : !texto.trim())}
                      style={{ padding: '0.625rem 1.75rem', borderRadius: '0.5rem', border: 'none', background: (submitting || uploading) ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: (submitting || uploading) ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}
                    >
                      {uploading ? 'Subiendo archivos...' : submitting ? 'Enviando...' : 'Enviar entrega'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Chat por tarea */}
            {(isEstudiante || canEdit) && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2rem' }}>
                <h2 style={{ margin: '0 0 1.25rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Chat de tarea
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                    {isEstudiante ? '— Mensajes privados con el profesor' : '— Mensajes con los estudiantes'}
                  </span>
                </h2>

                {/* Lista de mensajes */}
                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem', paddingRight: '0.25rem' }}>
                  {mensajes.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, textAlign: 'center', padding: '2rem 0' }}>
                      Sin mensajes aún. Escribe el primero para empezar.
                    </p>
                  ) : (
                    mensajes.map(msg => {
                      const esMio = msg.autor_id === user?.id
                      return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: esMio ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '75%', padding: '0.5rem 0.875rem', borderRadius: esMio ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0', background: esMio ? 'var(--wine-600)' : 'var(--bg-section)', border: esMio ? 'none' : '1px solid var(--wine-100)', color: esMio ? 'white' : 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                            {!esMio && (
                              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--wine-600)', opacity: 0.85 }}>
                                {msg.autor?.nombre_completo ?? 'Usuario'}
                              </span>
                            )}
                            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.contenido}</span>
                          </div>
                          <span style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', marginTop: '0.2rem', padding: '0 0.25rem' }}>
                            {new Date(msg.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input de mensaje */}
                <form onSubmit={handleEnviarMensaje} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={e => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    style={{ flex: 1, padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                  />
                  <button
                    type="submit"
                    disabled={enviandoMensaje || !nuevoMensaje.trim()}
                    style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: (enviandoMensaje || !nuevoMensaje.trim()) ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: (enviandoMensaje || !nuevoMensaje.trim()) ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                  >
                    {enviandoMensaje ? '...' : 'Enviar'}
                  </button>
                </form>
              </div>
            )}

            {/* Vista Docente / Admin */}
            {canEdit && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2rem' }}>
                <h2 style={{ margin: '0 0 1.25rem', color: 'var(--wine-800)', fontSize: '1.1rem', fontWeight: 700 }}>
                  Entregas ({entregas.length})
                </h2>

                {entregas.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Ningún estudiante ha entregado aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {entregas.map(entrega => (
                      <div key={entrega.id} style={{ border: '1px solid var(--wine-100)', borderRadius: '0.75rem', overflow: 'hidden' }}>
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
                            {entrega.calificacion != null ? (() => {
                              const c = colorCalificacion(entrega.calificacion, tarea.puntaje_maximo)
                              return (
                                <span style={{ padding: '3px 10px', borderRadius: '6px', background: c.bg, color: c.color, fontSize: '0.8rem', fontWeight: 700 }}>
                                  {entrega.calificacion}{tarea.puntaje_maximo != null ? `/${tarea.puntaje_maximo}` : ''} pts
                                </span>
                              )
                            })() : (
                              <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(234,179,8,0.1)', color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 700 }}>Sin calificar</span>
                            )}
                            <button
                              onClick={() => { setGradingId(entrega.id === gradingId ? null : entrega.id); setGradeForm({ calificacion: entrega.calificacion ?? '', retroalimentacion: entrega.retroalimentacion ?? '' }) }}
                              style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--wine-200)', background: 'white', color: 'var(--wine-600)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {gradingId === entrega.id ? 'Cerrar' : 'Calificar'}
                            </button>
                            <button
                              onClick={() => handleCancelarEntregaDocente(entrega.id)}
                              style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: 'var(--error)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                              title="Eliminar esta entrega para que el estudiante pueda volver a entregar"
                            >
                              Cancelar entrega
                            </button>
                          </div>
                        </div>

                        <div style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.7, borderTop: '1px solid var(--wine-100)' }}>
                          <EntregaContenido contenido={entrega.contenido_entrega} />
                        </div>

                        {entrega.retroalimentacion && gradingId !== entrega.id && (
                          <div style={{ padding: '0.75rem 1rem', background: 'rgba(22,163,74,0.05)', borderTop: '1px solid var(--wine-100)', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Retroalimentación: {entrega.retroalimentacion}
                          </div>
                        )}

                        {gradingId === entrega.id && (
                          <div style={{ padding: '1rem', borderTop: '1px solid var(--wine-100)', background: 'var(--bg-section)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                Calificación{tarea.puntaje_maximo != null ? ` / ${tarea.puntaje_maximo}` : ''}:
                              </label>
                              <input type="number" min="0" step="0.5" max={tarea.puntaje_maximo ?? undefined}
                                value={gradeForm.calificacion}
                                onChange={e => setGradeForm(p => ({ ...p, calificacion: e.target.value }))}
                                style={{ width: '80px', padding: '0.375rem 0.5rem', borderRadius: '6px', border: '1px solid var(--wine-100)', fontSize: '0.875rem', outline: 'none' }}
                              />
                            </div>
                            <textarea placeholder="Retroalimentación (opcional)..."
                              value={gradeForm.retroalimentacion}
                              onChange={e => setGradeForm(p => ({ ...p, retroalimentacion: e.target.value }))}
                              rows={2}
                              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--wine-100)', fontSize: '0.8rem', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                            />
                            <button onClick={() => handleCalificar(entrega.id)} disabled={savingGrade || !gradeForm.calificacion}
                              style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', background: 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', alignSelf: 'flex-start' }}>
                              {savingGrade ? 'Guardando...' : 'Guardar calificación'}
                            </button>
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
