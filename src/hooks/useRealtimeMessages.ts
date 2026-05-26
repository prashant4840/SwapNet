import { useCallback, useRef, useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ChatMessage, ChatMessageKind } from '@/types'
import { buildSwapThreadKey, buildConnectionThreadKey } from '@/utils/app'

interface UseRealtimeMessagesOptions {
  threadKey: string
  onNewMessage: (message: ChatMessage) => void
  onError?: (error: Error) => void
  enabled?: boolean
}

/**
 * Hook to manage realtime message subscriptions
 * Handles connection, cleanup, and error recovery
 */
export function useRealtimeMessages({
  threadKey,
  onNewMessage,
  onError,
  enabled = true,
}: UseRealtimeMessagesOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Subscribe to realtime message updates
  const subscribe = useCallback(() => {
    if (!enabled || !isSupabaseConfigured || !supabase || !threadKey) {
      return
    }

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current) {
      return
    }

    try {
      const channelName = `messages-${threadKey}`

      // Create new channel
      const channel = supabase.channel(channelName)

      // Listen for new messages (INSERT events)
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_key=eq.${threadKey}`,
        },
        (payload) => {
          try {
            const newMessage = payload.new as Record<string, unknown>
            if (newMessage && newMessage.id) {
              onNewMessage(mapChatRecord(newMessage))
            }
          } catch (error) {
            console.error('[Realtime] Error processing new message:', error)
            onError?.(error instanceof Error ? error : new Error('Failed to process message'))
          }
        },
      )

      // Listen for message updates (edited messages)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `thread_key=eq.${threadKey}`,
        },
        (payload) => {
          try {
            const updatedMessage = payload.new as Record<string, unknown>
            if (updatedMessage && updatedMessage.id) {
              onNewMessage(mapChatRecord(updatedMessage))
            }
          } catch (error) {
            console.error('[Realtime] Error processing updated message:', error)
          }
        },
      )

      // Subscribe to the channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Connected to thread: ${threadKey}`)
          isSubscribedRef.current = true
          setIsSubscribed(true)
        } else if (status === 'CLOSED') {
          console.log(`[Realtime] Disconnected from thread: ${threadKey}`)
          isSubscribedRef.current = false
          setIsSubscribed(false)
        }
      })

      channelRef.current = channel
      subscriptionRef.current = channel
    } catch (error) {
      console.error('[Realtime] Failed to setup subscription:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to setup subscription'))
      isSubscribedRef.current = false
      setIsSubscribed(false)
    }
  }, [threadKey, enabled, onNewMessage, onError])

  // Unsubscribe from realtime updates
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase?.removeChannel(channelRef.current)
      channelRef.current = null
      subscriptionRef.current = null
      isSubscribedRef.current = false
      setIsSubscribed(false)
      console.log(`[Realtime] Unsubscribed from thread: ${threadKey}`)
    }
  }, [threadKey])

  // Auto-subscribe when hook mounts
  useEffect(() => {
    subscribe()

    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe])

  return {
    subscribe,
    unsubscribe,
    isSubscribed,
  }
}

/**
 * Map Supabase chat record to ChatMessage type
 */
function mapChatRecord(record: Record<string, unknown>): ChatMessage {
  const swapRequestId = record.swap_id as string | undefined
  const connectionRequestId = record.connection_request_id as string | undefined

  // Build thread ID from various sources
  const threadId =
    (record.thread_key as string | undefined) ??
    (connectionRequestId ? buildConnectionThreadKey(connectionRequestId) : undefined) ??
    (swapRequestId ? buildSwapThreadKey(swapRequestId) : undefined) ??
    ''

  return {
    id: record.id as string,
    threadId,
    swapRequestId,
    connectionRequestId,
    senderId: record.sender_id as string,
    receiverId: (record.receiver_id as string | undefined) ?? undefined,
    message: record.message as string,
    timestamp: record.created_at as string,
    message_type:
      (record.message_type as ChatMessageKind) ??
      (record.type as ChatMessageKind) ??
      'text',
  }
}

