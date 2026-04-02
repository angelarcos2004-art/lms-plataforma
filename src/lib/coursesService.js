import { supabase } from './supabase'

// Obtener todos los cursos activos con categoría y docente
export async function getCursos() {
  return supabase
    .from('cursos')
    .select('*, categorias(nombre), usuarios!docente_id(nombre_completo)')
    .eq('estado', 'activo')
    .order('created_at', { ascending: false })
}

// Obtener cursos de un docente específico
export async function getCursosByDocente(docenteId) {
  return supabase
    .from('cursos')
    .select('*, categorias(nombre)')
    .eq('docente_id', docenteId)
    .order('created_at', { ascending: false })
}

// Obtener todos los cursos (solo admin)
export async function getTodosCursos() {
  return supabase
    .from('cursos')
    .select('*, categorias(nombre), usuarios!docente_id(nombre_completo)')
    .order('created_at', { ascending: false })
}

// Obtener un curso por ID
export async function getCursoById(id) {
  return supabase
    .from('cursos')
    .select('*, categorias(nombre), usuarios!docente_id(nombre_completo)')
    .eq('id', id)
    .single()
}

// Obtener cursos inscritos de un estudiante
export async function getMisCursos(estudianteId) {
  return supabase
    .from('inscripciones')
    .select('*, cursos(*, categorias(nombre), usuarios!docente_id(nombre_completo))')
    .eq('estudiante_id', estudianteId)
    .eq('estado', 'activa')
}

// Verificar si un estudiante ya está inscrito en un curso
export async function checkInscripcion(cursoId, estudianteId) {
  return supabase
    .from('inscripciones')
    .select('id')
    .eq('curso_id', cursoId)
    .eq('estudiante_id', estudianteId)
    .eq('estado', 'activa')
    .maybeSingle()
}

// Inscribirse a un curso
export async function inscribirse(cursoId, estudianteId) {
  return supabase
    .from('inscripciones')
    .insert({ curso_id: cursoId, estudiante_id: estudianteId })
    .select()
    .single()
}

// Cancelar inscripción
export async function desinscribirse(cursoId, estudianteId) {
  return supabase
    .from('inscripciones')
    .update({ estado: 'cancelada' })
    .eq('curso_id', cursoId)
    .eq('estudiante_id', estudianteId)
}

// Obtener todas las categorías
export async function getCategorias() {
  return supabase
    .from('categorias')
    .select('*')
    .order('nombre')
}

// Crear un nuevo curso
export async function crearCurso(data) {
  return supabase.from('cursos').insert(data).select().single()
}

// Actualizar un curso existente
export async function actualizarCurso(id, data) {
  return supabase.from('cursos').update(data).eq('id', id).select().single()
}
