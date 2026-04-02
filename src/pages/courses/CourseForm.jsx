import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { getCursoById, getCategorias, crearCurso, actualizarCurso } from '../../lib/coursesService'

export default function CourseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDocente, isAdmin } = useRole()

  const isEdit = !!id

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria_id: '',
    imagen_url: '',
  })
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const catRes = await getCategorias()
      if (!catRes.error) setCategorias(catRes.data ?? [])

      if (isEdit) {
        const { data, error: err } = await getCursoById(id)
        if (err || !data) {
          setError('No se pudo cargar el curso.')
        } else {
          setForm({
            titulo: data.titulo ?? '',
            descripcion: data.descripcion ?? '',
            categoria_id: data.categoria_id ?? '',
            imagen_url: data.imagen_url ?? '',
          })
        }
        setLoading(false)
      }
    }
    cargar()
  }, [id, isEdit])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo.trim()) return setError('El título del curso es obligatorio.')
    if (!form.categoria_id) return setError('Selecciona una categoría.')

    setSubmitting(true)
    setError(null)

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria_id: form.categoria_id,
      imagen_url: form.imagen_url.trim() || null,
    }

    let result
    if (isEdit) {
      result = await actualizarCurso(id, payload)
    } else {
      result = await crearCurso({ ...payload, docente_id: user.id, estado: 'activo' })
    }

    if (result.error) {
      setError(isEdit ? 'No se pudo actualizar el curso.' : 'No se pudo crear el curso.')
      setSubmitting(false)
      return
    }

    navigate(`/courses/${result.data.id}`)
  }

  // Solo docentes y admins pueden acceder
  if (!isDocente && !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <Navbar />
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No tienes permisos para crear cursos.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
          borderRadius: '1rem', padding: '2rem',
        }}>
          {/* Título */}
          <h1 style={{ margin: '0 0 1.75rem', color: 'var(--wine-800)', fontSize: '1.5rem', fontWeight: 800 }}>
            {isEdit ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </h1>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Cargando...</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Título */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Título del curso <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  placeholder="Ej. Introducción a la Programación"
                  maxLength={120}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                />
              </div>

              {/* Categoría */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Categoría <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <select
                  name="categoria_id"
                  value={form.categoria_id}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Describe brevemente de qué trata este curso..."
                  rows={4}
                  maxLength={1000}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                />
              </div>

              {/* URL Imagen (opcional) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  URL de imagen <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  name="imagen_url"
                  value={form.imagen_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  type="url"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '0.625rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                  background: 'rgba(220,38,38,0.08)', color: 'var(--error)',
                  border: '1px solid var(--error)',
                }}>
                  {error}
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{
                    padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
                    border: '1px solid var(--wine-100)', background: 'white',
                    color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.625rem 1.75rem', borderRadius: '0.5rem',
                    border: 'none', background: submitting ? 'var(--wine-200)' : 'var(--wine-600)',
                    color: 'white', fontWeight: 700, fontSize: '0.875rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = 'var(--wine-800)' }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = 'var(--wine-600)' }}
                >
                  {submitting ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear curso')}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

const inputStyle = {
  padding: '0.625rem 0.875rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--wine-100)',
  background: 'var(--bg-page)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
