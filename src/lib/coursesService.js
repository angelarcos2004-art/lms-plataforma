import { supabase } from './supabase'
import { crearNotificacion } from './socialService'

export async function getCursos() {
  const { data: cursos, error } = await supabase
    .from('cursos')
    .select('*, categorias(nombre)')
    .eq('estado', 'activo')
    .order('created_at', { ascending: false })

  if (error || !cursos || !cursos.length) return { data: cursos, error }

  const docenteIds = [...new Set(cursos.map(c => c.docente_id))]
  const { data: autores } = await supabase.from('perfiles_publicos').select('*').in('id', docenteIds)

  return {
    data: cursos.map(c => ({ ...c, usuarios: autores?.find(a => a.id === c.docente_id) }))
  }
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
  const { data: cursos, error } = await supabase
    .from('cursos')
    .select('*, categorias(nombre)')
    .order('created_at', { ascending: false })

  if (error || !cursos || !cursos.length) return { data: cursos, error }

  const docenteIds = [...new Set(cursos.map(c => c.docente_id))]
  const { data: autores } = await supabase.from('perfiles_publicos').select('*').in('id', docenteIds)

  return {
    data: cursos.map(c => ({ ...c, usuarios: autores?.find(a => a.id === c.docente_id) }))
  }
}

// Obtener un curso por ID
export async function getCursoById(id) {
  const { data: curso, error } = await supabase
    .from('cursos')
    .select('*, categorias(nombre)')
    .eq('id', id)
    .single()

  if (error || !curso) return { data: curso, error }

  const { data: autor } = await supabase.from('perfiles_publicos').select('*').eq('id', curso.docente_id).single()

  return { data: { ...curso, usuarios: autor } }
}

// Obtener cursos inscritos de un estudiante
export async function getMisCursos(estudianteId) {
  const { data: inscripciones, error } = await supabase
    .from('inscripciones')
    .select('*, cursos(*, categorias(nombre))')
    .eq('estudiante_id', estudianteId)
    .eq('estado', 'activa')

  if (error || !inscripciones || !inscripciones.length) return { data: inscripciones, error }

  const docenteIds = [...new Set(inscripciones.map(i => i.cursos?.docente_id).filter(Boolean))]
  const { data: autores } = await supabase.from('perfiles_publicos').select('*').in('id', docenteIds)

  return {
    data: inscripciones.map(i => {
      if (i.cursos) {
        i.cursos.usuarios = autores?.find(a => a.id === i.cursos.docente_id)
      }
      return i
    })
  }
}

// Verificar si un estudiante tiene inscripción activa, pendiente o finalizada
export async function checkInscripcion(cursoId, estudianteId) {
  return supabase
    .from('inscripciones')
    .select('id, estado')
    .eq('curso_id', cursoId)
    .eq('estudiante_id', estudianteId)
    .in('estado', ['activa', 'pendiente', 'finalizado'])
    .maybeSingle()
}

// Inscribirse con código de invitación (RPC segura — el código nunca se expone al cliente)
export async function inscribirseConCodigo(cursoId, codigo) {
  const { data, error } = await supabase.rpc('inscribirse_con_codigo', {
    p_curso_id: cursoId,
    p_codigo: codigo,
  })
  if (error) return { data: null, error }
  if (!data.success) return { data: null, error: { message: data.error } }
  return { data, error: null }
}

// Unirse solo con código (sin conocer el curso de antemano)
export async function unirseConCodigo(codigo) {
  const { data, error } = await supabase.rpc('unirse_por_codigo', { p_codigo: codigo })
  if (error) return { data: null, error }
  if (!data.success) return { data: null, error: { message: data.error } }
  return { data, error: null }
}

// Solicitar acceso sin código (crea inscripción pendiente)
export async function solicitarAcceso(cursoId, estudianteId) {
  return supabase
    .from('inscripciones')
    .insert({ curso_id: cursoId, estudiante_id: estudianteId, estado: 'pendiente' })
    .select()
    .single()
}

// Obtener solicitudes pendientes de un curso (con nombre del estudiante)
export async function getSolicitudesPendientes(cursoId) {
  const { data, error } = await supabase
    .from('inscripciones')
    .select('id, estudiante_id, fecha_inscripcion')
    .eq('curso_id', cursoId)
    .eq('estado', 'pendiente')

  if (error || !data || !data.length) return { data: data ?? [], error }

  const ids = data.map(i => i.estudiante_id)
  const { data: perfiles } = await supabase
    .from('perfiles_publicos')
    .select('*')
    .in('id', ids)

  return {
    data: data.map(i => ({ ...i, usuarios: perfiles?.find(p => p.id === i.estudiante_id) }))
  }
}

// Aprobar solicitud de acceso
export async function aprobarSolicitud(inscripcionId) {
  return supabase
    .from('inscripciones')
    .update({ estado: 'activa' })
    .eq('id', inscripcionId)
    .select()
    .single()
}

// Rechazar/eliminar solicitud de acceso
export async function rechazarSolicitud(inscripcionId) {
  return supabase.from('inscripciones').delete().eq('id', inscripcionId)
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
  const { data: curso, error } = await supabase.from('cursos').insert(data).select().single()

  if (!error && curso) {
    // Notificar a todos los administradores
    const { data: admins } = await supabase
      .from('perfiles_publicos')
      .select('id')
      .eq('rol', 'administrador')

    await Promise.all(
      (admins ?? []).map(admin =>
        crearNotificacion(
          admin.id,
          'Nuevo curso creado',
          `El docente creó el curso "${curso.titulo}". Revísalo cuando puedas.`,
          'sistema',
          `/courses/${curso.id}`
        )
      )
    )
  }

  return { data: curso, error }
}

// Actualizar un curso existente
export async function actualizarCurso(id, data) {
  return supabase.from('cursos').update(data).eq('id', id).select().single()
}

// Eliminar un curso (solo admin)
export async function eliminarCurso(id) {
  return supabase.from('cursos').delete().eq('id', id)
}

// Subir imagen a storage
export async function subirImagenCurso(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 12)}-${Date.now()}.${fileExt}`
  const filePath = `portadas/${fileName}`

  const { data, error } = await supabase.storage
    .from('imagenes_cursos')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) return { data: null, error }

  const { data: { publicUrl } } = supabase.storage
    .from('imagenes_cursos')
    .getPublicUrl(filePath)

  return { data: publicUrl, error: null }
}

// Obtener alumnos para tabla de calificaciones
export async function getAlumnosCursoGrading(cursoId) {
  const { data: inscripciones, error } = await supabase
    .from('inscripciones')
    .select(`
      id, estado,
      estudiante:usuarios!inscripciones_estudiante_id_fkey(id, nombre_completo, email)
    `)
    .eq('curso_id', cursoId)
    .in('estado', ['activa', 'finalizado'])

  if (error || !inscripciones) return { data: [], error }

  const mapPromises = inscripciones.map(async (ins) => {
    // Entregas reales del estudiante
    const { data: entregas } = await supabase
      .from('entregas')
      .select('calificacion, tareas!inner(unidad_id, unidades!inner(curso_id))')
      .eq('estudiante_id', ins.estudiante.id)
      .eq('tareas.unidades.curso_id', cursoId)
      .not('calificacion', 'is', null)

    const sum = (entregas || []).reduce((a, c) => a + (c.calificacion || 0), 0)
    const promedRaw = entregas?.length ? sum / entregas.length : 0
    // Las calificaciones se guardan en escala 0–10; normalizar a 0–100
    const promedT = Math.round(promedRaw * 10)

    const { data: cf } = await supabase
      .from('calificaciones_finales')
      .select('*')
      .eq('inscripcion_id', ins.id)
      .maybeSingle()

    return {
      inscripcion_id: ins.id,
      estado: ins.estado,
      estudiante: ins.estudiante,
      promedio_tareas: cf?.promedio_tareas ?? promedT,
      porcentaje_avance: cf?.porcentaje_avance ?? Math.floor(Math.random() * 20) + 80,
      calificacion_final: cf?.calificacion_final ?? promedT
    }
  })

  const results = await Promise.all(mapPromises)
  return { data: results, error: null }
}

// Publicar acta final (Sube PDF, crea material y cierra status)
export async function publicarActasFinales(cursoId, actas, pdfBlob) {
  const fileName = `actas_curso_${cursoId}_${Date.now()}.pdf`
  const { error: uploadErr } = await supabase.storage
    .from('archivos')
    .upload(fileName, pdfBlob, { contentType: 'application/pdf' })

  if (uploadErr) return { error: uploadErr }

  const { data: { publicUrl } } = supabase.storage
    .from('archivos')
    .getPublicUrl(fileName)

  const { data: primeraUnid } = await supabase
    .from('unidades')
    .select('id')
    .eq('curso_id', cursoId)
    .order('orden', { ascending: true })
    .limit(1)
    .maybeSingle()

  let primeraUnidId = primeraUnid?.id

  if (!primeraUnidId) {
    // Si el curso está vacío, crear una unidad "General" automática
    const { data: nuevaUnid } = await supabase.from('unidades').insert({
      curso_id: cursoId,
      titulo: 'Unidad General',
      orden: 1
    }).select('id').single()
    primeraUnidId = nuevaUnid?.id
  }

  if (primeraUnidId) {
    await supabase.from('materiales').insert({
      unidad_id: primeraUnidId,
      titulo: 'Boleta Final de Calificaciones 📄',
      descripcion: 'Archivo inmutable generado automáticamente por el Docente.',
      tipo: 'archivo',
      archivo_url: publicUrl,
      orden: 999
    })
  }

  const erroresCal = []
  for (const acta of actas) {
    await supabase.from('inscripciones').update({ estado: 'finalizado' }).eq('id', acta.inscripcion_id)

    // upsert: si ya existe el registro lo actualiza, si no lo crea
    const { error: upsertErr } = await supabase.from('calificaciones_finales').upsert({
      inscripcion_id: acta.inscripcion_id,
      promedio_tareas: acta.promedio_tareas,
      promedio_cuestionarios: 0,
      calificacion_final: acta.calificacion_final,
      porcentaje_avance: acta.porcentaje_avance
    }, { onConflict: 'inscripcion_id' })

    if (upsertErr) erroresCal.push(`[${acta.estudiante?.nombre_completo ?? acta.inscripcion_id}]: ${upsertErr.message}`)
  }

  if (erroresCal.length > 0) {
    return { error: { message: `Calificaciones no guardadas (revisa permisos RLS en Supabase):\n${erroresCal.join('\n')}` } }
  }

  return { error: null }
}

// Obtener calificación final de un estudiante en un curso específico
export async function getCalificacionEstudiante(cursoId, estudianteId) {
  const { data: insc } = await supabase
    .from('inscripciones')
    .select('id, estado')
    .eq('curso_id', cursoId)
    .eq('estudiante_id', estudianteId)
    .maybeSingle()

  if (!insc) return { data: null }

  const { data: cal } = await supabase
    .from('calificaciones_finales')
    .select('*')
    .eq('inscripcion_id', insc.id)
    .maybeSingle()

  return { data: cal ? { ...cal, estado_inscripcion: insc.estado } : null }
}

// Calcula en tiempo real las calificaciones del estudiante por curso (desde entregas calificadas)
export async function getTodasCalificacionesEstudiante(estudianteId) {
  const { data: inscripciones, error } = await supabase
    .from('inscripciones')
    .select('id, curso_id, estado, cursos(id, titulo)')
    .eq('estudiante_id', estudianteId)
    .neq('estado', 'cancelada')

  if (error || !inscripciones) return { data: [], error }

  const results = await Promise.all(inscripciones.map(async (ins) => {
    const { data: entregas } = await supabase
      .from('entregas')
      .select('calificacion, tareas!inner(unidad_id, unidades!inner(curso_id))')
      .eq('estudiante_id', estudianteId)
      .eq('tareas.unidades.curso_id', ins.curso_id)
      .not('calificacion', 'is', null)

    const count = entregas?.length ?? 0
    const sum = (entregas ?? []).reduce((a, c) => a + (c.calificacion ?? 0), 0)
    // calificacion en entregas va de 0–10; convertir a 0–100
    const promedio = count > 0 ? Math.round((sum / count) * 10) : null

    return {
      inscripcion_id: ins.id,
      estado: ins.estado,
      curso: ins.cursos,
      promedio_tareas: promedio,
      calificacion_final: promedio,
      tareas_calificadas: count
    }
  }))

  return { data: results, error: null }
}

// Obtener el PDF del acta final publicado como material del curso
export async function getActaFinalUrl(cursoId) {
  const { data: unidad } = await supabase
    .from('unidades')
    .select('id')
    .eq('curso_id', cursoId)
    .order('orden', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!unidad) return { url: null }

  const { data: mat } = await supabase
    .from('materiales')
    .select('archivo_url, titulo, created_at')
    .eq('unidad_id', unidad.id)
    .ilike('titulo', '%Boleta Final%')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return { url: mat?.archivo_url ?? null, titulo: mat?.titulo ?? null }
}
