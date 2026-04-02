import { useState } from 'react'

const TIPO_CONFIG = {
  texto:     { label: 'Texto',     color: 'var(--wine-400)', icon: IconText },
  enlace:    { label: 'Enlace',    color: 'var(--info)',     icon: IconLink },
  video:     { label: 'Video',     color: '#DC2626',         icon: IconVideo },
  documento: { label: 'Documento', color: 'var(--wine-600)', icon: IconDoc },
  otro:      { label: 'Otro',      color: 'var(--text-secondary)', icon: IconPaper },
}

export default function MaterialItem({ material, onDelete, canDelete }) {
  const [expanded, setExpanded] = useState(false)
  const config = TIPO_CONFIG[material.tipo] ?? TIPO_CONFIG.otro
  const IconComp = config.icon
  const isLink = material.tipo === 'enlace'

  function handleClick() {
    if (isLink) {
      window.open(material.contenido, '_blank', 'noopener,noreferrer')
    } else {
      setExpanded(v => !v)
    }
  }

  return (
    <div style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--wine-100)' }}>
      <button
        onClick={handleClick}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1rem', background: 'var(--bg-page)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--wine-50)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-page)')}
      >
        {/* Ícono de tipo */}
        <span style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: `${config.color}18`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconComp color={config.color} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
            {material.titulo}
          </span>
          <span style={{ fontSize: '0.72rem', color: config.color, fontWeight: 600 }}>
            {config.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {canDelete && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onDelete(material.id) }}
              style={{ padding: '2px 6px', borderRadius: '4px', color: 'var(--error)', fontSize: '0.75rem', cursor: 'pointer' }}
              title="Eliminar"
            >
              ✕
            </span>
          )}
          {!isLink && (
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-secondary)" strokeWidth="2"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
          {isLink && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          )}
        </div>
      </button>

      {/* Contenido expandido */}
      {!isLink && expanded && material.contenido && (
        <div style={{
          padding: '1rem 1rem 1rem 3.25rem',
          borderTop: '1px solid var(--wine-100)',
          background: 'white',
          fontSize: '0.875rem', color: 'var(--text-primary)',
          lineHeight: 1.7, whiteSpace: 'pre-wrap',
        }}>
          {material.contenido}
        </div>
      )}
    </div>
  )
}

// ── Íconos inline ────────────────────────────────────────────────────────────

function IconText({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconLink({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function IconVideo({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

function IconDoc({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function IconPaper({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21.44" y1="11.05" x2="9.37" y2="23.12" />
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2" />
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    </svg>
  )
}
