import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'
import { getAdminStats } from '../../lib/socialService'
import { getUsuariosAdmin, getRoles, updateRolUsuario, toggleActivoUsuario, eliminarUsuarioLms } from '../../lib/adminService'

export default function AdminPanel() {
  const { user } = useAuth()
  const { isAdmin } = useRole()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    if (isAdmin === false) {
      navigate('/')
    }
  }, [isAdmin, navigate])

  useEffect(() => {
    async function load() {
      if (!user || isAdmin === false) return
      
      const st = await getAdminStats()
      setStats(st)

      const { data: rols } = await getRoles()
      if (rols) setRoles(rols)

      const { data: usrs } = await getUsuariosAdmin()
      if (usrs) setUsuarios(usrs)

      setLoading(false)
    }
    load()
  }, [user, isAdmin])

  const handleRoleChange = async (usuarioId, newRoleId) => {
    const { error } = await updateRolUsuario(usuarioId, newRoleId)
    if (!error) {
      // Actualizamos el estado local
      const roleName = roles.find(r => r.id === newRoleId)?.nombre || ''
      setUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, rol_id: newRoleId, roles: { nombre: roleName } } : u))
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
          alert('Debido a las reglas estrictas de la plataforma, el usuario en este momento debe ser Desactivado en la base de datos en lugar de ELIMINADO para preservar sus envíos. Usa el botón "Desactivar".')
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

        {/* Tabla de Usuarios */}
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
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--wine-100)' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.nombre_completo || 'Sin nombre'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={u.rol_id}
                      onChange={e => handleRoleChange(u.id, parseInt(e.target.value))}
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
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

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
