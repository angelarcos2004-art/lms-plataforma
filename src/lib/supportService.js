import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────────────────────
// SOPORTE — Tickets / Chats (tablas: chats_soporte, mensajes_soporte)
// ─────────────────────────────────────────────────────────────────────────────

/** Obtiene los chats de soporte de un usuario específico */
export async function getMisChats(userId) {
  const { data, error } = await supabase
    .from('chats_soporte')
    .select('*, usuario:usuarios(nombre_completo)')
    .eq('usuario_id', userId)
    .order('updated_at', { ascending: false })
  return { data, error }
}

/** Obtiene todos los chats (para admin), docentes (alta) primero */
export async function getTodosLosChats() {
  const { data, error } = await supabase
    .from('chats_soporte')
    .select('*, usuario:usuarios(nombre_completo)')
    .order('prioridad', { ascending: true })   // 'alta' < 'normal' alfabéticamente → docentes primero
    .order('updated_at', { ascending: false })
  return { data, error }
}

/** Crea un ticket de soporte nuevo */
export async function crearChatSoporte(userId, asunto, prioridad = 'normal') {
  const { data, error } = await supabase
    .from('chats_soporte')
    .insert([{ usuario_id: userId, asunto, prioridad, estado: 'abierto' }])
    .select()
    .single()
  return { data, error }
}

/** Obtiene los mensajes de un chat de soporte */
export async function getMensajesChat(chatId) {
  const { data, error } = await supabase
    .from('mensajes_soporte')
    .select('*, autor:usuarios(nombre_completo)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
  return { data, error }
}

/** Envía un mensaje en un chat de soporte y actualiza updated_at del chat */
export async function enviarMensajeChat(chatId, autorId, contenido) {
  const { data, error } = await supabase
    .from('mensajes_soporte')
    .insert([{ chat_id: chatId, autor_id: autorId, contenido }])
    .select()
    .single()

  if (!error) {
    await supabase
      .from('chats_soporte')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)
  }

  return { data, error }
}

/** Cambia el estado de un chat (abierto / en_progreso / cerrado) */
export async function actualizarEstadoChat(chatId, estado) {
  const { data, error } = await supabase
    .from('chats_soporte')
    .update({ estado })
    .eq('id', chatId)
    .select()
    .single()
  return { data, error }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTES (tabla: reportes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un reporte contra un usuario desde el foro.
 */
export async function reportarUsuario(reportadoId, motivo) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Usuario no autenticado') }

  const { error } = await supabase
    .from('reportes')
    .insert([{
      reportador_id: user.id,
      reportado_id: reportadoId,
      motivo,
      estado: 'pendiente'
    }])

  return { data: null, error }
}

/**
 * Obtiene la lista de reportes para el panel de administración
 */
export async function getReportesParaAdmin() {
  const { data, error } = await supabase
    .from('reportes')
    .select(`
      id,
      motivo,
      estado,
      created_at,
      reportador:usuarios!reportes_reportador_id_fkey(id, nombre_completo, correo:email),
      reportado:usuarios!reportes_reportado_id_fkey(id, nombre_completo, correo:email)
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Marca un reporte como "revisado" o "pendiente"
 */
export async function actualizarEstadoReporte(reporteId, nuevoEstado) {
  const { data, error } = await supabase
    .from('reportes')
    .update({ estado: nuevoEstado })
    .eq('id', reporteId)
    .select()
    
  return { data, error }
}

/**
 * Elimina un reporte
 */
export async function eliminarReporte(reporteId) {
  const { error } = await supabase
    .from('reportes')
    .delete()
    .eq('id', reporteId)
    
  return { error }
}

/**
 * -------------------
 * CHAT DE STAFF (WhatsApp style)
 * -------------------
 */

export async function enviarMensajeStaff(userId, mensaje) {
  const { error } = await supabase
    .from('staff_chat')
    .insert([{ emisor_id: userId, mensaje }])

  return { error }
}

export async function limpiarChatStaff() {
  // Borra todos los mensajes del staff chat
  // REQUIERE política RLS: permitir DELETE a usuarios con rol 'administrador'
  const { error, count } = await supabase
    .from('staff_chat')
    .delete({ count: 'exact' })
    .gte('created_at', '2000-01-01') // condición siempre verdadera para borrar todo
  return { error, count }
}

export async function getMensajesStaff() {
  const { data, error } = await supabase
    .from('staff_chat')
    .select(`
      id,
      mensaje,
      created_at,
      emisor:usuarios!staff_chat_emisor_id_fkey(id, nombre_completo, roles(nombre))
    `)
    .order('created_at', { ascending: true })

  // Aplanamos el nombre del rol desde la relación anidada
  const mensajesMapeados = data?.map(m => ({
    id: m.id,
    mensaje: m.mensaje,
    created_at: m.created_at,
    emisor: {
      id: m.emisor?.id,
      nombre_completo: m.emisor?.nombre_completo,
      rol: m.emisor?.roles?.nombre
    }
  })) || []

  return { data: mensajesMapeados, error }
}
