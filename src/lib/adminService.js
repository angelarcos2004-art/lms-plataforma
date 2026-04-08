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

export async function verificarCursosDocente(docenteId) {
  const { count, error } = await supabase
    .from('cursos')
    .select('*', { count: 'exact', head: true })
    .eq('docente_id', docenteId)
  
  return { count: count || 0, error }
}

export async function getCursosAdmin() {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      *,
      docente:usuarios!docente_id ( id, nombre_completo, email )
    `)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function transferirCursoDocente(cursoId, nuevoDocenteId) {
  return supabase
    .from('cursos')
    .update({ docente_id: nuevoDocenteId })
    .eq('id', cursoId)
    .select()
    .single()
}

export async function getInscripcionesAdmin() {
  const { data, error } = await supabase
    .from('inscripciones')
    .select(`
      *,
      usuario:usuarios!estudiante_id ( id, nombre_completo, email ),
      curso:cursos!curso_id ( id, titulo )
    `)
  return { data, error }
}

export async function asignarCursoEstudiante(usuarioId, cursoId) {
  return supabase
    .from('inscripciones')
    .insert([
      { estudiante_id: usuarioId, curso_id: cursoId, estado: 'activa' }
    ])
    .select()
    .single()
}

export async function removerCursoEstudiante(inscripcionId) {
  return supabase
    .from('inscripciones')
    .delete()
    .eq('id', inscripcionId)
}
