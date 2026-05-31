import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ChatProvider, useChat } from '../ChatContext'
import type { ChatMessage } from '@/types'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(function() { return this }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/utils/app', () => ({
  buildSwapThreadKey: vi.fn((id) => `swap-${id}`),
  buildConnectionThreadKey: vi.fn((id) => `conn-${id}`),
  parseThreadKey: vi.fn((key) => {
    if (key.startsWith('swap-')) return { kind: 'swap', sourceId: key.replace('swap-', '') }
    return null
  }),
  createId: vi.fn((prefix) => `${prefix}-123`),
  cleanId: vi.fn((id) => id),
}))

const mockMessage: ChatMessage = {
  id: 'msg-1',
  threadId: 'swap-1-user-1-user-2',
  swapRequestId: 'swap-1',
  connectionRequestId: undefined,
  senderId: 'user-1',
  message: 'Hello there!',
  type: 'text',
  timestamp: new Date().toISOString(),
}

const mockSwap = {
  id: 'swap-1',
  senderId: 'user-1',
  receiverId: 'user-2',
  status: 'Completed',
}

describe('ChatContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when useChat is used outside provider', () => {
    expect(() => {
      renderHook(() => useChat())
    }).toThrow('useChat must be used within ChatProvider')
  })

  it('should provide empty messages array initially', () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider currentUserId="user-1">{children}</ChatProvider>
      ),
    })

    expect(result.current.messages).toEqual([])
  })

  it('should provide initial messages', () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider messages={[mockMessage]} currentUserId="user-1">
          {children}
        </ChatProvider>
      ),
    })

    expect(result.current.messages).toEqual([mockMessage])
    expect(result.current.messages.length).toBe(1)
  })

  it('should have sendChatMessage function', () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider currentUserId="user-1" users={[{ id: 'user-2' }]}>
          {children}
        </ChatProvider>
      ),
    })

    expect(typeof result.current.sendChatMessage).toBe('function')
  })

  it('should have subscribeToThreadMessages function', () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider currentUserId="user-1">{children}</ChatProvider>
      ),
    })

    expect(typeof result.current.subscribeToThreadMessages).toBe('function')
  })

  it('should return empty messages for non-existent thread', () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider messages={[mockMessage]} currentUserId="user-1">
          {children}
        </ChatProvider>
      ),
    })

    const threadMessages = result.current.getMessagesForThread('unknown-thread')
    expect(threadMessages).toEqual([])
  })

  it('should getMessagesForSwap returns messages for specific swap', () => {
    const messages = [
      mockMessage,
      { ...mockMessage, id: 'msg-2', swapRequestId: 'swap-2' },
      { ...mockMessage, id: 'msg-3', swapRequestId: 'swap-1' },
    ]

    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider messages={messages} currentUserId="user-1">
          {children}
        </ChatProvider>
      ),
    })

    const swapMessages = result.current.getMessagesForSwap('swap-1')
    expect(swapMessages.length).toBe(2)
    expect(swapMessages.every((m) => m.swapRequestId === 'swap-1')).toBe(true)
  })

  it('should return empty messages for swap with no messages', () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider messages={[mockMessage]} currentUserId="user-1">
          {children}
        </ChatProvider>
      ),
    })

    const swapMessages = result.current.getMessagesForSwap('unknown-swap')
    expect(swapMessages).toEqual([])
  })

  it('should provide empty messageThreads initially', () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider currentUserId="user-1" swapRequests={[mockSwap]}>
          {children}
        </ChatProvider>
      ),
    })

    expect(Array.isArray(result.current.messageThreads)).toBe(true)
  })

  it('should return unsubscribe function from subscribeToThreadMessages', () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider currentUserId="user-1" swapRequests={[mockSwap]}>
          {children}
        </ChatProvider>
      ),
    })

    const unsubscribe = result.current.subscribeToThreadMessages('swap-1')
    expect(typeof unsubscribe).toBe('function')
  })

  it('should handle messages without currentUserId', async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider currentUserId={null} users={[{ id: 'user-2' }]}>
          {children}
        </ChatProvider>
      ),
    })

    await act(async () => {
      await result.current.sendChatMessage('swap-1', 'Hello')
    })

    // Should not have added message since no currentUserId
    expect(result.current.messages.length).toBe(0)
  })

  it('should maintain message ordering by timestamp', () => {
    const now = new Date()
    const earlier = new Date(now.getTime() - 5000)

    const messages = [
      { ...mockMessage, id: 'msg-1', timestamp: earlier.toISOString() },
      { ...mockMessage, id: 'msg-2', timestamp: now.toISOString() },
    ]

    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider messages={messages} currentUserId="user-1">
          {children}
        </ChatProvider>
      ),
    })

    expect(result.current.messages[0].id).toBe('msg-1')
    expect(result.current.messages[1].id).toBe('msg-2')
  })

  it('should preserve message data integrity', () => {
    const testMessage: ChatMessage = {
      id: 'test-msg-1',
      threadId: 'test-thread-123',
      swapRequestId: 'swap-456',
      connectionRequestId: undefined,
      senderId: 'sender-789',
      message: 'Test content',
      type: 'text',
      timestamp: '2024-01-01T00:00:00Z',
    }

    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => (
        <ChatProvider messages={[testMessage]} currentUserId="user-1">
          {children}
        </ChatProvider>
      ),
    })

    const message = result.current.messages[0]
    expect(message.id).toBe('test-msg-1')
    expect(message.threadId).toBe('test-thread-123')
    expect(message.senderId).toBe('sender-789')
    expect(message.message).toBe('Test content')
  })
})
