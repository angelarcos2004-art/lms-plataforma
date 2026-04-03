import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { getHiloById, getMensajesByHilo, crearMensaje, eliminarMensaje } from '../../lib/socialService'

export default function HiloPage() {
  const { id: cursoId, hiloId } = useParams()
  const { user } = useAuth()
  const { isAdmin } = useRole()

  const [hilo, setHilo] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [respuesta, setRespuesta] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const bottomRef = useRef(null)

  const cursoTitulo = hilo?.foros?.cursos?.titulo ?? 'Curso'

  useEffect(() => {
    async function cargar() {
      const { data: hiloData } = await getHiloById(hiloId)
      setHilo(hiloData)
      const { data: msgs } = await getMensajesByHilo(hiloId)
      setMensajes(msgs ?? [])
      setLoading(false)
    }
    cargar()
  }, [hiloId])

  useEffect(() => {
    // Scroll al fondo cuando carguen mensajes
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [loading, mensajes.length])

  async function handleResponder(e) {
    e.preventDefault()
    if (!respuesta.trim()) return
    setSending(true)
    setSendError(null)
    const { data, error } = await crearMensaje(hiloId, user.id, respuesta.trim())
    setSending(false)
    if (error) { setSendError('No se pudo enviar el mensaje.'); return }
    setMensajes(prev => [...prev, data])
    setRespuesta('')
  }

  async function handleEliminarMensaje(id) {
    if (!confirm('¿Eliminar este mensaje?')) return
    await eliminarMensaje(id)
    setMensajes(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Breadcrumb + Regresar */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            <Link to={`/courses/${cursoId}`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>{cursoTitulo}</Link>
            <span>›</span>
            <Link to={`/courses/${cursoId}/foro`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>Foro</Link>
            <span>›</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{hilo?.titulo ?? '...'}</span>
          </div>
          <Link to={`/courses/${cursoId}/foro`} style={{ fontSize: '0.8rem', color: 'var(--wine-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ← Regresar al foro
          </Link>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando...</div>}

        {!loading && hilo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Post original */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--wine-800), var(--wine-600))', padding: '1.5rem' }}>
                <h1 style={{ margin: '0 0 0.75rem', color: 'white', fontSize: '1.25rem', fontWeight: 800 }}>
                  {hilo.titulo}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                    {(hilo.usuarios?.nombre_completo ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
                    {hilo.usuarios?.nombre_completo ?? 'Autor'}
                  </span>
                  <RolBadgeHilo rol={hilo.usuarios?.rol} />
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>· {tiempoRelativo(hilo.created_at)}</span>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {hilo.contenido}
                </p>
              </div>
            </div>

            {/* Mensajes */}
            {mensajes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {mensajes.length} respuesta{mensajes.length !== 1 ? 's' : ''}
                </h2>
                {mensajes.map(msg => {
                  const esPropio = msg.autor_id === user?.id
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                        flexDirection: esPropio ? 'row-reverse' : 'row',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: esPropio ? 'linear-gradient(135deg, var(--wine-400), var(--wine-600))' : 'var(--wine-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: esPropio ? 'white' : 'var(--wine-600)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                        {(msg.usuarios?.nombre_completo ?? '?').charAt(0).toUpperCase()}
                      </div>

                      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: esPropio ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {esPropio ? 'Tú' : msg.usuarios?.nombre_completo ?? 'Usuario'}
                          {!esPropio && <RolBadgeHilo rol={msg.usuarios?.rol} />}
                          <span>· {tiempoRelativo(msg.created_at)}</span>
                        </span>
                        <div style={{ background: esPropio ? 'var(--wine-50)' : 'var(--bg-card)', border: `1px solid ${esPropio ? 'var(--wine-200)' : 'var(--wine-100)'}`, borderRadius: esPropio ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '0.75rem 1rem', position: 'relative' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {msg.contenido}
                          </p>
                          {(esPropio || isAdmin) && (
                            <button
                              onClick={() => handleEliminarMensaje(msg.id)}
                              style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.65rem', padding: '2px', opacity: 0.5 }}
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
            )}

            {/* Formulario de respuesta */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.25rem' }}>
              <form onSubmit={handleResponder} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <textarea
                  value={respuesta}
                  onChange={e => setRespuesta(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  rows={3}
                  style={{
                    flex: 1, padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
                    border: '1px solid var(--wine-100)', outline: 'none',
                    fontSize: '0.875rem', lineHeight: 1.6, resize: 'vertical',
                    fontFamily: 'inherit', color: 'var(--text-primary)',
                    background: 'var(--bg-page)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleResponder(e) }}
                />
                <button
                  type="submit"
                  disabled={sending || !respuesta.trim()}
                  style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: sending ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: sending ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                >
                  {sending ? '...' : 'Responder'}
                </button>
              </form>
              {sendError && <p style={{ margin: '0.5rem 0 0', color: 'var(--error)', fontSize: '0.8rem' }}>{sendError}</p>}
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Ctrl + Enter para enviar</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function RolBadgeHilo({ rol }) {
  if (!rol) return null
  const estilos = {
    administrador: { bg: 'rgba(123,45,59,0.12)', color: 'var(--wine-800)', border: 'var(--wine-200)', label: 'Administrador' },
    docente:       { bg: 'rgba(37,99,235,0.1)',  color: 'var(--info)',      border: 'rgba(37,99,235,0.25)', label: 'Docente' },
    estudiante:    { bg: 'rgba(22,163,74,0.09)', color: 'var(--success)',   border: 'rgba(22,163,74,0.3)',  label: 'Estudiante' },
  }
  const e = estilos[rol]
  if (!e) return null
  return (
    <span style={{ padding: '1px 7px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, background: e.bg, color: e.color, border: `1px solid ${e.border}` }}>
      {e.label}
    </span>
  )
}

function tiempoRelativo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}
