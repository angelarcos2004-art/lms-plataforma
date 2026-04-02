import { supabase } from './supabase'

// ── Foros ─────────────────────────────────────────────────────────────────────

// Obtiene el foro del curso, lo crea si no existe
export async function getOrCreateForo(cursoId) {
  const { data } = await supabase
    .from('foros')
    .select('*')
    .eq('curso_id', cursoId)
    .maybeSingle()

  if (data) return { data, error: null }

  return supabase
    .from('foros')
    .insert({ curso_id: cursoId })
    .select()
    .single()
}

// ── Hilos ─────────────────────────────────────────────────────────────────────

export async function getHilosByForo(foroId) {
  return supabase
    .from('hilos_foro')
    .select('*, usuarios!autor_id(nombre_completo), mensajes_foro(count)')
    .eq('foro_id', foroId)
    .order('created_at', { ascending: false })
}

export async function getHiloById(id) {
  return supabase
    .from('hilos_foro')
    .select('*, usuarios!autor_id(nombre_completo), foros(curso_id, cursos(titulo))')
    .eq('id', id)
    .single()
}

export async function crearHilo(foroId, autorId, titulo, contenido) {
  return supabase
    .from('hilos_foro')
    .insert({ foro_id: foroId, autor_id: autorId, titulo, contenido })
    .select()
    .single()
}

export async function eliminarHilo(id) {
  return supabase.from('hilos_foro').delete().eq('id', id)
}

// ── Mensajes ──────────────────────────────────────────────────────────────────

export async function getMensajesByHilo(hiloId) {
  return supabase
    .from('mensajes_foro')
    .select('*, usuarios!autor_id(nombre_completo)')
    .eq('hilo_id', hiloId)
    .order('created_at', { ascending: true })
}

export async function crearMensaje(hiloId, autorId, contenido) {
  return supabase
    .from('mensajes_foro')
    .insert({ hilo_id: hiloId, autor_id: autorId, contenido })
    .select('*, usuarios!autor_id(nombre_completo)')
    .single()
}

export async function eliminarMensaje(id) {
  return supabase.from('mensajes_foro').delete().eq('id', id)
}

// ── Notificaciones ────────────────────────────────────────────────────────────

export async function getNotificaciones(usuarioId, limit = 15) {
  return supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function getUnreadCount(usuarioId) {
  return supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('leida', false)
}

export async function marcarLeida(id) {
  return supabase.from('notificaciones').update({ leida: true }).eq('id', id)
}

export async function marcarTodasLeidas(usuarioId) {
  return supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_id', usuarioId)
    .eq('leida', false)
}

// ── Stats para admin ──────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [usuarios, cursos, inscripciones] = await Promise.all([
    supabase.from('usuarios').select('*', { count: 'exact', head: true }),
    supabase.from('cursos').select('*', { count: 'exact', head: true }),
    supabase.from('inscripciones').select('*', { count: 'exact', head: true }).eq('estado', 'activa'),
  ])
  return {
    totalUsuarios: usuarios.count ?? 0,
    totalCursos: cursos.count ?? 0,
    totalInscripciones: inscripciones.count ?? 0,
  }
}

// Stats para docente: entregas sin calificar
export async function getEntregasPendientes(docenteId) {
  return supabase
    .from('entregas')
    .select('id, tareas!inner(unidades!inner(cursos!inner(docente_id)))')
    .is('calificacion', null)
    .eq('tareas.unidades.cursos.docente_id', docenteId)
}
