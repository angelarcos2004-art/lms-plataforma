import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import CourseCard from '../components/courses/CourseCard'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../hooks/useRole'
import { getMisCursos, getCursosByDocente, getTodosCursos, getTodasCalificacionesEstudiante } from '../lib/coursesService'
import { getAdminStats } from '../lib/socialService'
import { getProgresoCursoEstudiante, getMisEntregas } from '../lib/contentService'
import { getEventosCalendario } from '../lib/calendarioService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const getBase64ImageFromUrl = (imageUrl) => new Promise((resolve, reject) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || 400
    canvas.height = img.naturalHeight || 300
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    resolve(canvas.toDataURL('image/png'))
  }
  img.onerror = () => reject(new Error('No se pudo cargar imagen'))
  img.src = imageUrl
})

function MotivationalQuote() {
  const [quote, setQuote] = useState({ text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' })
  const [loading, setLoading] = useState(false)

  const fetchQuote = async () => {
    setLoading(true)
    try {
      // 1. Obtener cita en inglés
      const res = await fetch(`https://dummyjson.com/quotes/random?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('API 1 Fail')
      const data = await res.json()
      
      if (data && data.quote) {
        // 2. Traducir al español usando MyMemory Translation API
        const textToTranslate = encodeURIComponent(data.quote)
        const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${textToTranslate}&langpair=en|es`)
        
        let finalQuote = data.quote // Fallback a inglés por defecto
        if (transRes.ok) {
          const transData = await transRes.json()
          if (transData?.responseData?.translatedText) {
            finalQuote = transData.responseData.translatedText
          }
        }

        setQuote({ text: finalQuote, author: data.author })
        setLoading(false)
        return
      }
    } catch (e) {
      console.error('Error fetching quote APIs:', e)
      // Fallback local robusto (garantía de español si no hay internet)
      const locales = [
        { text: 'La educación es el arma más ponderosa para cambiar el mundo.', author: 'Nelson Mandela' },
        { text: 'Cree en ti mismo y en todo lo que eres.', author: 'Christian D. Larson' },
        { text: 'Aprender es descubrir que algo es posible.', author: 'Fritz Perls' },
        { text: 'El único modo de hacer un gran trabajo es amar lo que haces.', author: 'Steve Jobs' }
      ]
      setQuote(locales[Math.floor(Math.random() * locales.length)])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQuote()
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--wine-800), var(--wine-900))',
      color: 'white', padding: '1.5rem', borderRadius: '1rem',
      marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontStyle: 'italic', lineHeight: 1.5, opacity: 0.95 }}>
            "{quote.text}"
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold, #FBBF24)' }}>
            — {quote.author}
          </p>
        </div>
        <button
          onClick={fetchQuote}
          disabled={loading}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', padding: '0.5rem', borderRadius: '0.5rem',
            cursor: loading ? 'wait' : 'pointer', transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Nueva cita"
        >
          <svg style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function diasRestantes(fechaStr) {
  if (!fechaStr) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaStr); fecha.setHours(0, 0, 0, 0)
  const diff = Math.round((fecha - hoy) / 86400000)
  if (diff === 0) return { label: 'Hoy', color: 'var(--error)' }
  if (diff === 1) return { label: 'Mañana', color: 'var(--warning)' }
  if (diff <= 7) return { label: `En ${diff} días`, color: 'var(--warning)' }
  return { label: fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }), color: 'var(--text-secondary)' }
}

function ActividadesPendientesWidget({ tareas, entregasIds }) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const pendientes = tareas
    .filter(t => !entregasIds.includes(t.id))
    .filter(t => !t.fecha_limite || new Date(t.fecha_limite) >= hoy)
    .sort((a, b) => {
      if (!a.fecha_limite) return 1
      if (!b.fecha_limite) return -1
      return new Date(a.fecha_limite) - new Date(b.fecha_limite)
    })
    .slice(0, 5)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.1rem' }}>📝</span>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--wine-800)' }}>Actividades pendientes</h3>
        {pendientes.length > 0 && (
          <span style={{ marginLeft: 'auto', background: 'var(--wine-600)', color: 'white', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
            {pendientes.length}
          </span>
        )}
      </div>

      {pendientes.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
          ¡Sin pendientes! Estás al día.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {pendientes.map(t => {
            const info = diasRestantes(t.fecha_limite)
            return (
              <Link
                key={t.id}
                to={`/courses/${t.unidades?.curso_id}/tareas/${t.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--bg-page)', textDecoration: 'none', border: '1px solid var(--wine-100)' }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titulo}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.unidades?.cursos?.titulo ?? ''}</p>
                </div>
                {info && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: info.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{info.label}</span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProximasFechasWidget({ tareas, quizzes }) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const eventos = [
    ...tareas.map(t => ({ ...t, tipo: 'tarea' })),
    ...quizzes.map(q => ({ ...q, tipo: 'quiz' })),
  ]
    .filter(e => e.fecha_limite && new Date(e.fecha_limite) >= hoy)
    .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))
    .slice(0, 4)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.1rem' }}>📅</span>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--wine-800)' }}>Próximas fechas</h3>
        <Link to="/calendario" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--wine-600)', textDecoration: 'none', fontWeight: 600 }}>Ver calendario →</Link>
      </div>

      {eventos.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
          No hay fechas próximas registradas.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {eventos.map(e => {
            const info = diasRestantes(e.fecha_limite)
            const destino = e.tipo === 'tarea'
              ? `/courses/${e.unidades?.curso_id}/tareas/${e.id}`
              : `/courses/${e.unidades?.curso_id}/cuestionarios/${e.id}`
            return (
              <Link
                key={`${e.tipo}-${e.id}`}
                to={destino}
                style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--bg-page)', textDecoration: 'none', border: '1px solid var(--wine-100)' }}
              >
                <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{e.tipo === 'tarea' ? '📋' : '📝'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titulo}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.unidades?.cursos?.titulo ?? ''}</p>
                </div>
                {info && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: info.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{info.label}</span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { isAdmin, isDocente, isEstudiante } = useRole()

  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminStats, setAdminStats] = useState(null)

  // Filtros Admin Catálogo Unificado
  const [searchAdmin, setSearchAdmin] = useState('')

  // Calificaciones (solo estudiante)
  const [calificaciones, setCalificaciones] = useState([])
  const [generandoPDF, setGenerandoPDF] = useState(false)

  // Widgets de pendientes y fechas (solo estudiante)
  const [eventosDash, setEventosDash] = useState({ tareas: [], quizzes: [] })
  const [entregasIds, setEntregasIds] = useState([])

  const displayName =
    profile?.nombre_completo ??
    user?.user_metadata?.nombre ??
    user?.user_metadata?.full_name ??
    user?.email ??
    'Usuario'

  useEffect(() => {
    if (!user) return

    async function cargar() {
      let res
      if (isEstudiante) {
        res = await getMisCursos(user.id)
        if (!res.error) {
          const misCursos = (res.data ?? []).map(i => i.cursos).filter(Boolean)
          const conProgreso = await Promise.all(misCursos.map(async c => {
            const { avance } = await getProgresoCursoEstudiante(c.id, user.id)
            return { ...c, avance }
          }))
          setCursos(conProgreso)
        }
        const { data: cals } = await getTodasCalificacionesEstudiante(user.id)
        setCalificaciones(cals ?? [])

        // Widgets: tareas pendientes y próximas fechas
        const { tareas: tv = [], quizzes: qv = [] } = await getEventosCalendario(user.id, 'estudiante')
        setEventosDash({ tareas: tv, quizzes: qv })
        if (tv.length) {
          const { data: ent } = await getMisEntregas(user.id, tv.map(t => t.id))
          setEntregasIds((ent ?? []).map(e => e.tarea_id))
        }
      } else if (isDocente) {
        res = await getCursosByDocente(user.id)
        if (!res.error) setCursos(res.data ?? [])
      } else if (isAdmin) {
        res = await getTodosCursos()
        if (!res.error) setCursos(res.data ?? [])
        const stats = await getAdminStats()
        setAdminStats(stats)
      }
      setLoading(false)
    }
    cargar()
  }, [user, isEstudiante, isDocente, isAdmin])

  const displayedCursos = isAdmin 
    ? cursos.filter(c => {
        const matchSearch = c.titulo?.toLowerCase().includes(searchAdmin.toLowerCase()) || 
                            (c.docente?.nombre_completo || '').toLowerCase().includes(searchAdmin.toLowerCase())
        return matchSearch
      })
    : cursos

  const cursosConCal = calificaciones.filter(c => c.calificacion_final !== null && c.tareas_calificadas > 0)
  const calAprobadas = cursosConCal.filter(c => c.calificacion_final >= 60).length
  const calReprobadas = cursosConCal.length - calAprobadas

  const generarPDFEstudiante = async () => {
    if (!cursosConCal.length) return
    setGenerandoPDF(true)
    try {
      const qcData = {
        type: 'doughnut',
        data: {
          labels: [`Aprobadas (${calAprobadas})`, `Reprobadas (${calReprobadas})`],
          datasets: [{ backgroundColor: ['#16a34a', '#dc2626'], data: [calAprobadas, calReprobadas] }]
        },
        options: {
          title: { display: true, text: 'Mi Rendimiento Academico', fontSize: 14 },
          legend: { position: 'bottom' }
        }
      }
      const qcUrl = `https://quickchart.io/chart?w=400&h=300&c=${encodeURIComponent(JSON.stringify(qcData))}`
      let chartBase64 = null
      try { chartBase64 = await getBase64ImageFromUrl(qcUrl) } catch {}

      const doc = new jsPDF()

      doc.setFillColor(159, 18, 57)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setFontSize(15)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text('REPORTE DE CALIFICACIONES', 105, 13, { align: 'center' })
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`${displayName}   |   Fecha: ${new Date().toLocaleDateString('es-MX')}`, 105, 23, { align: 'center' })

      autoTable(doc, {
        startY: 36,
        headStyles: { fillColor: [159, 18, 57], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [254, 248, 248] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 2: { halign: 'center', fontStyle: 'bold' }, 3: { halign: 'center', fontStyle: 'bold' } },
        head: [['Materia', 'Tareas calificadas', 'Calificación Final', 'Estatus']],
        body: cursosConCal.map(c => [
          c.curso?.titulo ?? 'Sin nombre',
          `${c.tareas_calificadas}`,
          `${c.calificacion_final ?? 0} / 100`,
          c.calificacion_final >= 60 ? 'APROBADO' : 'REPROBADO'
        ])
      })

      if (chartBase64) {
        const tableEnd = doc.lastAutoTable?.finalY ?? 36
        const posY = tableEnd + 12 + 65 > 280 ? (() => { doc.addPage(); return 20 })() : tableEnd + 12
        doc.addImage(chartBase64, 'PNG', 55, posY, 100, 65)
      }

      const total = doc.getNumberOfPages()
      for (let p = 1; p <= total; p++) {
        doc.setPage(p)
        doc.setFontSize(8)
        doc.setTextColor(160)
        doc.setFont('helvetica', 'normal')
        doc.text('Generado automaticamente por Paideia LMS', 105, 290, { align: 'center' })
      }

      doc.save(`calificaciones_${displayName.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
    } finally {
      setGenerandoPDF(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Saludo */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.75rem', fontWeight: 800 }}>
            ¡Hola, {displayName.split(' ')[0]}!
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {isEstudiante && 'Aquí están tus cursos inscritos.'}
            {isDocente && 'Gestiona tus cursos desde aquí.'}
            {isAdmin && 'Vista general de todos los cursos en la plataforma.'}
          </p>
        </div>

        {/* Motivational Quote para Estudiantes */}
        {isEstudiante && <MotivationalQuote />}

        {/* Widgets: actividades pendientes + próximas fechas (solo estudiante) */}
        {isEstudiante && !loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            <ActividadesPendientesWidget tareas={eventosDash.tareas} entregasIds={entregasIds} />
            <ProximasFechasWidget tareas={eventosDash.tareas} quizzes={eventosDash.quizzes} />
          </div>
        )}

        {/* Stats admin */}
        {isAdmin && adminStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Usuarios', value: adminStats.totalUsuarios, color: 'var(--wine-600)' },
              { label: 'Cursos', value: adminStats.totalCursos, color: 'var(--info)' },
              { label: 'Inscripciones activas', value: adminStats.totalInscripciones, color: 'var(--success)' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.25rem' }}>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}


        {/* Sección de cursos */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--wine-800)', fontSize: '1.2rem', fontWeight: 700 }}>
            {isEstudiante && 'Mis Cursos Inscritos'}
            {isDocente && 'Mis Cursos'}
            {isAdmin && 'Todos los Cursos (Catálogo)'}
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isAdmin && (
              <input
                type="text"
                placeholder="Buscar curso o maestro..."
                value={searchAdmin}
                onChange={e => setSearchAdmin(e.target.value)}
                style={{
                  padding: '0.6rem 1rem', borderRadius: '0.5rem',
                  border: '1px solid var(--wine-200)', outline: 'none',
                  fontSize: '0.875rem', minWidth: '250px'
                }}
              />
            )}
            {isEstudiante && (
              <Link
                to="/courses"
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                  background: 'var(--wine-600)', color: 'white',
                  textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--wine-800)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--wine-600)')}
              >
                Explorar catálogo
              </Link>
            )}
            {(isDocente || isAdmin) && (
              <Link
                to="/courses/new"
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                  background: 'var(--wine-600)', color: 'white',
                  textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--wine-800)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--wine-600)')}
              >
                + Crear curso
              </Link>
            )}
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Cargando cursos...
          </div>
        )}

        {/* Estado vacío */}
        {!loading && displayedCursos.length === 0 && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
            borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--wine-400), var(--wine-600))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h2 style={{ color: 'var(--wine-800)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              {isEstudiante ? 'Aún no estás inscrito en ningún curso' : 'Aún no has creado ningún curso'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
              {isEstudiante ? 'Explora el catálogo y encuentra un curso que te interese.' : 'Crea tu primer curso para que los estudiantes puedan inscribirse.'}
            </p>
            {isEstudiante ? (
              <Link
                to="/courses"
                style={{
                  display: 'inline-block', padding: '0.625rem 1.5rem',
                  background: 'var(--wine-600)', color: 'white',
                  textDecoration: 'none', borderRadius: '0.5rem',
                  fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Ir al catálogo
              </Link>
            ) : (
              <Link
                to="/courses/new"
                style={{
                  display: 'inline-block', padding: '0.625rem 1.5rem',
                  background: 'var(--wine-600)', color: 'white',
                  textDecoration: 'none', borderRadius: '0.5rem',
                  fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Crear primer curso
              </Link>
            )}
          </div>
        )}

        {/* Grid de cursos */}
        {!loading && cursos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {displayedCursos.map(curso => (
              <CourseCard
                key={curso.id}
                curso={curso}
                badge={isEstudiante ? 'Inscrito' : null}
              />
            ))}
          </div>
        )}

        {/* ── Sección Calificaciones (solo estudiante) ── */}
        {isEstudiante && !loading && (
          <div style={{ marginTop: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, color: 'var(--wine-800)', fontSize: '1.2rem', fontWeight: 700 }}>
                Mis Calificaciones
              </h2>
              {cursosConCal.length > 0 && (
                <button
                  onClick={generarPDFEstudiante}
                  disabled={generandoPDF}
                  style={{ padding: '0.55rem 1.2rem', background: generandoPDF ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: generandoPDF ? 'wait' : 'pointer' }}
                >
                  {generandoPDF ? '⚙️ Generando...' : '📄 Descargar PDF con gráfica'}
                </button>
              )}
            </div>

            {calificaciones.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ margin: '0 0 0.4rem', fontSize: '1.5rem' }}>📋</p>
                <p style={{ margin: 0 }}>Aún no tienes materias inscritas con tareas calificadas.</p>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', overflow: 'hidden' }}>
                {/* Resumen estadístico */}
                {cursosConCal.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderBottom: '1px solid var(--wine-100)' }}>
                    {[
                      { label: 'Materias con tareas', value: cursosConCal.length, color: 'var(--wine-700)' },
                      { label: 'Aprobadas', value: calAprobadas, color: 'var(--success)' },
                      { label: 'Reprobadas', value: calReprobadas, color: 'var(--error)' },
                    ].map((s, i) => (
                      <div key={s.label} style={{ padding: '1.25rem', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--wine-100)' : 'none' }}>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabla de materias */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--wine-800)', color: 'white' }}>
                        <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 700 }}>Materia</th>
                        <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 700 }}>Tareas calificadas</th>
                        <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 700 }}>Promedio</th>
                        <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 700 }}>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calificaciones.map((c, i) => {
                        const tieneCal = c.calificacion_final !== null && c.tareas_calificadas > 0
                        return (
                          <tr key={c.inscripcion_id} style={{ borderBottom: '1px solid var(--wine-100)', background: i % 2 === 0 ? 'white' : 'var(--bg-page)' }}>
                            <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--wine-900)' }}>
                              <Link to={`/courses/${c.curso?.id}`} style={{ color: 'var(--wine-700)', textDecoration: 'none' }}>
                                {c.curso?.titulo ?? 'Sin nombre'}
                              </Link>
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {tieneCal ? c.tareas_calificadas : '—'}
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                              {tieneCal ? (
                                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', fontWeight: 800, background: c.calificacion_final >= 60 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: c.calificacion_final >= 60 ? 'var(--success)' : 'var(--error)' }}>
                                  {c.calificacion_final} / 100
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sin tareas calificadas</span>
                              )}
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                              {tieneCal ? (
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: c.calificacion_final >= 60 ? 'var(--success)' : 'var(--error)' }}>
                                  {c.calificacion_final >= 60 ? '✓ APROBADO' : '✗ REPROBADO'}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>En curso</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
