import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import UnidadSection from '../../components/content/UnidadSection'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { getCursoById } from '../../lib/coursesService'
import { getUnidadesByCurso, crearUnidad, getMisEntregas } from '../../lib/contentService'
import { getMisIntentos } from '../../lib/quizService'

export default function CourseContent() {
  const { id: cursoId } = useParams()
  const { user } = useAuth()
  const { isEstudiante, isDocente, isAdmin } = useRole()

  const [curso, setCurso] = useState(null)
  const [unidades, setUnidades] = useState([])
  const [entregasMap, setEntregasMap] = useState({})
  const [intentosMap, setIntentosMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Formulario nueva unidad
  const [showUnidadForm, setShowUnidadForm] = useState(false)
  const [unidadForm, setUnidadForm] = useState({ titulo: '', descripcion: '' })
  const [savingUnidad, setSavingUnidad] = useState(false)
  const [unidadError, setUnidadError] = useState(null)

  const canEdit = isDocente || isAdmin

  const cargarUnidades = useCallback(async () => {
    const { data, error: err } = await getUnidadesByCurso(cursoId)
    if (err) return
    const unis = data ?? []
    setUnidades(unis)

    // Cargar estado de entregas e intentos para estudiante
    if (isEstudiante && user && unis.length > 0) {
      const tareaIds = unis.flatMap(u => (u.tareas ?? []).map(t => t.id))
      if (tareaIds.length > 0) {
        const { data: entregas } = await getMisEntregas(user.id, tareaIds)
        const map = {}
        for (const e of entregas ?? []) map[e.tarea_id] = e
        setEntregasMap(map)
      }
      const quizIds = unis.flatMap(u => (u.cuestionarios ?? []).map(q => q.id))
      if (quizIds.length > 0) {
        const { data: intentos } = await getMisIntentos(user.id, quizIds)
        const imap = {}
        for (const i of intentos ?? []) imap[i.cuestionario_id] = i
        setIntentosMap(imap)
      }
    }
  }, [cursoId, isEstudiante, user])

  useEffect(() => {
    async function cargar() {
      const { data: cursoData, error: err } = await getCursoById(cursoId)
      if (err || !cursoData) {
        setError('No se encontró el curso.')
        setLoading(false)
        return
      }
      setCurso(cursoData)
      await cargarUnidades()
      setLoading(false)
    }
    cargar()
  }, [cursoId, cargarUnidades])

  async function handleAddUnidad(e) {
    e.preventDefault()
    if (!unidadForm.titulo.trim()) return setUnidadError('El título es obligatorio.')
    setSavingUnidad(true)
    setUnidadError(null)
    const { error: err } = await crearUnidad(cursoId, unidadForm.titulo.trim(), unidadForm.descripcion.trim() || null)
    setSavingUnidad(false)
    if (err) return setUnidadError('No se pudo crear la unidad.')
    setUnidadForm({ titulo: '', descripcion: '' })
    setShowUnidadForm(false)
    cargarUnidades()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <Link to="/courses" style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>Catálogo</Link>
          <span>›</span>
          <Link to={`/courses/${cursoId}`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>{curso?.titulo ?? '...'}</Link>
          <span>›</span>
          <span>Contenido</span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Cargando contenido...
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)',
            borderRadius: '0.75rem', padding: '1rem', color: 'var(--error)',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.5rem', fontWeight: 800 }}>
                  {curso?.titulo}
                </h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {unidades.length} unidad{unidades.length !== 1 ? 'es' : ''} · {unidades.reduce((n, u) => n + (u.tareas?.length ?? 0), 0)} tareas
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => { setShowUnidadForm(v => !v); setUnidadError(null) }}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                    border: '1px dashed var(--wine-400)', background: 'none',
                    color: 'var(--wine-600)', fontWeight: 700, fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  + Nueva Unidad
                </button>
              )}
            </div>

            {/* Formulario nueva unidad */}
            {showUnidadForm && (
              <form
                onSubmit={handleAddUnidad}
                style={{
                  marginBottom: '1.5rem', padding: '1.25rem',
                  background: 'var(--bg-card)', border: '1px dashed var(--wine-200)',
                  borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}
              >
                <h3 style={{ margin: 0, color: 'var(--wine-800)', fontSize: '0.95rem', fontWeight: 700 }}>Nueva Unidad</h3>
                <input
                  placeholder="Título de la unidad"
                  value={unidadForm.titulo}
                  onChange={e => setUnidadForm(p => ({ ...p, titulo: e.target.value }))}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--wine-100)', fontSize: '0.875rem', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                />
                <input
                  placeholder="Descripción (opcional)"
                  value={unidadForm.descripcion}
                  onChange={e => setUnidadForm(p => ({ ...p, descripcion: e.target.value }))}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--wine-100)', fontSize: '0.875rem', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                />
                {unidadError && (
                  <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.8rem' }}>{unidadError}</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit" disabled={savingUnidad}
                    style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    {savingUnidad ? 'Guardando...' : 'Crear unidad'}
                  </button>
                  <button
                    type="button" onClick={() => setShowUnidadForm(false)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--wine-100)', background: 'white', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Lista de unidades */}
            {unidades.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '4rem 2rem',
                background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
                borderRadius: '1rem',
              }}>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
                  {canEdit ? 'Este curso no tiene unidades aún.' : 'El contenido del curso estará disponible pronto.'}
                </p>
                {canEdit && (
                  <p style={{ color: 'var(--wine-400)', fontSize: '0.875rem', margin: 0 }}>
                    Haz clic en "+ Nueva Unidad" para comenzar.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {unidades.map((unidad, i) => (
                  <UnidadSection
                    key={unidad.id}
                    unidad={unidad}
                    numero={i + 1}
                    cursoId={cursoId}
                    canEdit={canEdit}
                    entregasMap={entregasMap}
                    intentosMap={intentosMap}
                    onUnidadUpdate={cargarUnidades}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
