import { supabase } from '@/lib/supabase'
import type { ChatMessage, ChatMessageKind, SwapRequest, ConnectionRequest } from '@/types'
import { buildSwapThreadKey, buildConnectionThreadKey, parseThreadKey, createId, cleanId } from '@/utils/app'

export function mapChatRecord(record: Record<string, unknown>): ChatMessage {
  const messageText =
    (record.message as string | undefined) ??
    (record.content as string | undefined) ??
    ''
  const kind =
    ((record.message_type ?? record.kind ?? record.type) as ChatMessageKind | undefined) ??
    'text'

  return {
    id: record.id as string,
    threadId: ((record.thread_key ?? record.threadId) as string) ?? '',
    swapRequestId: ((record.swap_id ?? record.swapRequestId) as string | null) ?? undefined,
    connectionRequestId: ((record.connection_request_id ?? record.connectionRequestId) as string | null) ?? undefined,
    senderId: (record.sender_id ?? record.senderId) as string,
    receiverId: ((record.receiver_id ?? record.receiverId) as string | null) ?? undefined,
    message: messageText,
    timestamp: (record.created_at ?? record.timestamp ?? new Date().toISOString()) as string,
    type: kind,
    message_type: kind,
  }
}

export async function dbFetchChatMessages(
  threadId: string,
  start = 0,
  end = 29
): Promise<ChatMessage[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_key', threadId)
    .order('created_at', { ascending: false })
    .range(start, end)
  if (!data) return []
  return data.map((message) => mapChatRecord(message as Record<string, unknown>)).reverse()
}

export async function dbInsertChatMessage(input: {
  threadKey: string
  swapId?: string
  connectionRequestId?: string
  senderId: string
  receiverId?: string
  content: string
  kind: ChatMessageKind
}): Promise<ChatMessage> {
  if (!supabase) throw new Error('Supabase not configured')

  const text = input.content.trim()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: cleanId(createId('message')),
      thread_key: input.threadKey,
      swap_id: input.swapId ?? null,
      connection_request_id: input.connectionRequestId ?? null,
      sender_id: input.senderId,
      receiver_id: input.receiverId ?? null,
      message: text,
      message_type: input.kind,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error('Failed to insert chat message: ' + (error?.message || 'Unknown error'))
  }

  return mapChatRecord(data as Record<string, unknown>)
}

export function resolveThreadContext(
  state: { swapRequests: SwapRequest[]; connectionRequests: ConnectionRequest[]; currentUserId?: string | null; users: Array<{ id: string }> },
  threadId: string,
) {
  const parsedThread = parseThreadKey(threadId)

  if (parsedThread?.kind === 'swap') {
    const swap = state.swapRequests.find((item) => item.id === parsedThread.sourceId)
    if (swap) {
      const partnerId = swap.senderId === state.currentUserId ? swap.receiverId : swap.senderId
      return {
        threadKey: buildSwapThreadKey(swap.id),
        swapId: swap.id,
        partnerId,
      }
    }
  } else if (parsedThread?.kind === 'connection') {
    const connection = state.connectionRequests.find((item) => item.id === parsedThread.sourceId)
    if (connection) {
      const partnerId = connection.senderId === state.currentUserId ? connection.receiverId : connection.senderId
      return {
        threadKey: buildConnectionThreadKey(connection.id),
        connectionRequestId: connection.id,
        partnerId,
      }
    }
  }

  return null
}
