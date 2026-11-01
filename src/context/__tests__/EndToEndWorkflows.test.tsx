/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AppProvider, useApp } from '../AppContext'
import type { UserProfile, SwapRequest, NotificationItem } from '@/types'

// Mock Supabase with responsive mock data
const mockDb = {
  users: [] as any[],
  swap_requests: [] as any[],
  messages: [] as any[],
  posts: [] as any[],
  notifications: [] as any[],
  reviews: [] as any[],
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signUp: vi.fn().mockResolvedValue({
        data: {
          user: { id: 'user-new-123', email: 'newuser@example.com' },
          session: null,
        },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-a-111',
            email: 'user-a@swapnet.app',
            user_metadata: { name: 'User A' },
          },
          session: { access_token: 'fake-token' },
        },
        error: null,
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from: vi.fn((table: string) => {
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        or: vi.fn(() => builder),
        order: vi.fn(() => builder),
        range: vi.fn().mockResolvedValue({ data: mockDb[table as keyof typeof mockDb] || [], error: null }),
        single: vi.fn().mockResolvedValue({ data: (mockDb[table as keyof typeof mockDb] || [])[0] || null, error: null }),
        upsert: vi.fn((data: any) => {
          return Promise.resolve({ data, error: null })
        }),
        insert: vi.fn((data: any) => {
          const row = Array.isArray(data) ? data[0] : data
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { ...row, id: row.id || 'gen-id-123' }, error: null }),
            }),
            data: row,
            error: null,
          }
        }),
        update: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        then: (resolve: any) => resolve({ data: mockDb[table as keyof typeof mockDb] || [], count: 0, error: null }),
      }
      return builder
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
  isSupabaseConfigured: true,
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  useToasterStore: vi.fn(() => ({ toasts: [] })),
}))

const mockUserA: UserProfile = {
  id: 'user-a-111',
  username: 'user-a',
  name: 'User A',
  email: 'user-a@swapnet.app',
  photo: 'https://api.dicebear.com/9.x/shapes/svg?seed=user-a',
  city: 'Mumbai',
  bio: 'Full-stack developer',
  headline: 'Teaches TypeScript, wants UI design',
  mode: 'Online',
  rating: 5,
  reviewCount: 3,
  completedSwaps: 2,
  swapScore: 95,
  taughtCount: 2,
  learnedCount: 2,
  badges: [],
  reports: 0,
  skillsOffered: [{ id: 'skill-ts-1', name: 'TypeScript', category: 'Tech', level: 'Advanced' }],
  skillsWanted: [{ id: 'skill-ui-1', name: 'Figma', category: 'Creative' }],
  availability: ['Weekdays'],
  joinedAt: '2026-01-01T00:00:00Z',
  lastActiveAt: '2026-01-01T00:00:00Z',
}

const mockUserB: UserProfile = {
  id: 'user-b-222',
  username: 'user-b',
  name: 'User B',
  email: 'user-b@swapnet.app',
  photo: 'https://api.dicebear.com/9.x/shapes/svg?seed=user-b',
  city: 'Bengaluru',
  bio: 'Product Designer',
  headline: 'Teaches Figma, wants TypeScript',
  mode: 'Online',
  rating: 4.9,
  reviewCount: 5,
  completedSwaps: 4,
  swapScore: 98,
  taughtCount: 4,
  learnedCount: 3,
  badges: [],
  reports: 0,
  skillsOffered: [{ id: 'skill-fig-2', name: 'Figma', category: 'Creative', level: 'Advanced' }],
  skillsWanted: [{ id: 'skill-ts-2', name: 'TypeScript', category: 'Tech' }],
  availability: ['Evenings'],
  joinedAt: '2026-01-02T00:00:00Z',
  lastActiveAt: '2026-01-02T00:00:00Z',
}

describe('Phase 4: End-to-End Workflows & User Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.users = []
    mockDb.swap_requests = []
    mockDb.messages = []
    mockDb.posts = []
    mockDb.notifications = []
    mockDb.reviews = []
  })

  // Scenario 1: New user registers using email
  it('Scenario 1: New user registers using email with proper redirect and metadata', async () => {
    const { supabase } = await import('@/lib/supabase')
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    let res: any
    await act(async () => {
      res = await result.current.signUp({
        name: 'New Developer',
        email: 'newdev@swapnet.app',
        city: 'Delhi',
        password: 'Password123!',
      })
    })

    expect(res.success).toBe(true)
    expect(supabase?.auth.signUp).toHaveBeenCalledWith({
      email: 'newdev@swapnet.app',
      password: 'Password123!',
      options: {
        emailRedirectTo: expect.stringContaining('/dashboard'),
        data: {
          city: 'Delhi',
          full_name: 'New Developer',
          name: 'New Developer',
          avatar_url: expect.stringContaining('api.dicebear.com'),
        },
      },
    })
  })

  // Scenario 2: New user registers using Google
  it('Scenario 2: New user registers using Google with offline consent and dashboard redirect', async () => {
    const { supabase } = await import('@/lib/supabase')
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    let res: any
    await act(async () => {
      res = await result.current.loginWithGoogle('/dashboard')
    })

    expect(res.success).toBe(true)
    expect(supabase?.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/dashboard'),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  })

  // Scenario 3: Existing user logs in
  it('Scenario 3: Existing user logs in with credentials', async () => {
    const { supabase } = await import('@/lib/supabase')
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    let res: any
    await act(async () => {
      res = await result.current.login({
        email: 'user-a@swapnet.app',
        password: 'password123',
      })
    })

    expect(res.success).toBe(true)
    expect(supabase?.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user-a@swapnet.app',
      password: 'password123',
    })
  })

  // Scenario 4: User refreshes the page and remains authenticated
  it('Scenario 4: User session rehydrates after page refresh', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'valid-token',
          user: {
            id: 'user-a-111',
            email: 'user-a@swapnet.app',
            user_metadata: { name: 'User A', city: 'Mumbai' },
          },
        } as any,
      },
      error: null,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.currentUser?.id).toBe('user-a-111')
    expect(result.current.currentUser?.name).toBe('User A')
  })

  // Scenario 5: User updates their profile
  it('Scenario 5: User updates their profile information and skills', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'user-a-111', email: 'user-a@swapnet.app' },
        } as any,
      },
      error: null,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    await waitFor(() => {
      expect(result.current.currentUser?.id).toBe('user-a-111')
    })

    await act(async () => {
      await result.current.updateProfile({
        name: 'User A Updated',
        city: 'Pune',
        bio: 'Updated bio',
        headline: 'Senior Engineer',
        mode: 'Both',
        availability: ['Weekdays', 'Weekends'],
        skillsOffered: [{ id: 'skill-ts-1', name: 'TypeScript', category: 'Tech', level: 'Advanced' }],
        skillsWanted: [{ id: 'skill-ui-1', name: 'Figma', category: 'Creative' }],
      })
    })

    expect(supabase?.from).toHaveBeenCalledWith('users')
    expect(result.current.currentUser?.name).toBe('User A Updated')
    expect(result.current.currentUser?.city).toBe('Pune')
  })

  // Scenario 6: User logs out
  it('Scenario 6: User logs out and session state is cleared immediately', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'user-a-111', email: 'user-a@swapnet.app' },
        } as any,
      },
      error: null,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.currentUser).toBeNull()
    expect(supabase?.auth.signOut).toHaveBeenCalled()
  })

  // Scenario 7: Unauthenticated users cannot access protected routes (auth check)
  it('Scenario 7: Unauthenticated users are flagged with isAuthenticated: false', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.currentUser).toBeNull()
  })

  // Scenario 8: Authenticated users can access their dashboard
  it('Scenario 8: Authenticated users have active profile access for dashboard', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'user-a-111', email: 'user-a@swapnet.app' },
        } as any,
      },
      error: null,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    expect(result.current.currentUser?.username).toBe('user-a')
    expect(result.current.currentUser?.completedSwaps).toBe(2)
  })

  // Scenario 9: User A sends a swap request to User B
  it('Scenario 9: User A sends a swap request to User B', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'user-a-111', email: 'user-a@swapnet.app' },
        } as any,
      },
      error: null,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    await waitFor(() => {
      expect(result.current.currentUser?.id).toBe('user-a-111')
    })

    let success: boolean = false
    await act(async () => {
      success = await result.current.sendSwapRequest({
        receiverId: 'user-b-222',
        message: 'Hey, lets swap TypeScript for Figma!',
        offeredSkillId: 'skill-ts-1',
        wantedSkillId: 'skill-fig-2',
      })
    })

    expect(success).toBe(true)
    expect(supabase?.from).toHaveBeenCalledWith('swap_requests')
    expect(result.current.swapRequests.length).toBeGreaterThan(0)
  })

  // Scenario 10: User B accepts the request
  it('Scenario 10: User B accepts the swap request', async () => {
    const existingSwap: SwapRequest = {
      id: 'swap-active-1',
      senderId: 'user-a-111',
      receiverId: 'user-b-222',
      message: 'Lets swap!',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offeredSkillId: 'skill-ts-1',
      wantedSkillId: 'skill-fig-2',
      completedBy: [],
    }

    mockDb.swap_requests = [{
      id: 'swap-active-1',
      sender_id: 'user-a-111',
      receiver_id: 'user-b-222',
      message: 'Lets swap!',
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      offered_skill_id: 'skill-ts-1',
      wanted_skill_id: 'skill-fig-2',
      completed_by: [],
    }]

    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'user-b-222', email: 'user-b@swapnet.app' },
        } as any,
      },
      error: null,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => (
        <AppProvider
          initialSwapRequests={[existingSwap]}
          initialUsers={[mockUserA, mockUserB]}
        >
          {children}
        </AppProvider>
      ),
    })

    await waitFor(() => {
      expect(result.current.currentUser?.id).toBe('user-b-222')
    })

    let accepted = false
    await act(async () => {
      accepted = await result.current.respondToSwapRequest('swap-active-1', 'Accepted')
    })

    expect(accepted).toBe(true)
    const targetSwap = result.current.swapRequests.find((s) => s.id === 'swap-active-1')
    expect(targetSwap?.status).toBe('Accepted')
  })

  // Scenario 11: Both users can exchange real-time messages
  it('Scenario 11: Real-time messaging between swap partners', async () => {
    mockDb.swap_requests = [{
      id: 'swap-active-1',
      sender_id: 'user-a-111',
      receiver_id: 'user-b-222',
      message: 'Active Swap',
      status: 'Accepted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      offered_skill_id: 'skill-ts-1',
      wanted_skill_id: 'skill-fig-2',
      completed_by: [],
    }]

    const activeSwap: SwapRequest = {
      id: 'swap-active-1',
      senderId: 'user-a-111',
      receiverId: 'user-b-222',
      message: 'Active Swap',
      status: 'Accepted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offeredSkillId: 'skill-ts-1',
      wantedSkillId: 'skill-fig-2',
      completedBy: [],
    }

    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'user-a-111', email: 'user-a@swapnet.app' },
        } as any,
      },
      error: null,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => (
        <AppProvider
          initialSwapRequests={[activeSwap]}
          initialUsers={[mockUserA, mockUserB]}
        >
          {children}
        </AppProvider>
      ),
    })

    await waitFor(() => {
      expect(result.current.currentUser?.id).toBe('user-a-111')
    })

    await act(async () => {
      await result.current.sendChatMessage('swap_swap-active-1', 'Hello from User A!')
    })

    expect(supabase?.from).toHaveBeenCalledWith('messages')
    const threadMessages = result.current.getMessagesForThread('swap_swap-active-1')
    expect(threadMessages.some((m) => m.message === 'Hello from User A!')).toBe(true)
  })

  // Scenario 12: Notifications
  it('Scenario 12: Notification creation, unread count, and marking as read', async () => {
    const existingNotif: NotificationItem = {
      id: 'notif-1',
      userId: 'user-a-111',
      type: 'request',
      title: 'New Request',
      description: 'You have a new swap request',
      read: false,
      createdAt: new Date().toISOString(),
    }

    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'user-a-111', email: 'user-a@swapnet.app' },
        } as any,
      },
      error: null,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => (
        <AppProvider
          initialNotifications={[existingNotif]}
          initialUsers={[mockUserA, mockUserB]}
        >
          {children}
        </AppProvider>
      ),
    })

    await waitFor(() => {
      expect(result.current.unreadNotificationCount).toBe(1)
    })

    act(() => {
      result.current.markNotificationRead('notif-1')
    })

    expect(result.current.unreadNotificationCount).toBe(0)
  })

  // Scenario 13: Community posts creation and viewing
  it('Scenario 13: Users can create and view community posts', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'user-a-111', email: 'user-a@swapnet.app' },
        } as any,
      },
      error: null,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider initialUsers={[mockUserA, mockUserB]}>{children}</AppProvider>,
    })

    await waitFor(() => {
      expect(result.current.currentUser?.id).toBe('user-a-111')
    })

    let created = false
    await act(async () => {
      created = await result.current.createPost({
        skillName: 'React 19 Architecture',
        category: 'Tech',
        note: 'Looking for someone to teach me Next.js App Router in exchange.',
        mode: 'Online',
        city: 'Mumbai',
      })
    })

    expect(created).toBe(true)
    expect(supabase?.from).toHaveBeenCalledWith('posts')
    expect(result.current.posts.some((p) => p.skillName === 'React 19 Architecture')).toBe(true)
  })
})
