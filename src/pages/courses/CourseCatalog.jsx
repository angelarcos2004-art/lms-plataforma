import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import CourseCard from '../../components/courses/CourseCard'
import { getCursos, getCategorias, unirseConCodigo } from '../../lib/coursesService'
import { useRole } from '../../hooks/useRole'

export default function CourseCatalog() {
  const navigate = useNavigate()
  const { isEstudiante } = useRole()

  const [cursos, setCursos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Unirse con código
  const [codigo, setCodigo] = useState('')
  const [codigoLoading, setCodigoLoading] = useState(false)
  const [codigoMsg, setCodigoMsg] = useState(null)

  async function handleUnirseConCodigo(e) {
    e.preventDefault()
    if (!codigo.trim()) return
    setCodigoLoading(true)
    setCodigoMsg(null)
    const { data, error: err } = await unirseConCodigo(codigo.trim())
    setCodigoLoading(false)
    if (err) {
      setCodigoMsg({ tipo: 'error', texto: err.message ?? 'Código inválido o ya estás inscrito.' })
    } else {
      setCodigoMsg({ tipo: 'ok', texto: '¡Te inscribiste correctamente! Redirigiendo...' })
      setTimeout(() => navigate(`/courses/${data.curso_id}`), 1500)
    }
  }

  useEffect(() => {
    async function cargar() {
      const [cursosRes, categoriasRes] = await Promise.all([getCursos(), getCategorias()])
      if (cursosRes.error) {
        setError('No se pudieron cargar los cursos.')
      } else {
        setCursos(cursosRes.data ?? [])
      }
      if (!categoriasRes.error) setCategorias(categoriasRes.data ?? [])
      setLoading(false)
    }
    cargar()
  }, [])

  const cursosFiltrados = cursos.filter(c => {
    const coincideCategoria = categoriaFiltro === 'todas' || String(c.categoria_id) === String(categoriaFiltro)
    const coincideBusqueda = c.titulo.toLowerCase().includes(busqueda.toLowerCase())
    return coincideCategoria && coincideBusqueda
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.75rem', fontWeight: 800 }}>
            Catálogo de Cursos
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {cursos.length} {cursos.length !== 1 ? 'cursos disponibles' : 'curso disponible'}
          </p>
        </div>

        {/* Unirse con código (solo estudiantes) */}
        {isEstudiante && (
          <div style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.25rem 1.5rem' }}>
            <p style={{ margin: '0 0 0.75rem', fontWeight: 700, color: 'var(--wine-800)', fontSize: '0.95rem' }}>
              ¿Tienes un código de invitación?
            </p>
            <form onSubmit={handleUnirseConCodigo} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="Ingresa tu código de acceso"
                maxLength={12}
                style={{ flex: '1 1 200px', padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--wine-100)', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.1em', outline: 'none', color: 'var(--wine-800)', background: 'var(--bg-page)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
                onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
              />
              <button
                type="submit"
                disabled={codigoLoading || !codigo.trim()}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: codigoLoading ? 'var(--wine-200)' : 'var(--wine-600)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: codigoLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {codigoLoading ? 'Verificando...' : 'Unirme al curso'}
              </button>
            </form>
            {codigoMsg && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: codigoMsg.tipo === 'ok' ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                {codigoMsg.texto}
              </p>
            )}
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar curso..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              flex: '1 1 240px',
              padding: '0.6rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--wine-100)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              maxWidth: '360px',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--wine-400)')}
            onBlur={e => (e.target.style.borderColor = 'var(--wine-100)')}
          />

          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--wine-100)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Cargando cursos...
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid var(--error)',
            borderRadius: '0.75rem', padding: '1rem 1.25rem',
            color: 'var(--error)', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && !error && cursosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'var(--wine-50)', border: '1px solid var(--wine-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--wine-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {busqueda || categoriaFiltro !== 'todas'
                ? 'No se encontraron cursos con esos filtros.'
                : 'No hay cursos disponibles por el momento.'}
            </p>
          </div>
        )}

        {/* Grid de cursos */}
        {!loading && cursosFiltrados.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {cursosFiltrados.map(curso => (
              <CourseCard key={curso.id} curso={curso} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
