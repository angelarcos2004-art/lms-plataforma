import { useState, useRef, useEffect } from 'react'
import { useRole } from '../../hooks/useRole'

const FAQ_OPTIONS = [
  { id: 'contact', title: '👥 Contactar Soporte' },
  { id: 'disabled', title: '🔒 Cuenta Desactivada' },
  { id: 'recover', title: '🔑 Recuperar Contraseña' }
]

const RESPONSES = {
  contact: 'Puedes mandar un correo directamente a nuestros administradores a: ayavpn.2025@gmail.com. Te responderemos en breve.',
  disabled: 'Si intentas entrar y dice "Cuenta desactivada", significa que un administrador ha bloqueado tu ingreso temporalmente por falta de pagos o disciplina. Por favor escribe a ayavpn.2025@gmail.com detallando tu caso.',
  recover: 'Para recuperar tu contraseña, utiliza el botón "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión. Te llegará un enlace a tu correo.'
}

export default function FaqChatbot() {
  const { isAdmin } = useRole()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: '¡Hola! Soy el asistente virtual de Paideia. ¿En qué te puedo ayudar hoy?' }
  ])
  const messagesEndRef = useRef(null)

  // Si es administrador, no mostramos el bot
  if (isAdmin) return null

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  const handleOptionClick = (option) => {
    // Agregar el mensaje del usuario
    setMessages(prev => [...prev, { type: 'user', text: option.title }])

    // Simular un pequeño retraso para la respuesta del bot
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: RESPONSES[option.id] }])
    }, 600)
  }

  const resetChat = () => {
    setMessages([{ type: 'bot', text: '¡Hola! Soy el asistente virtual de Paideia. ¿En qué te puedo ayudar hoy?' }])
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--wine-700)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, background 0.2s',
          zIndex: 9999,
          transform: isOpen ? 'scale(0.8)' : 'scale(1)',
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto'
        }}
        title="Abrir Asistente"
      >
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '30px', height: '30px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Ventana de Chat */}
      <div style={{
        position: 'fixed',
        bottom: isOpen ? '2rem' : '-100%',
        right: '2rem',
        width: '350px',
        maxWidth: 'calc(100vw - 4rem)',
        height: '500px',
        maxHeight: 'calc(100vh - 4rem)',
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '1rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        zIndex: 10000,
        overflow: 'hidden',
        border: '1px solid var(--wine-200)'
      }}>
        {/* Cabecera */}
        <div style={{
          background: 'linear-gradient(135deg, var(--wine-700), var(--wine-900))',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wine-900)' }}>
               <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Asistente Paideia</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Soporte Automático</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem' }}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mensajes */}
        <div style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'var(--bg-page, #fafafa)'
        }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{
              alignSelf: m.type === 'bot' ? 'flex-start' : 'flex-end',
              background: m.type === 'bot' ? 'white' : 'var(--wine-600)',
              color: m.type === 'bot' ? 'var(--text-primary)' : 'white',
              padding: '0.75rem 1rem',
              borderRadius: m.type === 'bot' ? '1rem 1rem 1rem 0' : '1rem 1rem 0 1rem',
              maxWidth: '85%',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              fontSize: '0.9rem',
              lineHeight: 1.4,
              border: m.type === 'bot' ? '1px solid var(--wine-100)' : 'none'
            }}>
              {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Opciones interactivas si el último mensaje fue del bot (y al inicio) */}
        <div style={{ background: 'white', padding: '1rem', borderTop: '1px solid var(--wine-100)' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Selecciona una opción:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {FAQ_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleOptionClick(opt)}
                style={{
                  background: 'var(--wine-50)',
                  border: '1px solid var(--wine-200)',
                  padding: '0.6rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: 'var(--wine-800)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--wine-100)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--wine-50)'}
              >
                {opt.title}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button onClick={resetChat} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Reiniciar chat
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
