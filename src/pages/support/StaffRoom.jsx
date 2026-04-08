import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { getMensajesStaff, enviarMensajeStaff, limpiarChatStaff } from '../../lib/supportService'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { supabase } from '../../lib/supabase'

export default function StaffRoom() {
  const { user, profile } = useAuth()
  const { isAdmin, isDocente, isLoading: roleLoading } = useRole()
  const navigate = useNavigate()

  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirmLimpiar, setConfirmLimpiar] = useState(false)
  const bottomRef = useRef(null)

  // Redirigir solo cuando el rol ya cargó y es estudiante/sin rol
  useEffect(() => {
    if (!roleLoading && isAdmin === false && isDocente === false) {
      navigate('/')
    }
  }, [isAdmin, isDocente, roleLoading, navigate])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getMensajesStaff()
        if (data) setMensajes(data)
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin || isDocente) {
      load()
      
      const ch = supabase
        .channel('staff-room-chat')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_chat'
        }, async () => {
          const { data } = await getMensajesStaff()
          if (data) setMensajes(data)
        })
        .subscribe()

      return () => supabase.removeChannel(ch)
    }
  }, [isAdmin, isDocente])

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensajes, loading])

  const handleEnviar = async (e) => {
    e.preventDefault()
    const tx = nuevoMensaje.trim()
    if (!tx || sending) return

    // CREACIÓN OPTIMISTA (Mejora de Latencia/Velocidad UI)
    const tempId = `temp-${Date.now()}`
    const mOpt = {
      id: tempId,
      mensaje: tx,
      created_at: new Date().toISOString(),
      emisor: {
        id: user.id,
        nombre_completo: profile?.nombre_completo || user.email,
        rol: isAdmin ? 'admin' : 'docente'
      }
    }

    setMensajes(prev => [...prev, mOpt])
    setNuevoMensaje('')
    setSending(true)

    const { error } = await enviarMensajeStaff(user.id, tx)
    setSending(false)
    if (error) {
      setMensajes(prev => prev.filter(m => m.id !== tempId))
      setNuevoMensaje(tx)
      alert("Error de conexión al enviar el mensaje.")
    }
  }

  // Funciones visuales
  const renderAvatar = (nombre, rol) => {
    const isAd = rol === 'admin' || rol === 'administrador'
    const char = (nombre || '?').charAt(0).toUpperCase()
    return (
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
        background: isAd ? 'linear-gradient(135deg, var(--gold), var(--warning))' : 'linear-gradient(135deg, var(--wine-400), var(--wine-600))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isAd ? 'var(--wine-900)' : 'white', fontWeight: 800, fontSize: '1.2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {char}
      </div>
    )
  }

  if (roleLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--wine-700)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <p style={{ fontWeight: 600 }}>Verificando permisos...</p>
        </div>
      </div>
    </div>
  )
  if (isAdmin === false && isDocente === false) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '900px', margin: '0 auto', width: '100%', padding: '1rem', height: 'calc(100vh - 70px)' }}>
        
        {/* Cabecera del WhatsApp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--wine-800)', padding: '1rem 1.5rem', borderRadius: '1rem 1rem 0 0', color: 'white', flexShrink: 0, justifyContent: 'space-between' }}>
          <div style={{
            width: '45px', height: '45px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wine-800)'
          }}>
            <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.37 1.23 4.81L2.1 21.9l5.24-1.09C8.74 21.56 10.33 22 12 22c5.52 22 10-4.48 10-10S17.52 2 12 2zM16.5 15.5c-1.25.64-2.73.57-4-.14-1.29-.72-2.31-1.78-3.03-3.11-.69-1.28-.75-2.78-.09-4.05.34-.65 1-.95 1.63-.61.47.24.96 1.05 1.15 1.48.2.46.06.94-.28 1.28-.2.2-.42.42-.58.65.65 1.05 1.57 1.95 2.65 2.58.23-.17.46-.38.66-.59.34-.34.8-.49 1.26-.28.42.19 1.19.67 1.43 1.14.33.65.04 1.34-.56 1.65z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Sala de Staff</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Canal cerrado de comunicación: Administradores y Docentes</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setConfirmLimpiar(true)}
              title="Limpiar historial del chat"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '0.5rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            >
              🗑️ Limpiar chat
            </button>
          )}
        </div>

        {/* Zona de Mensajes */}
        <div style={{
          flex: 1, backgroundColor: '#e5ddd5', backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover', backgroundBlendMode: 'soft-light', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--wine-800)', fontWeight: 600 }}>Cargando historial de chat...</div>
          ) : mensajes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--wine-800)', background: 'rgba(255,255,255,0.8)', borderRadius: '8px', alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
              Este es el comienzo de la Sala de Profesores. Envía un mensaje.
            </div>
          ) : (
            mensajes.map((m, idx) => {
              const esPropio = m.emisor?.id === user?.id
              const isAd = m.emisor?.rol === 'admin' || m.emisor?.rol === 'administrador'
              
              // Evitar renderizar fecha duplicada o mostrar nuevo día (simplificado)
              return (
                <div key={m.id} style={{
                  display: 'flex', gap: '0.5rem', alignSelf: esPropio ? 'flex-end' : 'flex-start',
                  flexDirection: esPropio ? 'row-reverse' : 'row', maxWidth: '85%'
                }}>
                  {!esPropio && renderAvatar(m.emisor?.nombre_completo, m.emisor?.rol)}
                  <div style={{
                    background: esPropio ? '#dcf8c6' : '#ffffff',
                    borderRadius: esPropio ? '8px 0 8px 8px' : '0 8px 8px 8px',
                    padding: '0.5rem 0.75rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    display: 'flex', flexDirection: 'column', minWidth: '150px'
                  }}>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 800, 
                      color: isAd ? '#D97706' : '#9f1239', 
                      marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span>{m.emisor?.nombre_completo || 'Usuario'}</span>
                      <span style={{
                        marginLeft: '0.5rem', padding: '2px 5px', borderRadius: '4px', fontSize: '0.65rem', 
                        background: isAd ? 'rgba(217,119,6,0.1)' : 'rgba(159,18,57,0.1)'
                      }}>
                        {isAd ? '🛡️ ADMIN' : '👨‍🏫 PROFESOR'}
                      </span>
                    </span>
                    <span style={{ fontSize: '0.95rem', color: '#111', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                      {m.mensaje}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#666', alignSelf: 'flex-end', marginTop: '0.2rem' }}>
                      {new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Creador de Mensaje */}
        <div style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '0 0 1rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
          <textarea
            value={nuevoMensaje}
            onChange={e => setNuevoMensaje(e.target.value)}
            placeholder="Escribe un mensaje al equipo..."
            rows={2}
            style={{
              flex: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: 'none',
              outline: 'none', resize: 'none', fontSize: '0.95rem', fontFamily: 'inherit',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)', background: 'white'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleEnviar(e)
              }
            }}
          />
          <button
            onClick={handleEnviar}
            disabled={!nuevoMensaje.trim() || sending}
            style={{
              width: '46px', height: '46px', borderRadius: '50%', background: nuevoMensaje.trim() ? 'var(--wine-800)' : '#cbd5e1',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: nuevoMensaje.trim() ? 'pointer' : 'not-allowed',
              color: 'white', transition: 'background 0.2s', flexShrink: 0
            }}
          >
            <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', marginLeft: '4px' }}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>

      </main>

      <ConfirmModal
        open={confirmLimpiar}
        title="¿Limpiar historial del chat?"
        description="Se eliminarán todos los mensajes de la Sala de Staff de forma permanente. Esta acción no se puede deshacer."
        confirmLabel="Sí, limpiar todo"
        onConfirm={async () => {
          setConfirmLimpiar(false)
          const { error, count } = await limpiarChatStaff()
          if (error) {
            alert(`No se pudo limpiar el chat: ${error.message}`)
          } else if (count === 0) {
            alert('Supabase bloqueó la operación por RLS.\n\nVe a Supabase → SQL Editor y ejecuta el script de permisos que te dio Claude.')
          } else {
            setMensajes([])
          }
        }}
        onCancel={() => setConfirmLimpiar(false)}
      />
    </div>
  )
}
