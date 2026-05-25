import { createContext, useContext, useState, useCallback, useRef, useEffect, type PropsWithChildren } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { ChatMessage, ChatMessageKind, MessageThread, AppState } from '@/types'
import { buildSwapThreadKey, buildConnectionThreadKey, parseThreadKey, buildMessageThreads, createId } from '@/utils/app'

// Helper functions extracted from AppContext
function mapChatRecord(record: Record<string, unknown>): ChatMessage {
  return {
    id: record.id as string,
    threadKey: record.thread_key as string,
    swapId: (record.swap_id as string | null) ?? undefined,
    connectionRequestId: (record.connection_request_id as string | null) ?? undefined,
    senderId: record.sender_id as string,
    content: record.content as string,
    kind: (record.kind as ChatMessageKind) ?? 'text',
    timestamp: record.created_at as string,
  }
}

async function dbFetchChatMessages(threadId: string): Promise<ChatMessage[]> {
  if (!supabase) return []
  const { data } = await supabase.from('messages').select('*').eq('thread_key', threadId)
  if (!data) return []
  return data.map((message) => mapChatRecord(message as Record<string, unknown>))
}

async function dbInsertChatMessage(input: {
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

function resolveThreadContext(
  state: { swapRequests: any[]; connectionRequests: any[]; currentUserId?: string | null; users: any[] },
  currentUserId: string,
  threadId: string,
) {
  const parsedThread = parseThreadKey(threadId)

  if (parsedThread?.kind === 'swap') {
    const swap = state.swapRequests.find((item) => item.id === parsedThread.sourceId)
    if (swap) {
      return {
        threadKey: buildSwapThreadKey(swap.id),
        partnerId: swap.senderId === currentUserId ? swap.receiverId : swap.senderId,
        swapId: swap.id,
        connectionRequestId: undefined,
      }
    }
  }

  if (parsedThread?.kind === 'connection') {
    const connection = state.connectionRequests.find((item) => item.id === parsedThread.sourceId)
    if (connection) {
      return {
        threadKey: buildConnectionThreadKey(connection.id),
        partnerId: connection.senderId === currentUserId ? connection.receiverId : connection.senderId,
        swapId: undefined,
        connectionRequestId: connection.id,
      }
    }
  }

  const swap = state.swapRequests.find((item) => item.id === threadId)
  if (swap) {
    return {
      threadKey: buildSwapThreadKey(swap.id),
      partnerId: swap.senderId === currentUserId ? swap.receiverId : swap.senderId,
      swapId: swap.id,
      connectionRequestId: undefined,
    }
  }

  const connection = state.connectionRequests.find((item) => item.id === threadId)
  if (connection) {
    return {
      threadKey: buildConnectionThreadKey(connection.id),
      partnerId: connection.senderId === currentUserId ? connection.receiverId : connection.senderId,
      swapId: undefined,
      connectionRequestId: connection.id,
    }
  }

  return null
}

interface ChatContextValue {
  messages: ChatMessage[]
  messageThreads: MessageThread[]
  sendChatMessage: (threadId: string, message: string, messageType?: ChatMessageKind) => Promise<void>
  subscribeToThreadMessages: (threadId: string) => () => void
  getMessagesForThread: (threadId: string) => ChatMessage[]
  getMessagesForSwap: (swapId: string) => ChatMessage[]
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

interface ChatProviderProps extends PropsWithChildren {
  messages?: ChatMessage[]
  messageThreads?: MessageThread[]
  currentUserId?: string | null
  swapRequests?: any[]
  connectionRequests?: any[]
  users?: any[]
}

export function ChatProvider({
  children,
  messages: initialMessages = [],
  messageThreads: initialThreads = [],
  currentUserId,
  swapRequests = [],
  connectionRequests = [],
  users = [],
}: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>(initialThreads)
  const stateRef = useRef({ messages, swapRequests, connectionRequests, currentUserId, users })

  useEffect(() => {
    stateRef.current = { messages, swapRequests, connectionRequests, currentUserId, users }
  }, [messages, swapRequests, connectionRequests, currentUserId, users])

  const updateMessageThreads = useCallback(() => {
    if (!currentUserId || messageThreads.length === 0) return
    // Message threads are computed from swap/connection requests in other contexts
    // For now, keep the initialized threads
  }, [currentUserId, messageThreads])

  useEffect(() => {
    updateMessageThreads()
  }, [updateMessageThreads])

  const loadChatMessages = useCallback(async (threadId: string) => {
    if (!supabase) return

    try {
      const chatMessages = await dbFetchChatMessages(threadId)
      setMessages((current) => {
        const existingMessageIds = new Set(current.map(m => m.id))
        const newMessages = chatMessages.filter(m => !existingMessageIds.has(m.id))

        return [...current, ...newMessages].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      })
    } catch (err) {
      console.error('Failed to load chat messages:', err)
    }
  }, [])

  const subscribeToThreadMessages = useCallback((threadId: string) => {
    if (!supabase || !threadId || !currentUserId) {
      return () => {}
    }

    const resolvedThreadKey =
      resolveThreadContext(
        stateRef.current,
        currentUserId,
        threadId,
      )?.threadKey ?? threadId

    void loadChatMessages(resolvedThreadKey)

    const channelName = `messages-thread-${resolvedThreadKey}`
    const channel = supabase.channel(channelName)

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_key=eq.${resolvedThreadKey}`,
      },
      (payload) => {
        try {
          const newMessage = mapChatRecord(payload.new as Record<string, unknown>)

          setMessages((current) => {
            const exists = current.some((message) => message.id === newMessage.id)
            if (exists) return current

            return [...current, newMessage].sort(
              (left, right) =>
                new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
            )
          })
        } catch (error) {
          console.error('[Chat] Failed to process new message:', error)
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `thread_key=eq.${resolvedThreadKey}`,
      },
      (payload) => {
        try {
          const updatedMessage = mapChatRecord(payload.new as Record<string, unknown>)

          setMessages((current) =>
            current.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg,
            )
          )
        } catch (error) {
          console.error('[Chat] Failed to process updated message:', error)
        }
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Successfully subscribed
      }
    })

    return () => {
      void channel.unsubscribe()
    }
  }, [currentUserId, loadChatMessages])

  const sendChatMessage = useCallback(async (
    threadId: string,
    message: string,
    messageType: ChatMessageKind = 'text',
  ) => {
    if (!currentUserId || !message.trim() || !supabase) return

    const threadContext = resolveThreadContext(stateRef.current, currentUserId, threadId)
    if (!threadContext) return

    const partner = stateRef.current.users.find((u) => u.id === threadContext.partnerId) ?? null
    if (!partner) return

    try {
      const savedMessage = await dbInsertChatMessage({
        threadKey: threadContext.threadKey,
        swapId: threadContext.swapId,
        connectionRequestId: threadContext.connectionRequestId,
        senderId: currentUserId,
        content: message,
        kind: messageType,
      })

      setMessages((current) => [...current, savedMessage])
      toast.success('Message sent.')
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message.')
    }
  }, [currentUserId])

  const getMessagesForThread = useCallback(
    (threadId: string) => {
      const threadContext = resolveThreadContext(stateRef.current, currentUserId ?? '', threadId)
      if (!threadContext) return []

      return messages.filter((msg) => msg.threadKey === threadContext.threadKey)
    },
    [messages, currentUserId]
  )

  const getMessagesForSwap = useCallback(
    (swapId: string) => {
      return messages.filter((msg) => msg.swapId === swapId)
    },
    [messages]
  )

  return (
    <ChatContext.Provider
      value={{
        messages,
        messageThreads,
        sendChatMessage,
        subscribeToThreadMessages,
        getMessagesForThread,
        getMessagesForSwap,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}

