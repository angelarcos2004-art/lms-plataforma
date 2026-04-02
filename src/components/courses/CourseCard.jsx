import { Link } from 'react-router-dom'

// Gradientes para cursos sin portada
const GRADIENTS = [
  'linear-gradient(135deg, #7B2D3B 0%, #A84558 100%)',
  'linear-gradient(135deg, #5C1A28 0%, #7B2D3B 100%)',
  'linear-gradient(135deg, #A84558 0%, #C9A84C 100%)',
  'linear-gradient(135deg, #3A0F19 0%, #5C1A28 100%)',
]

function getGradient(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export default function CourseCard({ curso, badge }) {
  const titulo = curso?.titulo ?? 'Sin título'
  const descripcion = curso?.descripcion ?? ''
  const categoriaNombre = curso?.categorias?.nombre ?? null
  const docenteName = curso?.usuarios?.nombre_completo ?? null
  const gradient = getGradient(titulo)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--wine-100)',
        borderRadius: '1rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(92,26,40,0.15)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Imagen / Placeholder */}
      <div style={{
        height: '140px',
        background: curso?.imagen_url ? `url(${curso.imagen_url}) center/cover` : gradient,
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Inicial del curso */}
        {!curso?.imagen_url && (
          <span style={{
            position: 'absolute', bottom: '12px', left: '14px',
            fontSize: '2rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)',
            lineHeight: 1,
          }}>
            {titulo.charAt(0).toUpperCase()}
          </span>
        )}
        {/* Badge opcional (ej: "Inscrito") */}
        {badge && (
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'var(--gold)', color: 'var(--wine-900)',
            padding: '2px 10px', borderRadius: '9999px',
            fontSize: '0.7rem', fontWeight: 700,
          }}>
            {badge}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {categoriaNombre && (
          <span style={{
            display: 'inline-block',
            background: 'var(--wine-50)', color: 'var(--wine-800)',
            border: '1px solid var(--wine-100)',
            padding: '2px 8px', borderRadius: '6px',
            fontSize: '0.7rem', fontWeight: 600,
            width: 'fit-content',
          }}>
            {categoriaNombre}
          </span>
        )}

        <h3 style={{
          margin: 0, fontSize: '0.95rem', fontWeight: 700,
          color: 'var(--text-primary)',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {titulo}
        </h3>

        {descripcion && (
          <p style={{
            margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {descripcion}
          </p>
        )}

        {docenteName && (
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--wine-400)' }}>Por</span> {docenteName}
          </p>
        )}

        {/* Botón al fondo */}
        <Link
          to={`/courses/${curso?.id}`}
          style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            marginTop: 'auto', paddingTop: '0.75rem',
            background: 'var(--wine-600)', color: 'white',
            padding: '0.5rem 1rem', borderRadius: '0.5rem',
            fontSize: '0.82rem', fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--wine-800)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--wine-600)')}
        >
          Ver curso
        </Link>
      </div>
    </div>
  )
}
