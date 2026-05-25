import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { PostProvider, usePosts } from '../PostContext'
import type { LookingForPost } from '@/types'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'post-1',
              user_id: 'user-1',
              skill_name: 'React',
              category: 'Tech',
              note: 'Looking for React teacher',
              city: 'SF',
              mode: 'Online',
              created_at: new Date().toISOString(),
              responses: 0,
            },
            error: null,
          }),
        })),
      })),
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

const mockPost: LookingForPost = {
  id: 'post-1',
  userId: 'user-1',
  skillName: 'React',
  category: 'Tech' as const,
  note: 'Looking for React teacher',
  city: 'San Francisco',
  mode: 'Online' as const,
  createdAt: new Date().toISOString(),
  responses: 2,
}

describe('PostContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when usePosts is used outside provider', () => {
    expect(() => {
      renderHook(() => usePosts())
    }).toThrow('usePosts must be used within PostProvider')
  })

  it('should provide empty posts array initially', () => {
    const { result } = renderHook(() => usePosts(), {
      wrapper: ({ children }) => <PostProvider currentUserId="user-1">{children}</PostProvider>,
    })

    expect(result.current.posts).toEqual([])
  })

  it('should provide initial posts', () => {
    const { result } = renderHook(() => usePosts(), {
      wrapper: ({ children }) => (
        <PostProvider posts={[mockPost]} currentUserId="user-1">
          {children}
        </PostProvider>
      ),
    })

    expect(result.current.posts).toEqual([mockPost])
    expect(result.current.posts.length).toBe(1)
  })

  it('should have createPost function', () => {
    const { result } = renderHook(() => usePosts(), {
      wrapper: ({ children }) => <PostProvider currentUserId="user-1">{children}</PostProvider>,
    })

    expect(typeof result.current.createPost).toBe('function')
  })

  it('should return false when creating post without currentUserId', async () => {
    const { result } = renderHook(() => usePosts(), {
      wrapper: ({ children }) => <PostProvider currentUserId={null}>{children}</PostProvider>,
    })

    let createResult
    await act(async () => {
      createResult = await result.current.createPost({
        skillName: 'Python',
        category: 'Tech',
        note: 'Need Python help',
        mode: 'Online',
      })
    })

    expect(createResult).toBe(false)
  })

  it('should support onPostsUpdate callback', async () => {
    const onUpdate = vi.fn()

    const { result } = renderHook(() => usePosts(), {
      wrapper: ({ children }) => (
        <PostProvider currentUserId="user-1" onPostsUpdate={onUpdate}>
          {children}
        </PostProvider>
      ),
    })

    await act(async () => {
      await result.current.createPost({
        skillName: 'JavaScript',
        category: 'Tech',
        note: 'Looking for JS tutor',
        mode: 'Online',
      })
    })

    // Callback should be called with updated posts
    expect(onUpdate).toHaveBeenCalled()
  })

  it('should maintain posts array structure', () => {
    const { result } = renderHook(() => usePosts(), {
      wrapper: ({ children }) => (
        <PostProvider posts={[mockPost]} currentUserId="user-1">
          {children}
        </PostProvider>
      ),
    })

    expect(Array.isArray(result.current.posts)).toBe(true)
    expect(result.current.posts[0]).toHaveProperty('id')
    expect(result.current.posts[0]).toHaveProperty('userId')
    expect(result.current.posts[0]).toHaveProperty('skillName')
    expect(result.current.posts[0]).toHaveProperty('category')
  })

  it('should handle multiple posts', () => {
    const posts = [mockPost, { ...mockPost, id: 'post-2' }, { ...mockPost, id: 'post-3' }]

    const { result } = renderHook(() => usePosts(), {
      wrapper: ({ children }) => (
        <PostProvider posts={posts} currentUserId="user-1">
          {children}
        </PostProvider>
      ),
    })

    expect(result.current.posts.length).toBe(3)
  })

  it('should preserve post data when providing initial posts', () => {
    const testPost: LookingForPost = {
      id: 'test-123',
      userId: 'user-456',
      skillName: 'Design',
      category: 'Creative' as const,
      note: 'Need UI design help',
      city: 'NYC',
      mode: 'In-person' as const,
      createdAt: '2024-01-01T00:00:00Z',
      responses: 5,
    }

    const { result } = renderHook(() => usePosts(), {
      wrapper: ({ children }) => (
        <PostProvider posts={[testPost]} currentUserId="user-1">
          {children}
        </PostProvider>
      ),
    })

    const post = result.current.posts[0]
    expect(post.id).toBe('test-123')
    expect(post.skillName).toBe('Design')
    expect(post.category).toBe('Creative')
    expect(post.responses).toBe(5)
  })
})
