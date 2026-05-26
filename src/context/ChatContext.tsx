import { createContext, useContext, useState, useCallback, useRef, useEffect, type PropsWithChildren } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { ChatMessage, ChatMessageKind, MessageThread, SwapRequest, ConnectionRequest } from '@/types'
import { buildSwapThreadKey, buildConnectionThreadKey, parseThreadKey, createId } from '@/utils/app'
import { mapChatRecord, dbFetchChatMessages, dbInsertChatMessage, resolveThreadContext } from './chatUtils'

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
  swapRequests?: SwapRequest[]
  connectionRequests?: ConnectionRequest[]
  users?: Array<{ id: string }>
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
  const [messageThreads] = useState<MessageThread[]>(initialThreads)
  const stateRef = useRef({ messages, swapRequests, connectionRequests, currentUserId, users })

  useEffect(() => {
    stateRef.current = { messages, swapRequests, connectionRequests, currentUserId, users }
  }, [messages, swapRequests, connectionRequests, currentUserId, users])

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
    messageText: string,
    messageType: ChatMessageKind = 'text',
  ) => {
    if (!currentUserId || !messageText.trim() || !supabase) return

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
        content: messageText,
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

      return messages.filter((msg) => msg.threadId === threadContext.threadKey)
    },
    [messages, currentUserId]
  )

  const getMessagesForSwap = useCallback(
    (swapId: string) => {
      return messages.filter((msg) => msg.swapRequestId === swapId)
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
