import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { getCursoById } from '../../lib/coursesService'
import { getOrCreateForo, getHilosByForo, crearHilo, eliminarHilo } from '../../lib/socialService'
import { useRole } from '../../hooks/useRole'

export default function ForoPage() {
  const { id: cursoId } = useParams()
  const { user } = useAuth()
  const { isAdmin } = useRole()

  const [curso, setCurso] = useState(null)
  const [foro, setForo] = useState(null)
  const [hilos, setHilos] = useState([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titulo: '', contenido: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  async function cargarHilos(foroId) {
    const { data } = await getHilosByForo(foroId)
    setHilos(data ?? [])
  }

  useEffect(() => {
    async function cargar() {
      const { data: cursoData } = await getCursoById(cursoId)
      setCurso(cursoData)

      const { data: foroData, error } = await getOrCreateForo(cursoId)
      if (error || !foroData) { setLoading(false); return }
      setForo(foroData)
      await cargarHilos(foroData.id)
      setLoading(false)
    }
    cargar()
  }, [cursoId])

  async function handleCrearHilo(e) {
    e.preventDefault()
    if (!form.titulo.trim()) return setFormError('El título es obligatorio.')
    if (!form.contenido.trim()) return setFormError('El contenido es obligatorio.')
    setSaving(true)
    setFormError(null)
    const { error } = await crearHilo(foro.id, user.id, form.titulo.trim(), form.contenido.trim())
    setSaving(false)
    if (error) return setFormError('No se pudo crear el hilo.')
    setForm({ titulo: '', contenido: '' })
    setShowForm(false)
    cargarHilos(foro.id)
  }

  async function handleEliminarHilo(id) {
    if (!confirm('¿Eliminar este hilo y todos sus mensajes?')) return
    await eliminarHilo(id)
    cargarHilos(foro.id)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          <Link to="/courses" style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>Catálogo</Link>
          <span>›</span>
          <Link to={`/courses/${cursoId}`} style={{ color: 'var(--wine-600)', textDecoration: 'none' }}>{curso?.titulo ?? '...'}</Link>
          <span>›</span>
          <span>Foro</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.5rem', fontWeight: 800 }}>
              Foro del curso
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {hilos.length} hilo{hilos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setFormError(null) }}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            + Nuevo hilo
          </button>
        </div>

        {/* Formulario nuevo hilo */}
        {showForm && (
          <form onSubmit={handleCrearHilo} style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--wine-800)', fontSize: '1rem', fontWeight: 700 }}>Nuevo hilo</h3>
            <input
              placeholder="Título del hilo"
              value={form.titulo}
              onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
              onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
            />
            <textarea
              placeholder="Escribe aquí el contenido de tu hilo..."
              value={form.contenido}
              onChange={e => setForm(p => ({ ...p, contenido: e.target.value }))}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
              onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
            />
            {formError && <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.8rem' }}>{formError}</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                {saving ? 'Publicando...' : 'Publicar hilo'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', background: 'white', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando...</div>}

        {/* Lista de hilos */}
        {!loading && hilos.length === 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>No hay hilos aún.</p>
            <p style={{ color: 'var(--wine-400)', fontSize: '0.875rem', margin: 0 }}>¡Sé el primero en publicar!</p>
          </div>
        )}

        {!loading && hilos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {hilos.map(hilo => {
              const msgCount = hilo.mensajes_foro?.[0]?.count ?? 0
              const esAutor = hilo.autor_id === user?.id
              return (
                <div key={hilo.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {/* Avatar placeholder */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--wine-400), var(--wine-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                    {(hilo.usuarios?.nombre_completo ?? '?').charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/courses/${cursoId}/foro/${hilo.id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1rem', fontWeight: 700, lineHeight: 1.4 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--wine-600)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--wine-800)')}
                      >
                        {hilo.titulo}
                      </h3>
                    </Link>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hilo.contenido}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span>Por <strong style={{ color: 'var(--wine-600)' }}>{hilo.usuarios?.nombre_completo ?? 'Usuario'}</strong></span>
                      <span>{tiempoRelativo(hilo.created_at)}</span>
                      <span>💬 {msgCount} respuesta{msgCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {(esAutor || isAdmin) && (
                    <button onClick={() => handleEliminarHilo(hilo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', flexShrink: 0, fontSize: '0.8rem' }} title="Eliminar hilo">✕</button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
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
  const days = Math.floor(hrs / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

const inputStyle = {
  padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
  border: '1px solid var(--wine-100)', background: 'var(--bg-page)',
  color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}
