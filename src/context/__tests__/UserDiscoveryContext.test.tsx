import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { UserDiscoveryProvider, useUserDiscovery } from '../UserDiscoveryContext'
import type { UserProfile } from '@/types'

const mockUsers: UserProfile[] = [
  {
    id: 'user-1',
    username: 'alice',
    name: 'Alice',
    email: 'alice@example.com',
    photo: '',
    bio: 'Python developer',
    city: 'San Francisco',
    age: 28,
    headline: 'Learning React',
    mode: 'Online' as const,
    skillsOffered: [{ id: '1', name: 'Python', category: 'Tech' }],
    skillsWanted: [{ id: '2', name: 'React', category: 'Tech' }],
    rating: 4.8,
    swapScore: 95,
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    availability: [],
  },
  {
    id: 'user-2',
    username: 'bob',
    name: 'Bob',
    email: 'bob@example.com',
    photo: '',
    bio: 'React expert',
    city: 'New York',
    age: 32,
    headline: 'Teaching React',
    mode: 'Online' as const,
    skillsOffered: [{ id: '3', name: 'React', category: 'Tech' }],
    skillsWanted: [{ id: '4', name: 'Python', category: 'Tech' }],
    rating: 4.5,
    swapScore: 80,
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    availability: [],
  },
  {
    id: 'user-3',
    username: 'carol',
    name: 'Carol',
    email: 'carol@example.com',
    photo: '',
    bio: 'Designer',
    city: 'Los Angeles',
    age: 26,
    headline: 'UI Designer',
    mode: 'Both' as const,
    skillsOffered: [{ id: '5', name: 'Design', category: 'Creative' }],
    skillsWanted: [{ id: '6', name: 'JavaScript', category: 'Tech' }],
    rating: 4.2,
    swapScore: 70,
    joinedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    lastActiveAt: new Date().toISOString(),
    availability: [],
  },
]

describe('UserDiscoveryContext', () => {
  beforeEach(() => {
    // Reset any mocks
  })

  it('should throw error when useUserDiscovery is used outside provider', () => {
    expect(() => {
      renderHook(() => useUserDiscovery())
    }).toThrow('useUserDiscovery must be used within UserDiscoveryProvider')
  })

  it('should provide users array', () => {
    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={mockUsers}>{children}</UserDiscoveryProvider>
      ),
    })

    expect(result.current.users).toEqual(mockUsers)
    expect(result.current.users.length).toBe(3)
  })

  it('should provide empty users array when not provided', () => {
    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider>{children}</UserDiscoveryProvider>
      ),
    })

    expect(result.current.users).toEqual([])
  })

  it('should compute suggestedMatches when currentUser provided', () => {
    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={mockUsers} currentUser={mockUsers[0]}>
          {children}
        </UserDiscoveryProvider>
      ),
    })

    expect(result.current.suggestedMatches.length).toBeGreaterThan(0)
    expect(result.current.suggestedMatches[0].match).toBeDefined()
    expect(result.current.suggestedMatches[0].match.score).toBeGreaterThanOrEqual(55)
  })

  it('should return empty suggestedMatches when currentUser not provided', () => {
    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={mockUsers}>{children}</UserDiscoveryProvider>
      ),
    })

    expect(result.current.suggestedMatches).toEqual([])
  })

  it('should exclude currentUser from suggestedMatches', () => {
    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={mockUsers} currentUser={mockUsers[0]}>
          {children}
        </UserDiscoveryProvider>
      ),
    })

    const matchedIds = result.current.suggestedMatches.map((m) => m.id)
    expect(matchedIds).not.toContain(mockUsers[0].id)
  })

  it('should limit suggestedMatches to 6 results', () => {
    const manyUsers = Array.from({ length: 20 }, (_, i) => ({
      ...mockUsers[0],
      id: `user-${i}`,
      username: `user${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
    }))

    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={manyUsers} currentUser={manyUsers[0]}>
          {children}
        </UserDiscoveryProvider>
      ),
    })

    expect(result.current.suggestedMatches.length).toBeLessThanOrEqual(6)
  })

  it('should compute newTodayUsers', () => {
    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={mockUsers}>{children}</UserDiscoveryProvider>
      ),
    })

    expect(result.current.newTodayUsers.length).toBeGreaterThan(0)
    expect(Array.isArray(result.current.newTodayUsers)).toBe(true)
  })

  it('should limit newTodayUsers to 4 results', () => {
    const manyNewUsers = Array.from({ length: 10 }, (_, i) => ({
      ...mockUsers[0],
      id: `user-${i}`,
      username: `user${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
    }))

    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={manyNewUsers}>{children}</UserDiscoveryProvider>
      ),
    })

    expect(result.current.newTodayUsers.length).toBeLessThanOrEqual(4)
  })

  it('should compute topRatedUsers sorted by rating', () => {
    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={mockUsers}>{children}</UserDiscoveryProvider>
      ),
    })

    expect(result.current.topRatedUsers.length).toBeGreaterThan(0)
    // Check that it's sorted by rating (descending)
    for (let i = 0; i < result.current.topRatedUsers.length - 1; i++) {
      expect(result.current.topRatedUsers[i].rating).toBeGreaterThanOrEqual(
        result.current.topRatedUsers[i + 1].rating
      )
    }
  })

  it('should limit topRatedUsers to 4 results', () => {
    const manyUsers = Array.from({ length: 10 }, (_, i) => ({
      ...mockUsers[0],
      id: `user-${i}`,
      username: `user${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      rating: Math.random() * 5,
    }))

    const { result } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={manyUsers}>{children}</UserDiscoveryProvider>
      ),
    })

    expect(result.current.topRatedUsers.length).toBeLessThanOrEqual(4)
  })

  it('should memoize computations to prevent unnecessary recalculations', () => {
    const { result, rerender } = renderHook(() => useUserDiscovery(), {
      wrapper: ({ children }) => (
        <UserDiscoveryProvider users={mockUsers} currentUser={mockUsers[0]}>
          {children}
        </UserDiscoveryProvider>
      ),
    })

    const firstMatches = result.current.suggestedMatches
    const firstTopRated = result.current.topRatedUsers

    // Rerender with same props - memoization should prevent recalculation
    rerender()

    const secondMatches = result.current.suggestedMatches
    const secondTopRated = result.current.topRatedUsers

    // Same reference = memoized
    expect(firstMatches).toBe(secondMatches)
    expect(firstTopRated).toBe(secondTopRated)
  })
})
