import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { getCursoById, getCategorias, crearCurso, actualizarCurso, subirImagenCurso } from '../../lib/coursesService'

export default function CourseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDocente, isAdmin } = useRole()

  const isEdit = !!id

  function generarImagenAuto() {
    return `https://picsum.photos/seed/${Math.floor(Math.random() * 9999)}/800/400`
  }

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria_id: '',
    imagen_url: generarImagenAuto(),
    codigo_invitacion: '',
  })
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
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
            codigo_invitacion: data.codigo_invitacion ?? '',
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
      codigo_invitacion: form.codigo_invitacion.trim() || null,
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

              {/* Código de invitación */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Código de invitación <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400 }}>(los estudiantes lo usan para inscribirse)</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    name="codigo_invitacion"
                    value={form.codigo_invitacion}
                    onChange={e => setForm(prev => ({ ...prev, codigo_invitacion: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                    placeholder="Ej. PROG2024"
                    maxLength={12}
                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
                  />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, codigo_invitacion: Math.random().toString(36).substring(2, 8).toUpperCase() }))}
                    style={{ padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', background: 'var(--bg-page)', color: 'var(--wine-700)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Generar código
                  </button>
                </div>
              </div>

              {/* Imagen del curso */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Imagen del curso
                </label>

                {/* Preview */}
                <div style={{ height: '140px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--wine-100)', background: 'var(--wine-50)' }}>
                  <img
                    src={form.imagen_url}
                    alt="Vista previa"
                    style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                  />
                </div>

                {/* Subir desde dispositivo */}
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start',
                  padding: '0.5rem 0.875rem', borderRadius: '0.5rem', cursor: uploading ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--wine-100)', background: 'var(--bg-page)',
                  color: 'var(--wine-700)', fontSize: '0.78rem', fontWeight: 600,
                  opacity: uploading ? 0.6 : 1,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {uploading ? 'Subiendo...' : 'Cambiar imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading(true)
                      setError(null)
                      const { data: url, error: uploadErr } = await subirImagenCurso(file)
                      setUploading(false)
                      if (uploadErr) return setError('No se pudo subir la imagen.')
                      setForm(prev => ({ ...prev, imagen_url: url }))
                    }}
                  />
                </label>
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
