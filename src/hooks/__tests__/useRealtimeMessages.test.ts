import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRealtimeMessages } from '../useRealtimeMessages'

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
  isSupabaseConfigured: true,
}))

describe('useRealtimeMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should setup subscription with channel', () => {
    const onNewMessage = vi.fn()
    const threadKey = 'swap_swap-123'

    renderHook(() =>
      useRealtimeMessages({
        threadKey,
        onNewMessage,
      })
    )

    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('should provide subscribe function', () => {
    const onNewMessage = vi.fn()
    const threadKey = 'swap_swap-123'

    const { result } = renderHook(() =>
      useRealtimeMessages({
        threadKey,
        onNewMessage,
      })
    )

    expect(typeof result.current.subscribe).toBe('function')
  })

  it('should provide unsubscribe function', () => {
    const onNewMessage = vi.fn()
    const threadKey = 'swap_swap-123'

    const { result } = renderHook(() =>
      useRealtimeMessages({
        threadKey,
        onNewMessage,
      })
    )

    expect(typeof result.current.unsubscribe).toBe('function')
  })

  it('should respect enabled flag', () => {
    const onNewMessage = vi.fn()
    const threadKey = 'swap_swap-123'
    vi.clearAllMocks()

    renderHook(() =>
      useRealtimeMessages({
        threadKey,
        onNewMessage,
        enabled: false,
      })
    )

    expect(mockChannel.on).not.toHaveBeenCalled()
  })

  it('should handle undefined threadKey', () => {
    const onNewMessage = vi.fn()
    vi.clearAllMocks()

    renderHook(() =>
      useRealtimeMessages({
        threadKey: '',
        onNewMessage,
      })
    )

    expect(mockChannel.on).not.toHaveBeenCalled()
  })

  it('should return subscription status', () => {
    const onNewMessage = vi.fn()
    const threadKey = 'swap_swap-123'

    const { result } = renderHook(() =>
      useRealtimeMessages({
        threadKey,
        onNewMessage,
      })
    )

    expect(typeof result.current.isSubscribed).toBe('boolean')
  })

  it('should accept onError callback option', () => {
    const onNewMessage = vi.fn()
    const onError = vi.fn()
    const threadKey = 'swap_swap-123'

    renderHook(() =>
      useRealtimeMessages({
        threadKey,
        onNewMessage,
        onError,
      })
    )

    expect(mockChannel.on).toHaveBeenCalled()
  })
})
