import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../hooks/useRole'
import { getFestivosNacionales, getEventosCalendario } from '../lib/calendarioService'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

function getDiasDelMes(año, mes) {
  // mes: 0-11
  const primerDia = new Date(año, mes, 1)
  const totalDias = new Date(año, mes + 1, 0).getDate()
  // getDay(): 0=Dom,1=Lun... convertir a Lun=0
  const inicioOffset = (primerDia.getDay() + 6) % 7
  return { totalDias, inicioOffset }
}

function fechaStr(date) {
  // Devuelve 'YYYY-MM-DD' en hora local
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function CalendarioPage() {
  const { user } = useAuth()
  const { isEstudiante, isDocente, isAdmin } = useRole()

  const hoy = new Date()
  const [año, setAño] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())

  const [festivos, setFestivos] = useState([])
  const [eventos, setEventos] = useState({ tareas: [], quizzes: [], cursos: [] })
  const [loading, setLoading] = useState(true)

  const rol = isEstudiante ? 'estudiante' : 'docente'

  useEffect(() => {
    if (!user) return
    async function cargar() {
      setLoading(true)
      try {
        const [fest, evs] = await Promise.all([
          getFestivosNacionales(año),
          getEventosCalendario(user.id, rol),
        ])
        setFestivos(fest)
        setEventos(evs)
      } catch {}
      setLoading(false)
    }
    cargar()
  }, [user, año, rol])

  // Refetch festivos si cambia el año
  useEffect(() => {
    getFestivosNacionales(año).then(setFestivos).catch(() => {})
  }, [año])

  // Mapear eventos por fecha 'YYYY-MM-DD'
  const eventosPorDia = useMemo(() => {
    const map = {}
    const add = (key, ev) => { if (!map[key]) map[key] = []; map[key].push(ev) }

    festivos.forEach(f => add(f.date, { tipo: 'festivo', label: f.localName }))

    eventos.tareas.forEach(t => {
      if (!t.fecha_limite) return
      const key = t.fecha_limite.slice(0, 10)
      const curso = t.unidades?.cursos?.titulo ?? ''
      add(key, { tipo: 'tarea', label: t.titulo, sub: curso })
    })

    eventos.quizzes.forEach(q => {
      if (!q.fecha_limite) return
      const key = q.fecha_limite.slice(0, 10)
      const curso = q.unidades?.cursos?.titulo ?? ''
      add(key, { tipo: 'quiz', label: q.titulo, sub: curso })
    })

    eventos.cursos.forEach(c => {
      if (c.fecha_inicio) add(c.fecha_inicio, { tipo: 'curso-inicio', label: `Inicio: ${c.titulo}` })
      if (c.fecha_fin)    add(c.fecha_fin,    { tipo: 'curso-fin',   label: `Fin: ${c.titulo}` })
    })

    return map
  }, [festivos, eventos])

  const { totalDias, inicioOffset } = getDiasDelMes(año, mes)
  const totalCeldas = Math.ceil((inicioOffset + totalDias) / 7) * 7

  function navMes(delta) {
    let nuevoMes = mes + delta
    let nuevoAño = año
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAño++ }
    if (nuevoMes < 0)  { nuevoMes = 11; nuevoAño-- }
    setMes(nuevoMes)
    setAño(nuevoAño)
  }

  const coloresEvento = {
    festivo:       { bg: 'rgba(220,38,38,0.15)', color: '#DC2626', border: '#DC2626' },
    tarea:         { bg: 'rgba(159,18,57,0.12)',  color: 'var(--wine-600)', border: 'var(--wine-400)' },
    quiz:          { bg: 'rgba(37,99,235,0.12)',  color: '#2563EB', border: '#2563EB' },
    'curso-inicio':{ bg: 'rgba(201,168,76,0.2)',  color: '#92601A', border: 'var(--gold)' },
    'curso-fin':   { bg: 'rgba(107,114,128,0.15)',color: '#4B5563', border: '#9CA3AF' },
  }

  const hoyStr = fechaStr(hoy)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.6rem', fontWeight: 800 }}>
            Calendario Académico
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Festivos nacionales de México · Fechas límite de tareas y cuestionarios · Inicio y fin de cursos
          </p>
        </div>

        {/* Navegación de mes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navMes(-1)} style={btnNav}>‹</button>
            <h2 style={{ margin: 0, color: 'var(--wine-800)', fontSize: '1.3rem', fontWeight: 700, minWidth: '200px', textAlign: 'center' }}>
              {MESES[mes]} {año}
            </h2>
            <button onClick={() => navMes(1)} style={btnNav}>›</button>
          </div>
          <button
            onClick={() => { setMes(hoy.getMonth()); setAño(hoy.getFullYear()) }}
            style={{ padding: '0.4rem 1rem', background: 'var(--wine-600)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Hoy
          </button>
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { tipo: 'festivo', label: 'Festivo Nacional' },
            { tipo: 'tarea', label: 'Fecha límite — Tarea' },
            { tipo: 'quiz', label: 'Fecha límite — Cuestionario' },
            { tipo: 'curso-inicio', label: 'Inicio de Curso' },
            { tipo: 'curso-fin', label: 'Fin de Curso' },
          ].map(({ tipo, label }) => {
            const c = coloresEvento[tipo]
            return (
              <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: c.bg, border: `1px solid ${c.border}`, display: 'inline-block' }} />
                {label}
              </div>
            )
          })}
          {loading && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Cargando datos...</span>}
        </div>

        {/* Cuadrícula del calendario */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Encabezado días de semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: 'var(--wine-800)' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ padding: '0.6rem', textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {Array.from({ length: totalCeldas }).map((_, idx) => {
              const dia = idx - inicioOffset + 1
              const esDelMes = dia >= 1 && dia <= totalDias
              const dateStr = esDelMes ? `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}` : null
              const esHoy = dateStr === hoyStr
              const evsDia = dateStr ? (eventosPorDia[dateStr] ?? []) : []
              const esFinde = [5, 6].includes(idx % 7) // sáb=5, dom=6

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: '90px',
                    padding: '0.5rem',
                    borderRight: idx % 7 !== 6 ? '1px solid var(--wine-100)' : 'none',
                    borderBottom: idx < totalCeldas - 7 ? '1px solid var(--wine-100)' : 'none',
                    background: !esDelMes ? 'var(--bg-section)' : esFinde ? 'rgba(159,18,57,0.03)' : 'var(--bg-card)',
                    transition: 'background 0.15s',
                  }}
                >
                  {esDelMes && (
                    <>
                      {/* Número del día */}
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: esHoy ? 'var(--wine-800)' : 'transparent',
                        color: esHoy ? 'white' : esFinde ? 'var(--wine-600)' : 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.82rem', fontWeight: esHoy ? 700 : 500,
                        marginBottom: '0.3rem',
                      }}>
                        {dia}
                      </div>

                      {/* Eventos del día */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {evsDia.slice(0, 3).map((ev, i) => {
                          const c = coloresEvento[ev.tipo] ?? coloresEvento.tarea
                          return (
                            <div
                              key={i}
                              title={`${ev.label}${ev.sub ? ` — ${ev.sub}` : ''}`}
                              style={{
                                background: c.bg,
                                color: c.color,
                                border: `1px solid ${c.border}`,
                                borderRadius: '3px',
                                padding: '1px 4px',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {ev.label}
                            </div>
                          )
                        })}
                        {evsDia.length > 3 && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', paddingLeft: '2px' }}>
                            +{evsDia.length - 3} más
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Lista de eventos del mes visible */}
        <div style={{ marginTop: '1.75rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: 'var(--wine-800)', fontSize: '1rem', fontWeight: 700 }}>
            Eventos de {MESES[mes]}
          </h3>
          {(() => {
            const mesStr = `${año}-${String(mes+1).padStart(2,'0')}`
            const enMes = Object.entries(eventosPorDia)
              .filter(([k]) => k.startsWith(mesStr))
              .sort(([a],[b]) => a.localeCompare(b))
            if (!enMes.length) return (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sin eventos registrados este mes.</p>
            )
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {enMes.map(([fecha, evs]) => {
                  const d = new Date(fecha + 'T12:00:00')
                  return evs.map((ev, i) => {
                    const c = coloresEvento[ev.tipo] ?? coloresEvento.tarea
                    return (
                      <div key={`${fecha}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '0.5rem' }}>
                        <div style={{ textAlign: 'center', minWidth: '48px' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--wine-800)', lineHeight: 1 }}>{d.getDate()}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{DIAS_SEMANA[(d.getDay()+6)%7]}</div>
                        </div>
                        <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: c.border, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.label}</div>
                          {ev.sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ev.sub}</div>}
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, flexShrink: 0 }}>
                          {ev.tipo === 'festivo' ? 'Festivo' : ev.tipo === 'tarea' ? 'Tarea' : ev.tipo === 'quiz' ? 'Quiz' : 'Curso'}
                        </span>
                      </div>
                    )
                  })
                })}
              </div>
            )
          })()}
        </div>
      </main>
    </div>
  )
}

const btnNav = {
  background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
  color: 'var(--wine-800)', width: '36px', height: '36px', borderRadius: '8px',
  cursor: 'pointer', fontSize: '1.25rem', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
}
