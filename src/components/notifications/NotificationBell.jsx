import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getNotificaciones, getUnreadCount, marcarLeida, marcarTodasLeidas } from '../../lib/socialService'

const TIPO_COLOR = {
  tarea:        { bg: 'rgba(168,69,88,0.1)',   color: 'var(--wine-600)',  label: 'Tarea' },
  calificacion: { bg: 'rgba(22,163,74,0.1)',   color: 'var(--success)',   label: 'Calificación' },
  foro:         { bg: 'rgba(37,99,235,0.1)',   color: 'var(--info)',      label: 'Foro' },
  sistema:      { bg: 'rgba(107,114,128,0.1)', color: 'var(--text-secondary)', label: 'Sistema' },
  otro:         { bg: 'rgba(107,114,128,0.1)', color: 'var(--text-secondary)', label: 'Otro' },
}

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const wrapperRef = useRef(null)

  // Cargar conteo al montar
  useEffect(() => {
    if (!user) return
    getUnreadCount(user.id).then(({ count }) => setUnread(count ?? 0))
  }, [user])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleOpen() {
    if (!open) {
      setLoadingNotifs(true)
      const { data } = await getNotificaciones(user.id)
      setNotifs(data ?? [])
      setLoadingNotifs(false)
      // Actualizar conteo
      const { count } = await getUnreadCount(user.id)
      setUnread(count ?? 0)
    }
    setOpen(v => !v)
  }

  async function handleClickNotif(notif) {
    if (!notif.leida) {
      await marcarLeida(notif.id)
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    }
    setOpen(false)
    if (notif.url_destino) navigate(notif.url_destino)
  }

  async function handleMarcarTodas() {
    await marcarTodasLeidas(user.id)
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
    setUnread(0)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Botón campana */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative', background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
          width: '36px', height: '36px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        title="Notificaciones"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: 'var(--error)', color: 'white',
            borderRadius: '9999px', minWidth: '16px', height: '16px',
            fontSize: '0.65rem', fontWeight: 800, lineHeight: '16px',
            textAlign: 'center', padding: '0 3px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '340px', background: 'var(--bg-card)',
          border: '1px solid var(--wine-100)', borderRadius: '1rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          zIndex: 200, overflow: 'hidden',
        }}>
          {/* Header dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--wine-100)' }}>
            <span style={{ fontWeight: 700, color: 'var(--wine-800)', fontSize: '0.9rem' }}>
              Notificaciones {unread > 0 && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>({unread} nuevas)</span>}
            </span>
            {unread > 0 && (
              <button onClick={handleMarcarTodas} style={{ background: 'none', border: 'none', color: 'var(--wine-600)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {loadingNotifs && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Cargando...
              </div>
            )}

            {!loadingNotifs && notifs.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sin notificaciones</p>
              </div>
            )}

            {!loadingNotifs && notifs.map(notif => {
              const tipo = TIPO_COLOR[notif.tipo] ?? TIPO_COLOR.otro
              return (
                <button
                  key={notif.id}
                  onClick={() => handleClickNotif(notif)}
                  style={{
                    width: '100%', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                    padding: '0.875rem 1.125rem', border: 'none', textAlign: 'left',
                    background: notif.leida ? 'transparent' : 'rgba(92,26,40,0.04)',
                    borderBottom: '1px solid var(--wine-100)',
                    cursor: notif.url_destino ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (notif.url_destino) e.currentTarget.style.background = 'var(--wine-50)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = notif.leida ? 'transparent' : 'rgba(92,26,40,0.04)' }}
                >
                  {/* Indicador no leída */}
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: notif.leida ? 'transparent' : 'var(--wine-600)', marginTop: '6px', flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, background: tipo.bg, color: tipo.color }}>
                        {tipo.label}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {tiempoRelativo(notif.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: '0.82rem', fontWeight: notif.leida ? 400 : 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notif.titulo}
                    </p>
                    {notif.mensaje && (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.mensaje}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function tiempoRelativo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}
