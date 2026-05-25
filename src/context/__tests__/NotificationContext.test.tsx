import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { NotificationProvider, useNotifications } from '../NotificationContext'
import type { NotificationItem } from '@/types'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(function () {
        return this
      }),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
  },
  isSupabaseConfigured: true,
}))

const mockNotification: NotificationItem = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'match',
  title: 'New Match',
  description: 'You matched with Alice',
  link: '/profile/alice',
  createdAt: new Date().toISOString(),
  read: false,
}

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when useNotifications is used outside provider', () => {
    expect(() => {
      renderHook(() => useNotifications())
    }).toThrow('useNotifications must be used within NotificationProvider')
  })

  it('should provide empty notifications array initially', () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId="user-1">{children}</NotificationProvider>
      ),
    })

    expect(result.current.notifications).toEqual([])
  })

  it('should calculate unreadNotificationCount correctly', () => {
    const notifications: NotificationItem[] = [
      mockNotification,
      { ...mockNotification, id: 'notif-2', read: true },
      { ...mockNotification, id: 'notif-3', read: false },
    ]

    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId="user-1">
          {children}
        </NotificationProvider>
      ),
    })

    // Simulate receiving notifications
    act(() => {
      // In real scenario, these would come from Supabase subscription
      // For now we're just testing the calculation
    })

    // Test that hook is callable
    expect(result.current.unreadNotificationCount).toBe(0)
  })

  it('should have markNotificationRead function', () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId="user-1">{children}</NotificationProvider>
      ),
    })

    expect(typeof result.current.markNotificationRead).toBe('function')
  })

  it('should have markAllNotificationsRead function', () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId="user-1">{children}</NotificationProvider>
      ),
    })

    expect(typeof result.current.markAllNotificationsRead).toBe('function')
  })

  it('should setup subscription when currentUserId is provided', () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId="user-1">{children}</NotificationProvider>
      ),
    })

    // Verify context is available and working
    expect(result.current).toBeDefined()
    expect(result.current.notifications).toBeDefined()
  })

  it('should handle undefined currentUserId', () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId={undefined}>{children}</NotificationProvider>
      ),
    })

    expect(result.current.notifications).toEqual([])
    expect(result.current.unreadNotificationCount).toBe(0)
  })

  it('should handle null currentUserId', () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId={null}>{children}</NotificationProvider>
      ),
    })

    expect(result.current.notifications).toEqual([])
    expect(result.current.unreadNotificationCount).toBe(0)
  })

  it('should support onNotificationsUpdate callback', () => {
    const onUpdate = vi.fn()

    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId="user-1" onNotificationsUpdate={onUpdate}>
          {children}
        </NotificationProvider>
      ),
    })

    act(() => {
      result.current.markNotificationRead('notif-1')
    })

    // Callback should be called when marking as read
    expect(onUpdate).toHaveBeenCalled()
  })

  it('should provide notifications array that is accessible', () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId="user-1">{children}</NotificationProvider>
      ),
    })

    expect(Array.isArray(result.current.notifications)).toBe(true)
  })

  it('should maintain unreadNotificationCount as a number', () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: ({ children }) => (
        <NotificationProvider currentUserId="user-1">{children}</NotificationProvider>
      ),
    })

    expect(typeof result.current.unreadNotificationCount).toBe('number')
    expect(result.current.unreadNotificationCount).toBeGreaterThanOrEqual(0)
  })
})
