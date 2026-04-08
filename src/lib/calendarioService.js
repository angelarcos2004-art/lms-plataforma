import { supabase } from './supabase'

/**
 * Obtiene festivos de México desde Nager.at (API externa gratuita, sin auth)
 * Devuelve array de { date: 'YYYY-MM-DD', localName: string }
 */
export async function getFestivosNacionales(año) {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${año}/MX`)
  if (!res.ok) return []
  return await res.json()
}

/**
 * Obtiene tareas y cuestionarios con fechas límite para el calendario
 * Funciona tanto para estudiantes como docentes
 */
export async function getEventosCalendario(userId, rol) {
  let cursoIds = []

  if (rol === 'estudiante') {
    const { data: ins } = await supabase
      .from('inscripciones')
      .select('curso_id')
      .eq('estudiante_id', userId)
      .neq('estado', 'cancelada')
    cursoIds = (ins ?? []).map(i => i.curso_id)
  } else {
    // docente o admin
    const { data: cur } = await supabase
      .from('cursos')
      .select('id')
      .eq('docente_id', userId)
    cursoIds = (cur ?? []).map(c => c.id)
  }

  if (!cursoIds.length) return { tareas: [], quizzes: [], cursos: [] }

  const [{ data: tareas }, { data: quizzes }, { data: cursos }] = await Promise.all([
    supabase
      .from('tareas')
      .select('id, titulo, fecha_limite, unidades!inner(titulo, curso_id, cursos!inner(titulo))')
      .in('unidades.curso_id', cursoIds)
      .not('fecha_limite', 'is', null),
    supabase
      .from('cuestionarios')
      .select('id, titulo, fecha_limite, unidades!inner(titulo, curso_id, cursos!inner(titulo))')
      .in('unidades.curso_id', cursoIds)
      .not('fecha_limite', 'is', null),
    supabase
      .from('cursos')
      .select('id, titulo, fecha_inicio, fecha_fin')
      .in('id', cursoIds)
      .or('fecha_inicio.not.is.null,fecha_fin.not.is.null'),
  ])

  return {
    tareas: tareas ?? [],
    quizzes: quizzes ?? [],
    cursos: cursos ?? [],
  }
}
