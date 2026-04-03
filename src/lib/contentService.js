import { supabase } from './supabase'

// ── Unidades ────────────────────────────────────────────────────────────────

export async function getUnidadesByCurso(cursoId) {
  return supabase
    .from('unidades')
    .select('*, materiales(*), tareas(*), cuestionarios(*)')
    .eq('curso_id', cursoId)
    .order('orden')
}

export async function crearUnidad(cursoId, titulo, descripcion = null) {
  // Calcular el siguiente orden
  const { count } = await supabase
    .from('unidades')
    .select('*', { count: 'exact', head: true })
    .eq('curso_id', cursoId)

  return supabase
    .from('unidades')
    .insert({ curso_id: cursoId, titulo, descripcion, orden: (count ?? 0) + 1 })
    .select()
    .single()
}

export async function actualizarUnidad(id, data) {
  return supabase.from('unidades').update(data).eq('id', id).select().single()
}

export async function eliminarUnidad(id) {
  return supabase.from('unidades').delete().eq('id', id)
}

// ── Materiales ───────────────────────────────────────────────────────────────

export async function crearMaterial(unidadId, { titulo, tipo, contenido }) {
  const { count } = await supabase
    .from('materiales')
    .select('*', { count: 'exact', head: true })
    .eq('unidad_id', unidadId)

  return supabase
    .from('materiales')
    .insert({ unidad_id: unidadId, titulo, tipo, contenido, orden: (count ?? 0) + 1 })
    .select()
    .single()
}

export async function eliminarMaterial(id) {
  return supabase.from('materiales').delete().eq('id', id)
}

// ── Tareas ───────────────────────────────────────────────────────────────────

export async function getTareaById(id) {
  return supabase
    .from('tareas')
    .select('*, unidades(titulo, curso_id, cursos(titulo))')
    .eq('id', id)
    .single()
}

export async function crearTarea(unidadId, { titulo, instrucciones, fecha_limite, puntaje_maximo }) {
  return supabase
    .from('tareas')
    .insert({ unidad_id: unidadId, titulo, instrucciones, fecha_limite: fecha_limite || null, puntaje_maximo: puntaje_maximo || null })
    .select()
    .single()
}

export async function eliminarTarea(id) {
  return supabase.from('tareas').delete().eq('id', id)
}

export async function actualizarFechaTarea(id, fecha_limite) {
  return supabase.from('tareas').update({ fecha_limite: fecha_limite || null }).eq('id', id).select().single()
}

// ── Entregas ─────────────────────────────────────────────────────────────────

export async function getEntregaByEstudiante(tareaId, estudianteId) {
  return supabase
    .from('entregas')
    .select('*')
    .eq('tarea_id', tareaId)
    .eq('estudiante_id', estudianteId)
    .maybeSingle()
}

export async function getEntregasByTarea(tareaId) {
  const { data: entregas, error } = await supabase
    .from('entregas')
    .select('id, tarea_id, estudiante_id, contenido_entrega, fecha_entrega, calificacion, retroalimentacion, calificado_por')
    .eq('tarea_id', tareaId)
    .order('fecha_entrega', { ascending: false })

  if (error || !entregas?.length) return { data: entregas ?? [], error }

  const ids = [...new Set(entregas.map(e => e.estudiante_id))]
  const { data: perfiles } = await supabase.from('perfiles_publicos').select('id, nombre_completo').in('id', ids)

  return {
    data: entregas.map(e => ({ ...e, usuarios: perfiles?.find(p => p.id === e.estudiante_id) }))
  }
}

export async function getMisEntregas(estudianteId, tareaIds) {
  if (!tareaIds.length) return { data: [], error: null }
  return supabase
    .from('entregas')
    .select('id, tarea_id, calificacion, fecha_entrega')
    .eq('estudiante_id', estudianteId)
    .in('tarea_id', tareaIds)
}

export async function crearEntrega(tareaId, estudianteId, contenido) {
  return supabase
    .from('entregas')
    .insert({ tarea_id: tareaId, estudiante_id: estudianteId, contenido_entrega: contenido })
    .select()
    .single()
}

// Subir archivo a storage (materiales o entregas)
export async function subirArchivo(file, carpeta = 'materiales') {
  const fileExt = file.name.split('.').pop().toLowerCase()
  const fileName = `${Math.random().toString(36).substring(2, 12)}-${Date.now()}.${fileExt}`
  const filePath = `${carpeta}/${fileName}`

  const { error } = await supabase.storage
    .from('archivos')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) return { data: null, error }

  const { data: { publicUrl } } = supabase.storage.from('archivos').getPublicUrl(filePath)
  return { data: publicUrl, error: null }
}

export async function calificarEntrega(entregaId, calificacion, retroalimentacion, calificadoPor) {
  return supabase
    .from('entregas')
    .update({ calificacion, retroalimentacion, calificado_por: calificadoPor })
    .eq('id', entregaId)
    .select()
    .single()
}
