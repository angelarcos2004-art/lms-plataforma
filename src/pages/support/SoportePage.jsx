import { useState, useEffect, useRef } from 'react'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import {
  getMisChats,
  getTodosLosChats,
  crearChatSoporte,
  getMensajesChat,
  enviarMensajeChat,
  actualizarEstadoChat,
} from '../../lib/supportService'
import { supabase } from '../../lib/supabase'

const ESTADO = {
  abierto:     { label: 'Abierto',      color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  en_progreso: { label: 'En progreso',  color: '#EA580C', bg: 'rgba(234,88,12,0.1)' },
  cerrado:     { label: 'Cerrado',      color: 'var(--text-secondary)', bg: 'rgba(100,100,100,0.08)' },
}

const PRIORIDAD = {
  alta:   { label: 'Docente',     color: '#EA580C', bg: 'rgba(234,88,12,0.1)' },
  normal: { label: 'Estudiante',  color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
}

export default function SoportePage() {
  const { user } = useAuth()
  const { isAdmin, isDocente } = useRole()

  const [chats, setChats] = useState([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [asunto, setAsunto] = useState('')
  const [creando, setCreando] = useState(false)
  const [updatingEstado, setUpdatingEstado] = useState(false)

  const chatEndRef = useRef(null)
  const selectedChat = chats.find(c => c.id === selectedId) ?? null

  // ── Carga lista de chats ──────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return
    const cargar = isAdmin ? getTodosLosChats : () => getMisChats(user.id)

    setLoadingChats(true)
    cargar().then(({ data }) => { setChats(data ?? []); setLoadingChats(false) })

    const ch = supabase
      .channel('soporte-lista')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats_soporte' }, () => {
        cargar().then(({ data }) => setChats(data ?? []))
      })
      .subscribe()

    return () => supabase.removeChannel(ch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAdmin])

  // ── Mensajes del chat seleccionado ───────────────────────────────────────

  useEffect(() => {
    if (!selectedId) { setMensajes([]); return }
    setLoadingMsgs(true)
    getMensajesChat(selectedId).then(({ data }) => {
      setMensajes(data ?? [])
      setLoadingMsgs(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })

    const ch = supabase
      .channel(`soporte-msgs-${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes_soporte',
        filter: `chat_id=eq.${selectedId}`,
      }, async () => {
        const { data } = await getMensajesChat(selectedId)
        setMensajes(data ?? [])
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()

    return () => supabase.removeChannel(ch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleCrearChat(e) {
    e.preventDefault()
    if (!asunto.trim()) return
    setCreando(true)
    const prioridad = isDocente ? 'alta' : 'normal'
    const { data, error } = await crearChatSoporte(user.id, asunto.trim(), prioridad)
    setCreando(false)
    if (!error && data) {
      setAsunto('')
      setShowForm(false)
      const cargar = isAdmin ? getTodosLosChats : () => getMisChats(user.id)
      const { data: nuevos } = await cargar()
      setChats(nuevos ?? [])
      setSelectedId(data.id)
    }
  }

  async function handleEnviar(e) {
    e.preventDefault()
    if (!nuevoMensaje.trim() || !selectedId) return
    setEnviando(true)
    const { error } = await enviarMensajeChat(selectedId, user.id, nuevoMensaje.trim())
    setEnviando(false)
    if (!error) {
      setNuevoMensaje('')
      const { data } = await getMensajesChat(selectedId)
      setMensajes(data ?? [])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  async function handleCambiarEstado(estado) {
    setUpdatingEstado(true)
    const { data } = await actualizarEstadoChat(selectedId, estado)
    setUpdatingEstado(false)
    if (data) setChats(prev => prev.map(c => c.id === selectedId ? { ...c, estado: data.estado } : c))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{
        flex: 1, display: 'flex', maxWidth: '1100px', width: '100%',
        margin: '0 auto', padding: '1.5rem', gap: '1.5rem', alignItems: 'flex-start',
      }}>

        {/* ─── Sidebar ──────────────────────────────────────────────── */}
        <aside style={{
          width: '290px', flexShrink: 0,
          background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
          borderRadius: '1rem', overflow: 'hidden',
          position: 'sticky', top: '80px',
        }}>
          {/* Cabecera */}
          <div style={{
            padding: '1.125rem 1.25rem 0.875rem',
            borderBottom: '1px solid var(--wine-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--wine-800)' }}>Soporte</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {isAdmin ? 'Todos los tickets · docentes primero' : 'Mis consultas'}
              </p>
            </div>
            {!isAdmin && (
              <button
                onClick={() => { setShowForm(v => !v); setAsunto('') }}
                style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: 'var(--wine-600)', color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                + Nueva
              </button>
            )}
          </div>

          {/* Formulario nueva consulta */}
          {showForm && (
            <form onSubmit={handleCrearChat} style={{
              padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--wine-100)',
              background: 'var(--bg-section)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
            }}>
              <input
                autoFocus
                placeholder="Asunto de tu consulta..."
                value={asunto}
                onChange={e => setAsunto(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--wine-100)', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
              />
              {isDocente && (
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#EA580C', fontWeight: 600 }}>
                  Tu consulta tendrá prioridad alta como docente.
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button type="submit" disabled={creando || !asunto.trim()}
                  style={{ flex: 1, padding: '5px', borderRadius: '6px', border: 'none', background: creando || !asunto.trim() ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  {creando ? '...' : 'Abrir consulta'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--wine-100)', background: 'white', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 210px)' }}>
            {loadingChats ? (
              <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>Cargando...</p>
            ) : chats.length === 0 ? (
              <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>
                {isAdmin ? 'No hay tickets aún.' : 'No tienes consultas.\nUsa "+ Nueva" para abrir una.'}
              </p>
            ) : (
              chats.map(chat => {
                const es = ESTADO[chat.estado] ?? ESTADO.abierto
                const pr = PRIORIDAD[chat.prioridad] ?? PRIORIDAD.normal
                const active = chat.id === selectedId
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedId(chat.id)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      background: active ? 'rgba(123,45,59,0.07)' : 'transparent',
                      border: 'none', borderBottom: '1px solid var(--wine-100)',
                      borderLeft: active ? '3px solid var(--wine-600)' : '3px solid transparent',
                      padding: '0.875rem 1.25rem',
                      display: 'flex', flexDirection: 'column', gap: '0.3rem',
                    }}
                  >
                    {/* Asunto + estado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 700, color: 'var(--wine-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chat.asunto}
                      </span>
                      <span style={{ padding: '1px 7px', borderRadius: '9999px', fontSize: '0.63rem', fontWeight: 700, color: es.color, background: es.bg, flexShrink: 0 }}>
                        {es.label}
                      </span>
                    </div>

                    {/* Admin: prioridad + nombre usuario */}
                    {isAdmin && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ padding: '1px 6px', borderRadius: '9999px', fontSize: '0.62rem', fontWeight: 700, color: pr.color, background: pr.bg }}>
                          {pr.label}
                        </span>
                        {chat.usuario?.nombre_completo && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                            {chat.usuario.nombre_completo}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Fecha */}
                    <span style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>
                      {new Date(chat.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* ─── Panel principal ───────────────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {selectedChat ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
              borderRadius: '1rem', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              height: 'calc(100vh - 112px)',
            }}>
              {/* Cabecera del chat */}
              <div style={{
                padding: '1rem 1.5rem', borderBottom: '1px solid var(--wine-100)',
                background: 'var(--bg-section)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
              }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--wine-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedChat.asunto}
                  </h3>
                  {isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '1px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700, color: PRIORIDAD[selectedChat.prioridad]?.color, background: PRIORIDAD[selectedChat.prioridad]?.bg }}>
                        {PRIORIDAD[selectedChat.prioridad]?.label}
                      </span>
                      {selectedChat.prioridad === 'alta' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EA580C' }}>· Prioridad alta</span>
                      )}
                      {selectedChat.usuario?.nombre_completo && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          · {selectedChat.usuario.nombre_completo}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Estado */}
                {isAdmin ? (
                  <select
                    value={selectedChat.estado}
                    onChange={e => handleCambiarEstado(e.target.value)}
                    disabled={updatingEstado}
                    style={{
                      padding: '5px 10px', borderRadius: '8px',
                      border: `1px solid ${ESTADO[selectedChat.estado]?.color ?? 'var(--wine-200)'}`,
                      fontSize: '0.78rem', fontWeight: 700,
                      color: ESTADO[selectedChat.estado]?.color,
                      background: ESTADO[selectedChat.estado]?.bg,
                      cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="abierto">Abierto</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                ) : (
                  <span style={{
                    padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                    color: ESTADO[selectedChat.estado]?.color,
                    background: ESTADO[selectedChat.estado]?.bg,
                  }}>
                    {ESTADO[selectedChat.estado]?.label}
                  </span>
                )}
              </div>

              {/* Mensajes */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loadingMsgs ? (
                  <p style={{ margin: 'auto 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Cargando mensajes...
                  </p>
                ) : mensajes.length === 0 ? (
                  <p style={{ margin: 'auto 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Sin mensajes. Describe tu problema para comenzar.
                  </p>
                ) : (
                  mensajes.map(msg => {
                    const esMio = msg.autor_id === user?.id
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: esMio ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '72%', padding: '0.625rem 0.875rem', lineHeight: 1.55,
                          borderRadius: esMio ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                          background: esMio ? 'var(--wine-600)' : 'var(--bg-section)',
                          border: esMio ? 'none' : '1px solid var(--wine-100)',
                          color: esMio ? 'white' : 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}>
                          {!esMio && (
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--wine-600)' }}>
                              {isAdmin ? msg.autor?.nombre_completo ?? 'Usuario' : 'Soporte'}
                            </span>
                          )}
                          {esMio && isAdmin && (
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, marginBottom: '0.2rem', color: 'rgba(255,255,255,0.65)' }}>
                              Soporte (tú)
                            </span>
                          )}
                          <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.contenido}</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem', padding: '0 0.25rem' }}>
                          {new Date(msg.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              {selectedChat.estado !== 'cerrado' ? (
                <form onSubmit={handleEnviar} style={{
                  padding: '1rem 1.5rem', borderTop: '1px solid var(--wine-100)',
                  background: 'var(--bg-section)', display: 'flex', gap: '0.75rem',
                }}>
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={e => setNuevoMensaje(e.target.value)}
                    placeholder={isAdmin ? 'Escribe tu respuesta...' : 'Escribe tu mensaje...'}
                    style={{ flex: 1, padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                  />
                  <button
                    type="submit"
                    disabled={enviando || !nuevoMensaje.trim()}
                    style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: (enviando || !nuevoMensaje.trim()) ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: (enviando || !nuevoMensaje.trim()) ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                  >
                    {enviando ? '...' : 'Enviar'}
                  </button>
                </form>
              ) : (
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--wine-100)', background: 'var(--bg-section)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Esta consulta está cerrada.
                    {!isAdmin && ' Crea una nueva consulta si necesitas más ayuda.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Empty state */
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: 'calc(100vh - 112px)', gap: '1rem',
            }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--wine-200)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--wine-300)' }}>
                {isAdmin ? 'Selecciona un ticket para responder' : 'Selecciona una consulta o crea una nueva'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
