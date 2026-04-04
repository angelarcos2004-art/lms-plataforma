import { supabase } from './supabase'
import { crearNotificacion } from './socialService'

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

export async function crearTarea(unidadId, { titulo, instrucciones, fecha_limite, fecha_cierre, puntaje_maximo }) {
  return supabase
    .from('tareas')
    .insert({ unidad_id: unidadId, titulo, instrucciones, fecha_limite: fecha_limite || null, fecha_cierre: fecha_cierre || null, puntaje_maximo: puntaje_maximo || null })
    .select()
    .single()
}

export async function eliminarTarea(id) {
  return supabase.from('tareas').delete().eq('id', id)
}

export async function actualizarFechasTarea(id, fecha_limite, fecha_cierre) {
  return supabase
    .from('tareas')
    .update({ fecha_limite: fecha_limite || null, fecha_cierre: fecha_cierre || null })
    .eq('id', id)
    .select()
    .single()
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
  const { data: entrega, error } = await supabase
    .from('entregas')
    .insert({ tarea_id: tareaId, estudiante_id: estudianteId, contenido_entrega: contenido })
    .select()
    .single()

  if (error || !entrega) return { data: entrega, error }

  // Verificar si TODOS los alumnos inscritos ya entregaron
  const { data: tarea } = await supabase
    .from('tareas')
    .select('titulo, unidades(curso_id, cursos(titulo, docente_id))')
    .eq('id', tareaId)
    .single()

  if (tarea) {
    const cursoId = tarea.unidades?.curso_id
    const docenteId = tarea.unidades?.cursos?.docente_id
    const cursoTitulo = tarea.unidades?.cursos?.titulo

    if (cursoId && docenteId) {
      const [{ count: totalInscritos }, { count: totalEntregas }] = await Promise.all([
        supabase.from('inscripciones').select('*', { count: 'exact', head: true }).eq('curso_id', cursoId).eq('estado', 'activa'),
        supabase.from('entregas').select('*', { count: 'exact', head: true }).eq('tarea_id', tareaId),
      ])

      if (totalInscritos > 0 && totalEntregas >= totalInscritos) {
        await crearNotificacion(
          docenteId,
          `Todos entregaron: ${tarea.titulo}`,
          `Todos los alumnos de "${cursoTitulo}" han entregado esta tarea.`,
          'tarea',
          `/courses/${cursoId}/tareas/${tareaId}`
        )
      }
    }
  }

  return { data: entrega, error: null }
}

export async function actualizarEntrega(entregaId, contenido) {
  return supabase
    .from('entregas')
    .update({ contenido_entrega: contenido, fecha_entrega: new Date().toISOString() })
    .eq('id', entregaId)
    .select()
    .single()
}

export async function cancelarEntrega(entregaId) {
  return supabase.from('entregas').delete().eq('id', entregaId)
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

// ── Chat por tarea ────────────────────────────────────────────────────────────

export async function getMensajesTarea(tareaId) {
  const { data: msgs, error } = await supabase
    .from('mensajes_tarea')
    .select('id, tarea_id, autor_id, contenido, created_at')
    .eq('tarea_id', tareaId)
    .order('created_at', { ascending: true })

  if (error || !msgs?.length) return { data: msgs ?? [], error }

  const ids = [...new Set(msgs.map(m => m.autor_id))]
  const { data: perfiles } = await supabase
    .from('perfiles_publicos')
    .select('id, nombre_completo')
    .in('id', ids)

  return {
    data: msgs.map(m => ({ ...m, autor: perfiles?.find(p => p.id === m.autor_id) }))
  }
}

export async function enviarMensajeTarea(tareaId, autorId, contenido) {
  const { data: msg, error } = await supabase
    .from('mensajes_tarea')
    .insert({ tarea_id: tareaId, autor_id: autorId, contenido })
    .select()
    .single()

  if (error || !msg) return { data: null, error }

  // Determinar a quién notificar
  const { data: tarea } = await supabase
    .from('tareas')
    .select('titulo, unidades(curso_id, cursos(titulo, docente_id))')
    .eq('id', tareaId)
    .single()

  if (tarea) {
    const docenteId = tarea.unidades?.cursos?.docente_id
    const cursoId = tarea.unidades?.curso_id
    const cursoTitulo = tarea.unidades?.cursos?.titulo
    const url = `/courses/${cursoId}/tareas/${tareaId}`

    if (autorId === docenteId) {
      // Docente responde → notificar a los alumnos que entregaron
      const { data: entregas } = await supabase
        .from('entregas')
        .select('estudiante_id')
        .eq('tarea_id', tareaId)

      const estudianteIds = [...new Set(entregas?.map(e => e.estudiante_id) ?? [])]
      await Promise.all(
        estudianteIds.map(eId =>
          crearNotificacion(
            eId,
            `Respuesta del docente en: ${tarea.titulo}`,
            `El docente respondió en el chat de "${tarea.titulo}" de ${cursoTitulo}.`,
            'tarea',
            url
          )
        )
      )
    } else if (docenteId) {
      // Alumno escribe → notificar al docente
      await crearNotificacion(
        docenteId,
        `Nuevo mensaje en tarea: ${tarea.titulo}`,
        `Un alumno escribió en el chat de "${tarea.titulo}" de ${cursoTitulo}.`,
        'tarea',
        url
      )
    }
  }

  return { data: msg, error: null }
}

export async function calificarEntrega(entregaId, calificacion, retroalimentacion, calificadoPor) {
  const { data, error } = await supabase
    .from('entregas')
    .update({ calificacion, retroalimentacion, calificado_por: calificadoPor })
    .eq('id', entregaId)
    .select()
    .single()

  if (!error && data) {
    const { data: tarea } = await supabase
      .from('tareas')
      .select('titulo, puntaje_maximo, unidades(curso_id, cursos(titulo))')
      .eq('id', data.tarea_id)
      .single()

    if (tarea) {
      const ptsText = tarea.puntaje_maximo
        ? `${calificacion}/${tarea.puntaje_maximo} pts`
        : `${calificacion} pts`
      await crearNotificacion(
        data.estudiante_id,
        `Tarea calificada: ${tarea.titulo}`,
        `Obtuviste ${ptsText} en "${tarea.titulo}" de ${tarea.unidades?.cursos?.titulo}.`,
        'calificacion',
        `/courses/${tarea.unidades?.curso_id}/tareas/${data.tarea_id}`
      )
    }
  }

  return { data, error }
}

// ── Vista de Materiales (Progreso) ──────────────────────────────────────────

export async function marcarMaterialComoVisto(usuarioId, materialId) {
  const { error } = await supabase
    .from('materiales_vistos')
    .insert({ usuario_id: usuarioId, material_id: materialId })
    
  // Si ya existe (violación de UNIQUE Constraint), no es un problema real para nuestro uso
  if (error && error.code !== '23505') {
    return { error }
  }
  return { error: null }
}

export async function getProgresoCursoEstudiante(cursoId, estudianteId) {
  const { data: unidades } = await getUnidadesByCurso(cursoId)
  if (!unidades) return { avance: 0 }

  const materialIds = unidades.flatMap(u => (u.materiales ?? []).map(m => m.id))
  const tareaIds = unidades.flatMap(u => (u.tareas ?? []).map(t => t.id))
  const quizIds = unidades.flatMap(u => (u.cuestionarios ?? []).map(q => q.id))

  let vistosTotales = 0
  if (materialIds.length > 0) {
    const { data } = await supabase.from('materiales_vistos').select('id').eq('usuario_id', estudianteId).in('material_id', materialIds)
    vistosTotales = data?.length ?? 0
  }

  let entregasTotales = 0
  if (tareaIds.length > 0) {
    const { data } = await supabase.from('entregas').select('tarea_id').eq('estudiante_id', estudianteId).in('tarea_id', tareaIds)
    entregasTotales = new Set((data ?? []).map(d => d.tarea_id)).size
  }

  let quizzesTotales = 0
  if (quizIds.length > 0) {
    const { data } = await supabase.from('intentos_cuestionario').select('cuestionario_id').eq('estudiante_id', estudianteId).in('cuestionario_id', quizIds)
    quizzesTotales = new Set((data ?? []).map(d => d.cuestionario_id)).size
  }

  const sumaRealizados = vistosTotales + entregasTotales + quizzesTotales
  const sumaTotales = materialIds.length + tareaIds.length + quizIds.length
  
  if (sumaTotales === 0) return { avance: 0 }
  return { avance: Math.round((sumaRealizados / sumaTotales) * 100) }
}
