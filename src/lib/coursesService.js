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

// Verificar si un estudiante tiene inscripción activa o pendiente
export async function checkInscripcion(cursoId, estudianteId) {
  return supabase
    .from('inscripciones')
    .select('id, estado')
    .eq('curso_id', cursoId)
    .eq('estudiante_id', estudianteId)
    .in('estado', ['activa', 'pendiente'])
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
