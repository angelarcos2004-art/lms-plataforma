import { supabase } from './supabase'
import { crearNotificacion } from './socialService'

// ── Chats ─────────────────────────────────────────────────────────────────────

export async function getMisChats(userId) {
  return supabase
    .from('chats_soporte')
    .select('*')
    .eq('usuario_id', userId)
    .order('prioridad', { ascending: true })   // 'alta' < 'normal' → docentes primero
    .order('updated_at', { ascending: false })
}

export async function getTodosLosChats() {
  const { data: chats, error } = await supabase
    .from('chats_soporte')
    .select('*')
    .order('prioridad', { ascending: true })   // alta primero
    .order('updated_at', { ascending: false })

  if (error || !chats?.length) return { data: chats ?? [], error }

  const ids = [...new Set(chats.map(c => c.usuario_id))]
  const { data: perfiles } = await supabase
    .from('perfiles_publicos')
    .select('id, nombre_completo')
    .in('id', ids)

  return {
    data: chats.map(c => ({ ...c, usuario: perfiles?.find(p => p.id === c.usuario_id) }))
  }
}

export async function crearChatSoporte(userId, asunto, prioridad) {
  return supabase
    .from('chats_soporte')
    .insert({ usuario_id: userId, asunto, prioridad })
    .select()
    .single()
}

export async function actualizarEstadoChat(chatId, estado) {
  const { data, error } = await supabase
    .from('chats_soporte')
    .update({ estado })
    .eq('id', chatId)
    .select()
    .single()

  // Notificar al dueño del ticket cuando se cierra
  if (!error && data && estado === 'cerrado') {
    await crearNotificacion(
      data.usuario_id,
      'Tu solicitud de soporte fue cerrada',
      `La consulta "${data.asunto}" fue marcada como resuelta.`,
      'sistema',
      '/soporte'
    )
  }

  return { data, error }
}

// ── Mensajes ──────────────────────────────────────────────────────────────────

export async function getMensajesChat(chatId) {
  const { data: msgs, error } = await supabase
    .from('mensajes_soporte')
    .select('id, chat_id, autor_id, contenido, created_at')
    .eq('chat_id', chatId)
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

export async function enviarMensajeChat(chatId, autorId, contenido) {
  const { data: msg, error } = await supabase
    .from('mensajes_soporte')
    .insert({ chat_id: chatId, autor_id: autorId, contenido })
    .select()
    .single()

  if (error || !msg) return { data: null, error }

  // Notificar al dueño del ticket cuando el admin/soporte le responde
  const { data: chat } = await supabase
    .from('chats_soporte')
    .select('usuario_id, asunto')
    .eq('id', chatId)
    .single()

  if (chat && chat.usuario_id !== autorId) {
    await crearNotificacion(
      chat.usuario_id,
      'Nueva respuesta en tu solicitud de soporte',
      `Tu consulta "${chat.asunto}" recibió una respuesta.`,
      'sistema',
      '/soporte'
    )
  }

  return { data: msg, error: null }
}
