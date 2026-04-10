import { useState, useEffect, useRef } from 'react'
import {
  getEstudiantesCurso,
  removerEstudianteCurso,
  agregarEstudianteCurso,
  buscarEstudiantesParaInscribir,
} from '../../lib/coursesService'
import ConfirmModal from '../ui/ConfirmModal'

export default function CourseEnrollmentManager({ cursoId, embedded = false }) {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)

  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [addMsg, setAddMsg] = useState(null)

  const [confirmModal, setConfirmModal] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    cargarEstudiantes()
  }, [cursoId])

  async function cargarEstudiantes() {
    setLoading(true)
    const { data } = await getEstudiantesCurso(cursoId)
    setEstudiantes(data)
    setLoading(false)
  }

  // Búsqueda con debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (busqueda.trim().length < 2) { setResultados([]); return }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      const { data } = await buscarEstudiantesParaInscribir(cursoId, busqueda)
      setResultados(data ?? [])
      setBuscando(false)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [busqueda, cursoId])

  function solicitarRemover(inscripcionId, nombre) {
    setConfirmModal({
      title: `¿Dar de baja a ${nombre}?`,
      description: 'El alumno perderá acceso al contenido y calificaciones del curso. Puedes volver a agregarlo después.',
      confirmLabel: 'Dar de baja',
      onConfirm: async () => {
        setConfirmModal(null)
        const { error } = await removerEstudianteCurso(inscripcionId)
        if (!error) setEstudiantes(prev => prev.filter(e => e.id !== inscripcionId))
      }
    })
  }

  async function handleAgregar(usuario) {
    setAddMsg(null)
    const { error } = await agregarEstudianteCurso(cursoId, usuario.id)
    if (error) {
      setAddMsg({ tipo: 'error', texto: error.message ?? 'No se pudo agregar al alumno.' })
    } else {
      setAddMsg({ tipo: 'ok', texto: `${usuario.nombre_completo} fue agregado al curso.` })
      setBusqueda('')
      setResultados([])
      cargarEstudiantes()
    }
  }

  return (
    <div style={embedded ? {} : { background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.75rem' }}>
      {!embedded && <>
        <h2 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.2rem', fontWeight: 800 }}>
          Gestión de Alumnos
        </h2>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Agrega o da de baja alumnos de este curso.
        </p>
      </>}

      {/* ── Buscar y agregar alumno ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--wine-800)', marginBottom: '0.5rem' }}>
          Agregar alumno
        </label>
        <div style={{ position: 'relative' }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo electrónico..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.625rem 1rem', borderRadius: '0.5rem',
              border: '1px solid var(--wine-100)', background: 'var(--bg-page)',
              color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
            onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
          />
          {buscando && (
            <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Buscando...
            </span>
          )}
        </div>

        {resultados.length > 0 && (
          <div style={{ marginTop: '0.5rem', border: '1px solid var(--wine-100)', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--bg-card)' }}>
            {resultados.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 1rem', borderBottom: '1px solid var(--wine-100)', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--wine-400), var(--wine-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                    {(u.nombre_completo ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{u.nombre_completo}</p>
                    {u.email && <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{u.email}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleAgregar(u)}
                  style={{ padding: '0.35rem 0.875rem', borderRadius: '0.375rem', border: 'none', background: 'rgba(22,163,74,0.1)', color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  + Agregar
                </button>
              </div>
            ))}
          </div>
        )}

        {busqueda.trim().length >= 2 && !buscando && resultados.length === 0 && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            No se encontraron alumnos disponibles con ese nombre.
          </p>
        )}

        {addMsg && (
          <div style={{ marginTop: '0.625rem', padding: '0.5rem 0.875rem', borderRadius: '0.375rem', fontSize: '0.875rem', background: addMsg.tipo === 'ok' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)', color: addMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)', border: `1px solid ${addMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)'}` }}>
            {addMsg.texto}
          </div>
        )}
      </div>

      {/* ── Lista de alumnos inscritos ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--wine-800)' }}>Alumnos inscritos</span>
          <span style={{ background: 'var(--wine-600)', color: 'white', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
            {estudiantes.length}
          </span>
        </div>

        {loading && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Cargando...</p>
        )}

        {!loading && estudiantes.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', background: 'var(--bg-page)', padding: '1rem', borderRadius: '0.5rem', margin: 0 }}>
            No hay alumnos inscritos en este curso todavía.
          </p>
        )}

        {!loading && estudiantes.length > 0 && (
          <div style={{ borderRadius: '0.5rem', border: '1px solid var(--wine-100)', overflow: 'hidden' }}>
            {estudiantes.map((e, i) => (
              <div
                key={e.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', gap: '1rem',
                  borderBottom: i < estudiantes.length - 1 ? '1px solid var(--wine-100)' : 'none',
                  background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-page)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--wine-400), var(--wine-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                    {(e.estudiante?.nombre_completo ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {e.estudiante?.nombre_completo ?? 'Sin nombre'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {e.estudiante?.email ?? ''}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                    background: e.estado === 'activa' ? 'rgba(22,163,74,0.1)' : 'rgba(100,100,100,0.1)',
                    color: e.estado === 'activa' ? 'var(--success)' : 'var(--text-secondary)',
                  }}>
                    {e.estado === 'activa' ? 'Activo' : 'Finalizado'}
                  </span>
                  {e.estado === 'activa' && (
                    <button
                      onClick={() => solicitarRemover(e.id, e.estudiante?.nombre_completo ?? 'alumno')}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: 'var(--error)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Dar de baja
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmModal !== null}
        title={confirmModal?.title ?? ''}
        description={confirmModal?.description}
        confirmLabel={confirmModal?.confirmLabel}
        onConfirm={confirmModal?.onConfirm ?? (() => {})}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  )
}
