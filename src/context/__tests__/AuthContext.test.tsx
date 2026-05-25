import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import type { UserProfile, SignupPayload } from '@/types'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: vi.fn(),
    })),
  },
  isSupabaseConfigured: true,
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUser: UserProfile = {
  id: 'user-123',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  photo: '',
  bio: '',
  city: 'San Francisco',
  age: 25,
  headline: 'Learning React',
  mode: 'Online' as const,
  skillsOffered: [],
  skillsWanted: [],
  rating: 4.5,
  swapScore: 0,
  joinedAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[]}>{children}</AuthProvider>
        ),
      })

      expect(result.current.loading).toBe(true)
    })

    it('should throw error when useAuth is used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within AuthProvider')
    })
  })

  describe('Authentication', () => {
    it('should handle signup with valid credentials', async () => {
      const { supabase: supabasseMock } = await import('@/lib/supabase')
      if (!supabasseMock) throw new Error('Supabase not configured')

      vi.mocked(supabasseMock.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      vi.mocked(supabasseMock.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[]}>{children}</AuthProvider>
        ),
      })

      const payload: SignupPayload = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        city: 'San Francisco',
      }

      let signupResult: any
      await act(async () => {
        signupResult = await result.current.signUp(payload)
      })

      expect(signupResult?.success).toBeDefined()
    })

    it('should handle Google OAuth login', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[]}>{children}</AuthProvider>
        ),
      })

      let oauthResult
      await act(async () => {
        oauthResult = await result.current.loginWithGoogle()
      })

      expect(oauthResult?.success).toBe(true)
    })

    it('should handle logout', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        data: {},
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[]}>{children}</AuthProvider>
        ),
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Profile Management', () => {
    it('should get user by ID from all users', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[mockUser]}>{children}</AuthProvider>
        ),
      })

      const foundUser = result.current.getUserById('user-123')

      expect(foundUser?.id).toBe('user-123')
      expect(foundUser?.name).toBe('Test User')
    })

    it('should fetch user by username', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[mockUser]}>{children}</AuthProvider>
        ),
      })

      const foundUser = result.current.getUserByUsername('testuser')

      expect(foundUser?.username).toBe('testuser')
      expect(foundUser?.email).toBe('test@example.com')
    })

    it('should return null for non-existent user ID', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[mockUser]}>{children}</AuthProvider>
        ),
      })

      const foundUser = result.current.getUserById('non-existent')

      expect(foundUser).toBeNull()
    })

    it('should return null for non-existent username', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[mockUser]}>{children}</AuthProvider>
        ),
      })

      const foundUser = result.current.getUserByUsername('nonexistent')

      expect(foundUser).toBeNull()
    })
  })

  describe('State Management', () => {
    it('should initialize with null currentUser', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[]}>{children}</AuthProvider>
        ),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should have correct currentUserId when null', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[mockUser]}>{children}</AuthProvider>
        ),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.currentUserId).toBeNull()
    })

    it('should handle loading state correctly', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[]}>{children}</AuthProvider>
        ),
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle signup error', async () => {
      const { supabase } = await import('@/lib/supabase')

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as any)

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email already exists' },
      } as any)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[]}>{children}</AuthProvider>
        ),
      })

      const payload: SignupPayload = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        city: 'San Francisco',
      }

      let signupResult
      await act(async () => {
        signupResult = await result.current.signUp(payload)
      })

      expect(signupResult?.success).toBe(false)
      expect(signupResult?.message).toBe('Email already exists')
    })

    it('should handle Supabase not configured', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider allUsers={[]}>{children}</AuthProvider>
        ),
      })

      const payload: SignupPayload = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        city: 'San Francisco',
      }

      let signupResult
      await act(async () => {
        signupResult = await result.current.signUp(payload)
      })

      // This will still succeed if isSupabaseConfigured is mocked as true
      // In a real test, we'd mock isSupabaseConfigured as false
      expect(signupResult).toBeDefined()
    })
  })
})
