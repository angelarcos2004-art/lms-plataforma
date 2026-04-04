import { supabase } from './supabase'

// ── Gestión Administrativa ───────────────────────────────────────────────────

export async function getUsuariosAdmin() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, roles(nombre)')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function getRoles() {
  const { data, error } = await supabase.from('roles').select('*')
  return { data, error }
}

export async function updateRolUsuario(usuarioId, rolId) {
  return supabase
    .from('usuarios')
    .update({ rol_id: rolId })
    .eq('id', usuarioId)
    .select()
    .single()
}

export async function toggleActivoUsuario(usuarioId, activo) {
  return supabase
    .from('usuarios')
    .update({ activo })
    .eq('id', usuarioId)
    .select()
    .single()
}

export async function eliminarUsuarioLms(usuarioId) {
  return supabase
    .from('usuarios')
    .delete()
    .eq('id', usuarioId)
}
