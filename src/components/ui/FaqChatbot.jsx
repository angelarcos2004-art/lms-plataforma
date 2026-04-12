import { useState, useRef, useEffect } from 'react'
import { useRole } from '../../hooks/useRole'

const PREGUNTAS_ESTUDIANTE = [
  { id: 'calificaciones', title: '📊 ¿Dónde veo mis calificaciones?' },
  { id: 'tareas', title: '📝 ¿Cómo subo mis trabajos?' },
  { id: 'examenes', title: '⏱️ Dudas sobre Exámenes/Quizzes' },
  { id: 'password', title: '🔑 Recuperar mi Contraseña' },
  { id: 'no_veo_curso', title: '🚫 No veo mis materias asignadas' },
  { id: 'foros', title: '💬 Reglas de los Foros' },
  { id: 'faltas', title: '📅 Faltas e Inasistencias' },
  { id: 'soporte_tecnico', title: '🛠️ Reportar falla técnica' },
  { id: 'certificado', title: '📜 ¿Cómo obtengo mi certificado?' },
  { id: 'notificaciones', title: '🔔 ¿Cómo funcionan los avisos?' },
  { id: 'correo', title: '📧 Cambiar correo o datos' },
  { id: 'bajas', title: '🚪 Proceso para darse de baja' },
  { id: 'horario', title: '⌚ Horarios de la plataforma' },
  { id: 'maestro', title: '👨‍🏫 El profesor no me responde' },
  { id: 'contacto_admin', title: '📞 Correo de Administrador/Soporte' },
  { id: 'disabled', title: '🔒 ¿Qué significa Cuenta Desactivada?' }
]

const RESPUESTAS_ESTUDIANTE = {
  calificaciones: 'Entra al detalle de la materia y dirígete al apartado "Calificaciones". Ahí verás el puntaje de cada entrega.',
  tareas: 'En tu curso, vas a "Contenido", buscas la unidad correspondiente y verás la caja para subir archivo PDF/Word.',
  examenes: 'Recuerda que una vez presionado "Comenzar" corre el temporizador en tiempo real y no se puede pausar.',
  password: 'En la ventana inicial de Login usa la opción "¿Olvidaste tu contraseña?". Te llegará confirmación si pones tu correo.',
  no_veo_curso: 'Solo los Administradores matriculan alumnos. Escribe a administración si perdiste el acceso repentinamente.',
  foros: 'Todos pueden comentar dudas. Mantén siempre el respeto académico; los moderadores vigilan activamente el foro.',
  faltas: 'El sistema no toma asistencia automática; pacta justificaciones de faltas directamente por mensaje con tu profesor.',
  soporte_tecnico: 'Fallas del sitio repórtalas al correo: ayavpn.2025@gmail.com con capturas de pantalla.',
  certificado: 'Te llegará al acabar todo tu temario con promedio aprobatorio al final de semestre escolar.',
  notificaciones: 'La campana arriba a la derecha te avisará de nuevas tareas o correcciones marcadas en tus foros.',
  correo: 'Escribe a control escolar técnico indicando cambio formal de ID o correo institucional.',
  bajas: 'El abandono escolar de la plataforma se reporta con Administración, dando clic en "Baja definitiva".',
  horario: 'Sincronizado a zona horaria CDMX. Ten cuidado con la hora de cierre (23:59) al subir proyectos.',
  maestro: 'Si tu profesor no ha corregido en 5 días hábiles, habla con un administrador o jefe de grupo.',
  contacto_admin: 'El Administrador general asiste todas las excepciones técnicas o académicas severas a través de: ayavpn.2025@gmail.com',
  disabled: 'Implica una suspensión de cuenta o veto del plantel. No podrás pasar del Login a tu cuenta.'
}

const PREGUNTAS_DOCENTE = [
  { id: 'crear_curso', title: '➕ ¿Cómo abro un curso nuevo?' },
  { id: 'calificar', title: '💯 ¿Dónde califico entregas?' },
  { id: 'mis_alumnos', title: '👥 Ver a mis inscritos' },
  { id: 'foros_nuevo', title: '📝 Iniciar debate en Foros' },
  { id: 'modulos', title: '📂 Crear Unidades (Contenidos)' },
  { id: 'quitar_alumno', title: '🚫 Dar de baja a un alumno' },
  { id: 'examenes_hacer', title: '⏱️ Diseñar Evaluaciones/Quizzes' },
  { id: 'fechas_limite', title: '⏳ Colocar fecha límite en Tarea' },
  { id: 'archivos_pesados', title: '💾 Límite de megas (Archivos)' },
  { id: 'ver_progreso', title: '📈 Analíticas del grupo' },
  { id: 'foro_moderacion', title: '🔨 Moderar a los alumnos' },
  { id: 'editar_curso', title: '⚙️ Cambiar Banner e Imagen' },
  { id: 'duplicar_curso', title: '♊ Reutilizar / Duplicar cursos' },
  { id: 'password', title: '🔑 Cambiar mi contraseña' },
  { id: 'soporte_tecnico', title: '🛠️ Falla del portal (Bug)' },
  { id: 'contacto_admin', title: '📞 Correo de Administrador/Soporte' },
  { id: 'disabled', title: '🔒 Cuenta Desactivada' }
]

const RESPUESTAS_DOCENTE = {
  crear_curso: 'En tu Inicio (Dashboard) dirígete a la derecha y encontrarás el botón "+ Crear Curso".',
  calificar: 'Accede a tu materia. En las pestañas de control aparecerá la lista de archivos por revisar.',
  mis_alumnos: 'El panel interno del curso te listará a tus alumnos oficialmente inscritos en tu materia.',
  foros_nuevo: 'Sí, tú y los administradores son los únicos que pueden iniciar debates nuevos. Los alumnos solo comentan.',
  modulos: 'Puedes agregar PDF y videos estructurados como Módulos con el botón "Añadir Unidad" dentro de tu curso.',
  quitar_alumno: 'Para proteger el registro y las calificaciones previas, solo el Administrador puede dar de baja alumnos.',
  examenes_hacer: 'Podrás redactar preguntas de Opción Múltiple o Verdadero/Falso para cada unidad desde el panel del curso.',
  fechas_limite: 'Al redactar una tarea, elige su fecha de entrega. Si un alumno sube tarde, se indicará en color rojo.',
  archivos_pesados: 'El límite general para subir PDFs o Presentaciones es de 50MB. En videos es mejor pegar el enlace de Vimeo o YouTube.',
  ver_progreso: 'Tendrás cuadros de estadísticas básicas para que conozcas en qué porcentaje tus alumnos ven tu material.',
  foro_moderacion: 'En caso de que un alumno falte al respecto en el chat, repórtalo con capturas a la dirección escolar.',
  editar_curso: 'Desde tu rol de profesor, al ver tu materia presiona el botón "Configuración" para cambiar texto e imagen.',
  duplicar_curso: 'Aún no existe el botón de clonar 1:1. Debes crear el cascarón de ciclo escolar nuevo a mano.',
  password: 'Si olvidas tu clave institucional, usa "Olvidé mi contraseña" en la página principal para restaurarla.',
  soporte_tecnico: 'Cualquier error de navegación grave: reporta con evidencias a ayavpn.2025@gmail.com',
  contacto_admin: 'Directorio principal de atención a docentes y directivos administrativos: ayavpn.2025@gmail.com',
  disabled: 'Si ves el panel de Cuenta Desactivada, tu usuario fue suspendido por la administración. Comunícate directamente al correo de control para validar el caso.'
}

export default function FaqChatbot() {
  const { isAdmin, isDocente } = useRole()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: '¡Hola! Soy el asistente virtual de Paideia. ¿En qué te puedo ayudar hoy?' }
  ])
  const messagesEndRef = useRef(null)

  // Todos los hooks DEBEN estar antes de cualquier return condicional (Reglas de Hooks de React)
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Si es administrador, no mostramos el bot (DESPUÉS de todos los hooks)
  if (isAdmin) return null

  const opcionesDinamicas = isDocente ? PREGUNTAS_DOCENTE : PREGUNTAS_ESTUDIANTE
  const respuestasDinamicas = isDocente ? RESPUESTAS_DOCENTE : RESPUESTAS_ESTUDIANTE

  const handleOptionClick = (option) => {
    // Agregar el mensaje del usuario
    setMessages(prev => [...prev, { type: 'user', text: option.title }])

    // Simular un pequeño retraso para la respuesta del bot
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: respuestasDinamicas[option.id] }])
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
          background: 'var(--gold)',
          color: 'var(--wine-900)',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, background 0.2s',
          zIndex: 10001,
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
          opacity: 1,
          pointerEvents: 'auto'
        }}
        title={isOpen ? "Cerrar Asistente" : "Abrir Asistente"}
      >
        {isOpen ? (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '28px', height: '28px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '30px', height: '30px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Ventana de Chat */}
      <div style={{
        position: 'fixed',
        bottom: isOpen ? '6rem' : '-100%',
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
          background: 'linear-gradient(135deg, var(--wine-800), var(--wine-900))',
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
              background: m.type === 'bot' ? 'var(--bg-card)' : 'var(--wine-600)',
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
        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderTop: '1px solid var(--wine-200)' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Selecciona una opción:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {opcionesDinamicas.map(opt => (
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
                  transition: 'background 0.2s',
                  flexShrink: 0
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
