import { supabase } from '@/lib/supabase'
import type { ChatMessage, ChatMessageKind, SwapRequest, ConnectionRequest } from '@/types'
import { buildSwapThreadKey, buildConnectionThreadKey, parseThreadKey, createId } from '@/utils/app'

export function mapChatRecord(record: Record<string, unknown>): ChatMessage {
  return {
    id: record.id as string,
    threadId: record.thread_key as string,
    swapRequestId: (record.swap_id as string | null) ?? undefined,
    connectionRequestId: (record.connection_request_id as string | null) ?? undefined,
    senderId: record.sender_id as string,
    message: record.content as string,
    timestamp: record.created_at as string,
    type: (record.kind as ChatMessageKind) ?? 'text',
  }
}

export async function dbFetchChatMessages(threadId: string): Promise<ChatMessage[]> {
  if (!supabase) return []
  const { data } = await supabase.from('messages').select('*').eq('thread_key', threadId)
  if (!data) return []
  return data.map((message) => mapChatRecord(message as Record<string, unknown>))
}

export async function dbInsertChatMessage(input: {
  threadKey: string
  swapId?: string
  connectionRequestId?: string
  senderId: string
  content: string
  kind: ChatMessageKind
}): Promise<ChatMessage> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: createId('message'),
      thread_key: input.threadKey,
      swap_id: input.swapId ?? null,
      connection_request_id: input.connectionRequestId ?? null,
      sender_id: input.senderId,
      content: input.content.trim(),
      kind: input.kind,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error('Failed to insert chat message')
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
      return {
        threadKey: buildSwapThreadKey(swap.id),
        swapId: swap.id,
        partnerId: swap.receiverId,
      }
    }
  } else if (parsedThread?.kind === 'connection') {
    const connection = state.connectionRequests.find((item) => item.id === parsedThread.sourceId)
    if (connection) {
      return {
        threadKey: buildConnectionThreadKey(connection.id),
        connectionRequestId: connection.id,
        partnerId: connection.receiverId,
      }
    }
  }

  return null
}
