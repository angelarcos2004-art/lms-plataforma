import { useState, useEffect, useRef } from 'react'

/**
 * Sala Virtual usando la Jitsi Meet External API.
 * Genera una sala única por cursoId: meet.jit.si/Paideia-LMS-Curso-{cursoId}
 */
export default function SalaVirtual({ cursoId, cursoTitulo, userName, esDocente }) {
  const [abierta, setAbierta] = useState(false)
  const [apiReady, setApiReady] = useState(!!window.JitsiMeetExternalAPI)
  const jitsiRef = useRef(null)
  const containerRef = useRef(null)

  // Cargar el script de Jitsi External API una sola vez
  useEffect(() => {
    if (window.JitsiMeetExternalAPI) { setApiReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => setApiReady(true)
    document.head.appendChild(script)
    return () => {}
  }, [])

  // Inicializar / destruir Jitsi al abrir/cerrar
  useEffect(() => {
    if (abierta && apiReady && containerRef.current && !jitsiRef.current) {
      jitsiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: `PaideiaLMS-Curso-${cursoId}`,
        width: '100%',
        height: 480,
        parentNode: containerRef.current,
        userInfo: { displayName: userName ?? 'Usuario Paideia' },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'fullscreen',
            'hangup', 'chat', 'raisehand', 'tileview',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participante',
        },
      })

      // Al colgar, cerrar la sala automáticamente
      jitsiRef.current.addEventListener('videoConferenceLeft', () => {
        cerrar()
      })
    }

    if (!abierta && jitsiRef.current) {
      jitsiRef.current.dispose()
      jitsiRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, apiReady])

  function cerrar() {
    if (jitsiRef.current) {
      jitsiRef.current.dispose()
      jitsiRef.current = null
    }
    setAbierta(false)
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', overflow: 'hidden' }}>

      {/* Header de la sección */}
      <div style={{ padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* Ícono de video */}
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.2rem', color: 'var(--wine-800)', fontSize: '1.05rem', fontWeight: 700 }}>
              Sala Virtual
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              {esDocente
                ? 'Inicia una videollamada con tus estudiantes'
                : 'Únete a la clase en línea del docente'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {abierta && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: '#16A34A' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', animation: 'pulse 2s infinite' }} />
              En vivo
            </span>
          )}
          <button
            onClick={() => abierta ? cerrar() : setAbierta(true)}
            disabled={!apiReady}
            style={{
              padding: '0.6rem 1.25rem',
              background: abierta ? 'rgba(220,38,38,0.08)' : '#2563EB',
              color: abierta ? '#DC2626' : 'white',
              border: abierta ? '1px solid rgba(220,38,38,0.3)' : 'none',
              borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem',
              cursor: apiReady ? 'pointer' : 'wait',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {!apiReady
              ? 'Cargando...'
              : abierta
                ? '✕ Salir de la sala'
                : esDocente ? '📹 Iniciar clase virtual' : '📹 Unirse a la clase'}
          </button>
        </div>
      </div>

      {/* Aviso de sala compartida */}
      {!abierta && (
        <div style={{ margin: '0 1.75rem 1.25rem', padding: '0.6rem 1rem', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Sala: <code style={{ fontWeight: 700, color: 'var(--text-primary)' }}>PaideiaLMS-Curso-{cursoId}</code>
          {' '}— Todos los participantes del curso entran a la misma sala.
        </div>
      )}

      {/* Contenedor de Jitsi */}
      {abierta && (
        <div
          ref={containerRef}
          style={{ width: '100%', borderTop: '1px solid var(--wine-100)' }}
        />
      )}
    </div>
  )
}
