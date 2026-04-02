import { supabase } from './supabase'

// ── Cuestionarios ─────────────────────────────────────────────────────────────

export async function getCuestionarioConPreguntas(id) {
  return supabase
    .from('cuestionarios')
    .select('*, preguntas(*, opciones_respuesta(*)), unidades(titulo, curso_id, cursos(titulo))')
    .eq('id', id)
    .single()
}

export async function crearCuestionario(data) {
  return supabase.from('cuestionarios').insert(data).select().single()
}

export async function actualizarCuestionario(id, data) {
  return supabase.from('cuestionarios').update(data).eq('id', id).select().single()
}

export async function eliminarCuestionario(id) {
  return supabase.from('cuestionarios').delete().eq('id', id)
}

// ── Preguntas ─────────────────────────────────────────────────────────────────

export async function crearPregunta(data) {
  return supabase.from('preguntas').insert(data).select().single()
}

export async function eliminarPregunta(id) {
  return supabase.from('preguntas').delete().eq('id', id)
}

// ── Opciones ──────────────────────────────────────────────────────────────────

export async function crearOpciones(opciones) {
  return supabase.from('opciones_respuesta').insert(opciones).select()
}

// ── Intentos ──────────────────────────────────────────────────────────────────

// Intento del estudiante (puede ser incompleto o completo)
export async function getIntentoEstudiante(quizId, estudianteId) {
  return supabase
    .from('intentos_cuestionario')
    .select('*, respuestas_estudiante(*)')
    .eq('cuestionario_id', quizId)
    .eq('estudiante_id', estudianteId)
    .maybeSingle()
}

// Todos los intentos completados de un cuestionario (para docente)
export async function getIntentosByQuiz(quizId) {
  return supabase
    .from('intentos_cuestionario')
    .select('*, usuarios!estudiante_id(nombre_completo, email)')
    .eq('cuestionario_id', quizId)
    .not('fecha_fin', 'is', null)
    .order('fecha_fin', { ascending: false })
}

// Intentos completados del estudiante para una lista de quizzes (para CourseContent)
export async function getMisIntentos(estudianteId, quizIds) {
  if (!quizIds.length) return { data: [], error: null }
  return supabase
    .from('intentos_cuestionario')
    .select('id, cuestionario_id, puntaje_obtenido, puntaje_maximo, fecha_fin')
    .eq('estudiante_id', estudianteId)
    .in('cuestionario_id', quizIds)
    .not('fecha_fin', 'is', null)
}

// Crear intento (marca fecha_inicio)
export async function crearIntento(quizId, estudianteId) {
  return supabase
    .from('intentos_cuestionario')
    .insert({ cuestionario_id: quizId, estudiante_id: estudianteId })
    .select()
    .single()
}

// Guardar respuestas y finalizar intento (auto-calificación client-side)
export async function submitIntento(intentoId, respuestasData, puntajeObtenido, puntajeMaximo) {
  if (respuestasData.length > 0) {
    const { error } = await supabase.from('respuestas_estudiante').insert(respuestasData)
    if (error) return { error }
  }
  return supabase
    .from('intentos_cuestionario')
    .update({
      fecha_fin: new Date().toISOString(),
      puntaje_obtenido: puntajeObtenido,
      puntaje_maximo: puntajeMaximo,
    })
    .eq('id', intentoId)
    .select()
    .single()
}
