import { supabase } from './supabase'

// ── Foros ─────────────────────────────────────────────────────────────────────

// Solo obtiene el foro del curso (sin crear)
export async function getForo(cursoId) {
  return supabase
    .from('foros')
    .select('*')
    .eq('curso_id', cursoId)
    .maybeSingle()
}

// Obtiene el foro del curso, lo crea si no existe (solo docente/admin)
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
  const { data: hilos, error } = await supabase
    .from('hilos_foro')
    .select('*, mensajes_foro(count)')
    .eq('foro_id', foroId)
    .order('created_at', { ascending: false })
  
  if (error || !hilos || !hilos.length) return { data: hilos, error }

  const autorIds = [...new Set(hilos.map(h => h.autor_id))]
  const { data: autores } = await supabase.from('perfiles_publicos').select('*').in('id', autorIds)
  
  return { 
    data: hilos.map(h => ({ ...h, usuarios: autores?.find(a => a.id === h.autor_id) }))
  }
}

export async function getHiloById(id) {
  const { data: hilo, error } = await supabase
    .from('hilos_foro')
    .select('*, foros(curso_id, cursos(titulo))')
    .eq('id', id)
    .single()

  if (error || !hilo) return { data: hilo, error }

  const { data: autor } = await supabase.from('perfiles_publicos').select('*').eq('id', hilo.autor_id).single()
  return { data: { ...hilo, usuarios: autor } }
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
  const { data: mensajes, error } = await supabase
    .from('mensajes_foro')
    .select('*')
    .eq('hilo_id', hiloId)
    .order('created_at', { ascending: true })

  if (error || !mensajes || !mensajes.length) return { data: mensajes, error }

  const autorIds = [...new Set(mensajes.map(m => m.autor_id))]
  const { data: autores } = await supabase.from('perfiles_publicos').select('*').in('id', autorIds)

  return {
    data: mensajes.map(m => ({ ...m, usuarios: autores?.find(a => a.id === m.autor_id) }))
  }
}

export async function crearMensaje(hiloId, autorId, contenido, respondeAId = null) {
  const { data: mensaje, error } = await supabase
    .from('mensajes_foro')
    .insert({ hilo_id: hiloId, autor_id: autorId, contenido, responde_a_id: respondeAId || null })
    .select()
    .single()

  if (error || !mensaje) return { data: null, error }

  const [{ data: autor }, { data: hilo }] = await Promise.all([
    supabase.from('perfiles_publicos').select('*').eq('id', autorId).single(),
    supabase.from('hilos_foro').select('titulo, foros(curso_id, cursos(titulo, docente_id))').eq('id', hiloId).single(),
  ])

  const notifPromises = []
  const notificados = new Set()

  // Notificar al autor original si le respondieron directamente
  if (respondeAId) {
    const { data: msgOriginal } = await supabase
      .from('mensajes_foro')
      .select('autor_id')
      .eq('id', respondeAId)
      .single()

    if (msgOriginal && msgOriginal.autor_id !== autorId && hilo) {
      notificados.add(msgOriginal.autor_id)
      notifPromises.push(
        crearNotificacion(
          msgOriginal.autor_id,
          `Te respondieron en el foro de ${hilo.foros?.cursos?.titulo}`,
          `Alguien respondió a tu comentario en el hilo "${hilo.titulo}".`,
          'foro',
          `/courses/${hilo.foros?.curso_id}/foro/${hiloId}`
        )
      )
    }
  }

  // Notificar al docente cuando alguien publica (evitar duplicado si ya fue notificado)
  if (hilo) {
    const docenteId = hilo.foros?.cursos?.docente_id
    const cursoId = hilo.foros?.curso_id
    const cursoTitulo = hilo.foros?.cursos?.titulo
    if (docenteId && docenteId !== autorId && !notificados.has(docenteId)) {
      notifPromises.push(
        crearNotificacion(
          docenteId,
          `Nuevo mensaje en el foro de ${cursoTitulo}`,
          `En el hilo "${hilo.titulo}" se publicó un nuevo mensaje.`,
          'foro',
          `/courses/${cursoId}/foro/${hiloId}`
        )
      )
    }
  }

  await Promise.all(notifPromises)

  return { data: { ...mensaje, usuarios: autor }, error: null }
}

export async function eliminarMensaje(id) {
  return supabase.from('mensajes_foro').delete().eq('id', id)
}

// ── Notificaciones ────────────────────────────────────────────────────────────

export async function crearNotificacion(usuarioId, titulo, mensaje, tipo = 'sistema', urlDestino = null) {
  return supabase
    .from('notificaciones')
    .insert({ usuario_id: usuarioId, titulo, mensaje, tipo, url_destino: urlDestino })
}

export async function getNotificaciones(usuarioId, limit = 15) {
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', usuarioId)
    .gte('created_at', hace7dias)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data, error }
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

export async function limpiarNotificaciones(usuarioId) {
  return supabase
    .from('notificaciones')
    .delete()
    .eq('usuario_id', usuarioId)
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
