import { supabase } from './supabase'

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
  return supabase
    .from('chats_soporte')
    .update({ estado })
    .eq('id', chatId)
    .select()
    .single()
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
  return supabase
    .from('mensajes_soporte')
    .insert({ chat_id: chatId, autor_id: autorId, contenido })
    .select()
    .single()
}
