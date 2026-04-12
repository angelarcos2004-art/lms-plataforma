import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import ConfirmModal from '../../components/ui/ConfirmModal'
import AlertModal from '../../components/ui/AlertModal'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { getAdminStats } from '../../lib/socialService'
import { getUsuariosAdmin, getRoles, updateRolUsuario, toggleActivoUsuario, eliminarUsuarioLms, verificarCursosDocente, getCursosAdmin, transferirCursoDocente, getInscripcionesAdmin, asignarCursoEstudiante, removerCursoEstudiante } from '../../lib/adminService'
import { getReportesParaAdmin, actualizarEstadoReporte, eliminarReporte } from '../../lib/supportService'

export default function AdminPanel() {
  const { user } = useAuth()
  const { isAdmin, isLoading: roleLoading } = useRole()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [cursos, setCursos] = useState([])
  const [inscripciones, setInscripciones] = useState([])
  const [reportes, setReportes] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('usuarios')
  const [confirmModal, setConfirmModal] = useState(null)
  const [alertModal, setAlertModal] = useState(null)

  // Buscadores
  const [searchUsuarios, setSearchUsuarios] = useState('')
  const [searchCursos, setSearchCursos] = useState('')
  const [searchInscripciones, setSearchInscripciones] = useState('')

  useEffect(() => {
    if (!roleLoading && isAdmin === false) {
      navigate('/')
    }
  }, [isAdmin, roleLoading, navigate])

  useEffect(() => {
    async function load() {
      if (!user || isAdmin !== true) return
      try {
        const st = await getAdminStats()
        setStats(st)

        const { data: rols } = await getRoles()
        if (rols) setRoles(rols)

        const { data: usrs } = await getUsuariosAdmin()
        if (usrs) setUsuarios(usrs)

        const { data: cur } = await getCursosAdmin()
        if (cur) setCursos(cur)

        const { data: ins } = await getInscripcionesAdmin()
        if (ins) setInscripciones(ins)

        const { data: rep } = await getReportesParaAdmin()
        if (rep) setReportes(rep)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, isAdmin])

  const handleRoleChange = async (usuario, newRoleId) => {
    // 1. Verificación de seguridad si degradamos a un Docente
    const roleOriginal = usuario.roles?.nombre
    const newRoleObj = roles.find(r => r.id === newRoleId)
    
    if (roleOriginal === 'docente' && newRoleObj?.nombre !== 'docente') {
      const { count } = await verificarCursosDocente(usuario.id)
      if (count > 0) {
        setAlertModal({
          title: 'Acción Cancelada',
          description: `No se puede degradar a este docente porque tiene ${count} curso(s) activo(s) en la base de datos. Por favor, transfiere o elimina sus cursos en la pestaña de "Grupos / Cursos" antes de cambiar su rol.`
        })
        // Re-render para forzar que el select vuelva a su estado original visualmente
        setUsuarios(prev => [...prev]) 
        return
      }
    }

    // 2. Proceder con el cambio
    const { error } = await updateRolUsuario(usuario.id, newRoleId)
    if (!error) {
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, rol_id: newRoleId, roles: { nombre: newRoleObj?.nombre || '' } } : u))
    }
  }

  const handleToggleActivo = async (usuarioId, boolVal) => {
    const { error } = await toggleActivoUsuario(usuarioId, boolVal)
    if (!error) {
      setUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, activo: boolVal } : u))
    }
  }

  const handleDeleteClick = (usuario) => {
    setConfirmModal({
      title: 'Eliminar usuario',
      description: `¿Estás seguro de que deseas eliminar permanentemente a "${usuario.nombre_completo || usuario.email}"? Esto borrará sus datos en la plataforma pública y no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        const { error } = await eliminarUsuarioLms(usuario.id)
        if (error) {
          setAlertModal({
            title: 'No se puede eliminar',
            description: 'Debido a las reglas estrictas de la plataforma, el usuario en este momento debe ser Desactivado en lugar de Eliminado para preservar sus entregas. Usa el botón "Desactivar".'
          })
        } else {
          setUsuarios(prev => prev.filter(u => u.id !== usuario.id))
        }
        setConfirmModal(null)
      }
    })
  }

  if (!isAdmin || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <Navbar />
        <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          Cargando panel...
        </main>
      </div>
    )
  }

  // Filtrado de Datos
  const filteredUsuarios = usuarios.filter(u => 
    (u.nombre_completo || '').toLowerCase().includes(searchUsuarios.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchUsuarios.toLowerCase())
  )

  const filteredCursos = cursos.filter(c => 
    (c.titulo || '').toLowerCase().includes(searchCursos.toLowerCase()) ||
    (c.docente?.nombre_completo || c.docente?.email || '').toLowerCase().includes(searchCursos.toLowerCase())
  )

  const estudiantes = usuarios.filter(u => u.roles?.nombre === 'estudiante')
  const filteredEstudiantes = estudiantes.filter(e => 
    (e.nombre_completo || '').toLowerCase().includes(searchInscripciones.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(searchInscripciones.toLowerCase())
  )

  const handleInscribirRapido = async (usuarioId, cursoId) => {
    if(!cursoId) return

    if(inscripciones.some(i => i.estudiante_id === usuarioId && i.curso_id === parseInt(cursoId))) {
      setAlertModal({ title: 'Duplicado', description: 'El alumno ya se encuentra inscrito en este curso.' })
      return
    }

    const { data, error } = await asignarCursoEstudiante(usuarioId, cursoId)
    if (error) {
      setAlertModal({ title: 'Error', description: 'Hubo un error al procesar la inscripción.' })
    } else if (data) {
      const { data: ins } = await getInscripcionesAdmin()
      if (ins) setInscripciones(ins)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ color: 'var(--wine-800)', fontSize: '2rem', marginBottom: '2rem' }}>Panel Administrativo</h1>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
            <div style={statCardStyle}>
              <h3 style={statTitleStyle}>Total Usuarios</h3>
              <p style={statValueStyle}>{stats.totalUsuarios}</p>
            </div>
            <div style={statCardStyle}>
              <h3 style={statTitleStyle}>Total Cursos</h3>
              <p style={statValueStyle}>{stats.totalCursos}</p>
            </div>
            <div style={statCardStyle}>
              <h3 style={statTitleStyle}>Inscripciones Activas</h3>
              <p style={statValueStyle}>{stats.totalInscripciones}</p>
            </div>
          </div>
        )}

        {/* Tabs de Navegación */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--wine-200)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('usuarios')}
            style={activeTab === 'usuarios' ? activeTabStyle : inactiveTabStyle}
          >
            Gestión de Usuarios
          </button>
          <button 
            onClick={() => setActiveTab('cursos')}
            style={activeTab === 'cursos' ? activeTabStyle : inactiveTabStyle}
          >
            Transferencia de Cursos
          </button>
          <button 
            onClick={() => setActiveTab('inscripciones')}
            style={activeTab === 'inscripciones' ? activeTabStyle : inactiveTabStyle}
          >
            Inscripciones de Alumnos
          </button>
          <button 
            onClick={() => setActiveTab('reportes')}
            style={activeTab === 'reportes' ? { ...activeTabStyle, color: 'white', background: 'var(--error)' } : { ...inactiveTabStyle, color: 'var(--error)', border: '1px solid var(--error)' }}
          >
            🚨 Centro de Reportes
          </button>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}

        {/* Tab 1: Usuarios */}
        {activeTab === 'usuarios' && (
        <>
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="🔎 Buscar usuario por nombre o correo..." 
            value={searchUsuarios}
            onChange={(e) => setSearchUsuarios(e.target.value)}
            style={searchInputStyle}
          />
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
          borderRadius: '1rem', overflowX: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--wine-50)', borderBottom: '1px solid var(--wine-100)' }}>
                <th style={thStyle}>Nombre / Email</th>
                <th style={thStyle}>Rol</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Regreso</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--wine-100)' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.nombre_completo || 'Sin nombre'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={u.rol_id}
                      onChange={e => handleRoleChange(u, parseInt(e.target.value))}
                      style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--wine-200)', outline: 'none' }}
                      disabled={user.id === u.id} // No cambiarse el rol a sí mismo por seguridad (o sí, pero bajo riesgo)
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                      background: u.activo ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                      color: u.activo ? 'var(--success)' : 'var(--error)'
                    }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {user.id !== u.id && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleToggleActivo(u.id, !u.activo)}
                          style={{
                            background: 'none', border: '1px solid ' + (u.activo ? 'var(--warning, #D97706)' : 'var(--success)'),
                            color: u.activo ? 'var(--warning, #D97706)' : 'var(--success)',
                            padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'
                          }}
                          title={u.activo ? 'Desactivar acceso' : 'Permitir acceso'}
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u)}
                          style={{
                            background: 'none', border: '1px solid var(--error)',
                            color: 'var(--error)', padding: '0.25rem 0.5rem', 
                            borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'
                          }}
                          title="Eliminar usuario"
                        >
                          Borrar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsuarios.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No se encontraron usuarios coincidentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
        )}

        {/* Tab 2: Cursos */}
        {activeTab === 'cursos' && (
        <>
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="🔎 Buscar curso por grupo o nombre del profesor..." 
            value={searchCursos}
            onChange={(e) => setSearchCursos(e.target.value)}
            style={searchInputStyle}
          />
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
          borderRadius: '1rem', overflowX: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--wine-50)', borderBottom: '1px solid var(--wine-100)' }}>
                <th style={thStyle}>Nombre del Grupo</th>
                <th style={thStyle}>Categoría</th>
                <th style={thStyle}>Profesor Asignado</th>
                <th style={thStyle}>Fecha de Creación</th>
              </tr>
            </thead>
            <tbody>
              {filteredCursos.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--wine-100)' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.titulo}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.85rem', background: 'var(--wine-100)', color: 'var(--wine-800)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {c.categoria_id}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={c.docente_id}
                      onChange={(e) => {
                        const nuevoDocenteId = e.target.value
                        setConfirmModal({
                          title: 'Transferir Grupo',
                          description: '¿Deseas transferir este grupo al nuevo profesor? Él o ella tendrá control total del curso a partir de ahora.',
                          confirmLabel: 'Transferir',
                          onConfirm: async () => {
                            const { error } = await transferirCursoDocente(c.id, nuevoDocenteId)
                            if (!error) {
                              const newDocente = usuarios.find(u => u.id === nuevoDocenteId)
                              setCursos(prev => prev.map(cur => cur.id === c.id ? { ...cur, docente_id: nuevoDocenteId, docente: newDocente } : cur))
                            } else {
                              setAlertModal({ title: 'Error', description: 'No se pudo transferir el curso.' })
                            }
                            setConfirmModal(null)
                          }
                        })
                      }}
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--wine-200)', outline: 'none', background: 'var(--bg-card)' }}
                    >
                      {/* Opciones filtradas solo para docentes activos */}
                      {usuarios.filter(u => u.roles?.nombre === 'docente').map(docente => (
                        <option key={docente.id} value={docente.id}>
                          {docente.nombre_completo || docente.email}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCursos.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No se encontraron cursos coincidentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
        )}

        {/* Tab 3: Inscripciones */}
        {activeTab === 'inscripciones' && (
        <>
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="🔎 Buscar alumno por nombre o correo..." 
            value={searchInscripciones}
            onChange={(e) => setSearchInscripciones(e.target.value)}
            style={searchInputStyle}
          />
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--wine-100)',
          borderRadius: '1rem', overflowX: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--wine-50)', borderBottom: '1px solid var(--wine-100)' }}>
                <th style={thStyle}>Estudiante</th>
                <th style={thStyle}>Materias Inscritas (Clic para borrar)</th>
                <th style={thStyle}>Matricular Nuevo Curso</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstudiantes.map(estudiante => {
                // Sacar todas las inscripciones solo de este estudiante
                const susInscripciones = inscripciones.filter(i => i.estudiante_id === estudiante.id)
                
                return (
                  <tr key={estudiante.id} style={{ borderBottom: '1px solid var(--wine-100)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{estudiante.nombre_completo || 'Sin nombre'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{estudiante.email}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {susInscripciones.map(ins => (
                          <div 
                            key={ins.id}
                            onClick={() => {
                              setConfirmModal({
                                title: 'Dar de baja',
                                description: `¿Deseas desvincular al alumno de "${ins.curso?.titulo}"? Perderá el acceso de inmediato a este curso.`,
                                confirmLabel: 'Expulsar',
                                onConfirm: async () => {
                                  const { error } = await removerCursoEstudiante(ins.id)
                                  if (!error) {
                                    setInscripciones(prev => prev.filter(i => i.id !== ins.id))
                                  } else {
                                    setAlertModal({ title: 'Error', description: 'No se pudo expulsar al alumno.' })
                                  }
                                  setConfirmModal(null)
                                }
                              })
                            }}
                            title="Dar clic para dar de baja de la materia"
                            style={{
                              fontSize: '0.75rem', background: 'var(--wine-100)', color: 'var(--wine-800)',
                              padding: '0.3rem 0.6rem', borderRadius: '12px', fontWeight: 600,
                              cursor: 'pointer', border: '1px solid var(--wine-200)', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <span>{ins.curso?.titulo || 'Curso Borrado'}</span>
                            <span style={{color:'var(--error)', marginLeft:'4px'}}>✕</span>
                          </div>
                        ))}
                        {susInscripciones.length === 0 && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sin materias.</span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <select
                        onChange={(e) => {
                          handleInscribirRapido(estudiante.id, e.target.value)
                          e.target.value = "" // reset select
                        }}
                        style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--wine-200)', outline: 'none', background: 'var(--bg-card)' }}
                      >
                        <option value="">➕ Añadir a una clase...</option>
                        {cursos.map(c => (
                          <option key={c.id} value={c.id}>{c.titulo}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
              {filteredEstudiantes.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No se encontraron estudiantes para inscribir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
        )}

        {/* Tab 4: Reportes */}
        {activeTab === 'reportes' && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '1rem', overflowX: 'auto', boxShadow: '0 4px 15px rgba(220,38,38,0.05)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(220,38,38,0.05)', borderBottom: '1px solid rgba(220,38,38,0.2)' }}>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Reportador</th>
                  <th style={thStyle}>Acusado (Infractor)</th>
                  <th style={thStyle}>Motivo</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportes.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--success)' }}>
                      🎉 ¡Todo excelente! No hay reportes activos en la plataforma.
                    </td>
                  </tr>
                ) : reportes.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--wine-100)', background: r.estado === 'pendiente' ? 'rgba(234,179,8,0.05)' : 'transparent' }}>
                    <td style={tdStyle}>{new Date(r.created_at).toLocaleDateString('es-MX')}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.reportador?.nombre_completo}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.reportador?.correo}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 800, color: 'var(--error)' }}>{r.reportado?.nombre_completo}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.85rem' }}>{r.motivo}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                        background: r.estado === 'pendiente' ? 'rgba(234,179,8,0.1)' : 'rgba(22,163,74,0.1)',
                        color: r.estado === 'pendiente' ? 'var(--warning)' : 'var(--success)'
                      }}>
                        {r.estado.toUpperCase()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {r.estado === 'pendiente' ? (
                          <button onClick={async () => {
                            await actualizarEstadoReporte(r.id, 'revisado')
                            setReportes(prev => prev.map(pr => pr.id === r.id ? { ...pr, estado: 'revisado' } : pr))
                          }} style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', background: 'var(--success)', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            Revisar
                          </button>
                        ) : (
                          <button onClick={() => {
                            setConfirmModal({
                              title: 'Eliminar Reporte',
                              description: '¿Estás seguro de que deseas borrar definitivamente este archivo de reporte? Esta acción eliminará el registro permanentemente y no se puede deshacer.',
                              confirmLabel: 'Sí, Borrar',
                              onConfirm: async () => {
                                await eliminarReporte(r.id)
                                setReportes(prev => prev.filter(pr => pr.id !== r.id))
                                setConfirmModal(null)
                              }
                            })
                          }} style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid var(--wine-200)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            Borrar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODALES */}
      {confirmModal && (
        <ConfirmModal
          open={true}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <AlertModal
        open={!!alertModal}
        title={alertModal?.title}
        description={alertModal?.description}
        onClose={() => setAlertModal(null)}
      />
    </div>
  )
}

const statCardStyle = {
  background: 'var(--bg-card)', padding: '1.5rem',
  borderRadius: '1rem', border: '1px solid var(--wine-100)',
  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
}
const statTitleStyle = { margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }
const statValueStyle = { margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--wine-700)' }

const thStyle = { padding: '1rem', fontSize: '0.85rem', color: 'var(--wine-800)', fontWeight: 700 }
const tdStyle = { padding: '1rem', verticalAlign: 'middle' }

const activeTabStyle = {
  background: 'var(--wine-700)', color: 'white', border: 'none',
  padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600,
  cursor: 'pointer', transition: 'background 0.2s', fontSize: '1rem'
}
const inactiveTabStyle = {
  background: 'transparent', color: 'var(--wine-700)', border: '1px solid var(--wine-200)',
  padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600,
  cursor: 'pointer', transition: 'background 0.2s, color 0.2s', fontSize: '1rem'
}

const searchInputStyle = {
  width: '100%', padding: '0.85rem 1.25rem', borderRadius: '0.5rem',
  border: '1px solid var(--wine-200)', outline: 'none', fontSize: '0.95rem',
  color: 'var(--text-primary)', background: 'var(--bg-card)',
  transition: 'border-color 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
}
