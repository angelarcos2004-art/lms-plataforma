import { useState } from 'react'

const OFFICE_EXTS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'odp', 'ods']
const VIDEO_NATIVOS = ['mp4', 'webm', 'ogv']
const VIDEO_NO_NATIVOS = ['avi', 'mov', 'mkv']
const AUDIO_NATIVOS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']

function getExt(url = '') { return url.split('?')[0].split('.').pop().toLowerCase() }

function resolverUrl(url) {
  const ext = getExt(url)
  if (OFFICE_EXTS.includes(ext)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
  }
  return url
}

// Detecta tipo visual desde la URL o nombre de archivo
function detectarTipo(url = '') {
  const ext = url.split('?')[0].split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx', 'odt'].includes(ext)) return 'word'
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'ppt'
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return 'excel'
  if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'ogv'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) return 'audio'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'imagen'
  if (url.startsWith('http')) return 'enlace'
  return 'texto'
}

const TIPO_CONFIG = {
  pdf:    { label: 'PDF',         color: '#DC2626', icon: IconPdf },
  word:   { label: 'Word',        color: '#2563EB', icon: IconWord },
  ppt:    { label: 'PowerPoint',  color: '#EA580C', icon: IconPpt },
  excel:  { label: 'Excel',       color: '#16A34A', icon: IconExcel },
  video:  { label: 'Video',       color: '#7C3AED', icon: IconVideo },
  audio:  { label: 'Audio',       color: '#DB2777', icon: IconAudio },
  imagen: { label: 'Imagen',      color: '#0891B2', icon: IconImage },
  enlace: { label: 'Enlace',      color: 'var(--info)', icon: IconLink },
  texto:  { label: 'Texto',       color: 'var(--wine-400)', icon: IconText },
}

const ARCHIVO_TIPOS = ['pdf', 'word', 'ppt', 'excel', 'video', 'audio', 'imagen']

export default function MaterialItem({ material, onDelete, canDelete }) {
  const [expanded, setExpanded] = useState(false)
  const tipo = detectarTipo(material.contenido)
  const config = TIPO_CONFIG[tipo] ?? TIPO_CONFIG.texto
  const IconComp = config.icon
  const ext = getExt(material.contenido)
  const esVideoNativo = VIDEO_NATIVOS.includes(ext)
  const esVideoNoNativo = VIDEO_NO_NATIVOS.includes(ext)
  const esAudioNativo = AUDIO_NATIVOS.includes(ext)
  // Video nativo, audio y texto expanden inline; el resto abre pestaña
  const esExpandible = esVideoNativo || esAudioNativo || tipo === 'texto'
  const esAbrirExterno = !esExpandible

  function handleClick() {
    if (esAbrirExterno) {
      window.open(resolverUrl(material.contenido), '_blank', 'noopener,noreferrer')
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
        <span style={{
          width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
          background: `${config.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconComp color={config.color} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {material.titulo}
          </span>
          <span style={{ fontSize: '0.72rem', color: config.color, fontWeight: 600 }}>
            {config.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
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
          {esAbrirExterno ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          ) : esVideoNoNativo ? (
            // ícono descarga para formatos no reproducibles en navegador
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </button>

      {esExpandible && expanded && material.contenido && (
        <div style={{ borderTop: '1px solid var(--wine-100)', background: 'white' }}>
          {esVideoNativo ? (
            <video src={material.contenido} controls style={{ width: '100%', display: 'block', maxHeight: '400px', background: '#000' }} />
          ) : esAudioNativo ? (
            <div style={{ padding: '0.75rem 1rem' }}>
              <audio src={material.contenido} controls style={{ width: '100%' }} />
            </div>
          ) : (
            <div style={{ padding: '1rem 1rem 1rem 3.5rem', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {material.contenido}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Íconos ────────────────────────────────────────────────────────────────────

function IconPdf({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
      <line x1="9" y1="11" x2="15" y2="11"/>
    </svg>
  )
}

function IconWord({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <polyline points="8 13 10 17 12 13 14 17 16 13"/>
    </svg>
  )
}

function IconPpt({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <rect x="8" y="12" width="4" height="4" rx="1"/>
      <line x1="14" y1="13" x2="17" y2="13"/>
      <line x1="14" y1="16" x2="16" y2="16"/>
    </svg>
  )
}

function IconExcel({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="16" x2="16" y2="16"/>
      <line x1="12" y1="11" x2="12" y2="18"/>
    </svg>
  )
}

function IconVideo({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  )
}

function IconAudio({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

function IconImage({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

function IconLink({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}

function IconText({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="6" x2="3" y2="6"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
      <line x1="17" y1="18" x2="3" y2="18"/>
    </svg>
  )
}
