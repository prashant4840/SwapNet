import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { RequestProvider, useRequests } from '../RequestContext'
import type { SwapRequest, ConnectionRequest } from '@/types'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'swap-1',
              sender_id: 'user-1',
              receiver_id: 'user-2',
              message: 'Let me help you',
              status: 'Pending',
              offered_skill_id: 'skill-1',
              wanted_skill_id: 'skill-2',
              completed_by: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({}),
    },
  },
  isSupabaseConfigured: true,
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/utils/app', () => ({
  createId: vi.fn((prefix) => `${prefix}-123`),
}))

const mockSwap: SwapRequest = {
  id: 'swap-1',
  senderId: 'user-1',
  receiverId: 'user-2',
  message: 'Let me help you learn React',
  status: 'Pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  offeredSkillId: 'skill-1',
  wantedSkillId: 'skill-2',
  completedBy: [],
}

const mockConnection: ConnectionRequest = {
  id: 'conn-1',
  senderId: 'user-1',
  receiverId: 'user-2',
  message: 'Let\'s connect!',
  status: 'Pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockUser = {
  id: 'user-2',
  name: 'Bob',
  email: 'bob@example.com',
}

const mockCurrentUser = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  skillsOffered: [{ id: 'skill-1', name: 'React' }],
  skillsWanted: [{ id: 'skill-2', name: 'Python' }],
}

describe('RequestContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when useRequests is used outside provider', () => {
    expect(() => {
      renderHook(() => useRequests())
    }).toThrow('useRequests must be used within RequestProvider')
  })

  it('should provide empty swapRequests array initially', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider currentUserId="user-1">{children}</RequestProvider>
      ),
    })

    expect(result.current.swapRequests).toEqual([])
  })

  it('should provide initial swapRequests', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider swapRequests={[mockSwap]} currentUserId="user-1">
          {children}
        </RequestProvider>
      ),
    })

    expect(result.current.swapRequests).toEqual([mockSwap])
    expect(result.current.swapRequests.length).toBe(1)
  })

  it('should provide empty connectionRequests array initially', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider currentUserId="user-1">{children}</RequestProvider>
      ),
    })

    expect(result.current.connectionRequests).toEqual([])
  })

  it('should provide initial connectionRequests', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider connectionRequests={[mockConnection]} currentUserId="user-1">
          {children}
        </RequestProvider>
      ),
    })

    expect(result.current.connectionRequests).toEqual([mockConnection])
  })

  it('should have sendSwapRequest function', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider currentUserId="user-1" currentUser={mockCurrentUser}>
          {children}
        </RequestProvider>
      ),
    })

    expect(typeof result.current.sendSwapRequest).toBe('function')
  })

  it('should have sendConnectionRequest function', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider currentUserId="user-1" currentUser={mockCurrentUser}>
          {children}
        </RequestProvider>
      ),
    })

    expect(typeof result.current.sendConnectionRequest).toBe('function')
  })

  it('should have respondToSwapRequest function', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider currentUserId="user-1">{children}</RequestProvider>
      ),
    })

    expect(typeof result.current.respondToSwapRequest).toBe('function')
  })

  it('should have respondToConnectionRequest function', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider currentUserId="user-1">{children}</RequestProvider>
      ),
    })

    expect(typeof result.current.respondToConnectionRequest).toBe('function')
  })

  it('should have completeSwap function', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider currentUserId="user-1">{children}</RequestProvider>
      ),
    })

    expect(typeof result.current.completeSwap).toBe('function')
  })

  it('should return false when sending swap without currentUser', async () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider currentUserId={null} currentUser={null} users={[mockUser]}>
          {children}
        </RequestProvider>
      ),
    })

    let sendResult
    await act(async () => {
      sendResult = await result.current.sendSwapRequest({
        receiverId: 'user-2',
        message: 'Let me help',
        offeredSkillId: 'skill-1',
        wantedSkillId: 'skill-2',
      })
    })

    expect(sendResult).toBe(false)
  })

  it('should getSwapById returns swap by id', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider swapRequests={[mockSwap]} currentUserId="user-1">
          {children}
        </RequestProvider>
      ),
    })

    const swap = result.current.getSwapById('swap-1')
    expect(swap).toEqual(mockSwap)
  })

  it('should getSwapById returns null for unknown swap', () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider swapRequests={[mockSwap]} currentUserId="user-1">
          {children}
        </RequestProvider>
      ),
    })

    const swap = result.current.getSwapById('unknown-swap')
    expect(swap).toBeNull()
  })

  it('should maintain request data integrity for swaps', () => {
    const testSwap: SwapRequest = {
      id: 'swap-test-123',
      senderId: 'sender-456',
      receiverId: 'receiver-789',
      message: 'Test message',
      status: 'Accepted',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      offeredSkillId: 'skill-abc',
      wantedSkillId: 'skill-def',
      completedBy: ['user-1'],
    }

    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider swapRequests={[testSwap]} currentUserId="user-1">
          {children}
        </RequestProvider>
      ),
    })

    const swap = result.current.swapRequests[0]
    expect(swap.id).toBe('swap-test-123')
    expect(swap.status).toBe('Accepted')
    expect(swap.completedBy).toContain('user-1')
  })

  it('should maintain request data integrity for connections', () => {
    const testConnection: ConnectionRequest = {
      id: 'conn-test-123',
      senderId: 'sender-456',
      receiverId: 'receiver-789',
      message: 'Connection test',
      status: 'Pending',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider connectionRequests={[testConnection]} currentUserId="user-1">
          {children}
        </RequestProvider>
      ),
    })

    const conn = result.current.connectionRequests[0]
    expect(conn.id).toBe('conn-test-123')
    expect(conn.senderId).toBe('sender-456')
    expect(conn.message).toBe('Connection test')
  })

  it('should handle multiple swap requests', () => {
    const swaps = [mockSwap, { ...mockSwap, id: 'swap-2' }, { ...mockSwap, id: 'swap-3' }]

    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider swapRequests={swaps} currentUserId="user-1">
          {children}
        </RequestProvider>
      ),
    })

    expect(result.current.swapRequests.length).toBe(3)
  })

  it('should handle multiple connection requests', () => {
    const connections = [
      mockConnection,
      { ...mockConnection, id: 'conn-2' },
      { ...mockConnection, id: 'conn-3' },
    ]

    const { result } = renderHook(() => useRequests(), {
      wrapper: ({ children }) => (
        <RequestProvider connectionRequests={connections} currentUserId="user-1">
          {children}
        </RequestProvider>
      ),
    })

    expect(result.current.connectionRequests.length).toBe(3)
  })
})
