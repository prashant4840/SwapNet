import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReviewProvider, useReviews } from '../ReviewContext'
import type { Review } from '@/types'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'review-1',
              reviewer_id: 'user-1',
              reviewee_id: 'user-2',
              swap_id: 'swap-1',
              rating: 5,
              comment: 'Great experience',
              created_at: new Date().toISOString(),
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

// Mock utils
vi.mock('@/utils/app', () => ({
  createId: vi.fn((prefix) => `${prefix}-123`),
  cleanId: vi.fn((id) => id),
}))

const mockReview: Review = {
  id: 'review-1',
  reviewerId: 'user-1',
  revieweeId: 'user-2',
  swapRequestId: 'swap-1',
  rating: 5,
  comment: 'Great experience!',
  createdAt: new Date().toISOString(),
}

const mockSwap = {
  id: 'swap-1',
  senderId: 'user-1',
  receiverId: 'user-2',
  status: 'Completed',
}

describe('ReviewContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when useReviews is used outside provider', () => {
    expect(() => {
      renderHook(() => useReviews())
    }).toThrow('useReviews must be used within ReviewProvider')
  })

  it('should provide empty reviews array initially', () => {
    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider currentUserId="user-1">{children}</ReviewProvider>
      ),
    })

    expect(result.current.reviews).toEqual([])
  })

  it('should provide initial reviews', () => {
    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider reviews={[mockReview]} currentUserId="user-1">
          {children}
        </ReviewProvider>
      ),
    })

    expect(result.current.reviews).toEqual([mockReview])
    expect(result.current.reviews.length).toBe(1)
  })

  it('should have addReview function', () => {
    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider currentUserId="user-1" swapRequests={[mockSwap]}>
          {children}
        </ReviewProvider>
      ),
    })

    expect(typeof result.current.addReview).toBe('function')
  })

  it('should have getReviewsForUser function', () => {
    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider currentUserId="user-1">{children}</ReviewProvider>
      ),
    })

    expect(typeof result.current.getReviewsForUser).toBe('function')
  })

  it('should return false when adding review without currentUserId', async () => {
    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider currentUserId={null} swapRequests={[mockSwap]}>
          {children}
        </ReviewProvider>
      ),
    })

    let addResult
    await act(async () => {
      addResult = await result.current.addReview('swap-1', 5, 'Great swap!')
    })

    expect(addResult).toBe(false)
  })

  it('should getReviewsForUser returns reviews for specific user', () => {
    const reviews = [
      mockReview,
      { ...mockReview, id: 'review-2', revieweeId: 'user-3' },
      { ...mockReview, id: 'review-3', revieweeId: 'user-2' },
    ]

    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider reviews={reviews} currentUserId="user-1">
          {children}
        </ReviewProvider>
      ),
    })

    const userReviews = result.current.getReviewsForUser('user-2')

    expect(userReviews.length).toBe(2)
    expect(userReviews.every((r) => r.revieweeId === 'user-2')).toBe(true)
  })

  it('should getReviewsForUser return empty array for user with no reviews', () => {
    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider reviews={[mockReview]} currentUserId="user-1">
          {children}
        </ReviewProvider>
      ),
    })

    const userReviews = result.current.getReviewsForUser('user-999')

    expect(userReviews).toEqual([])
  })

  it('should sort reviews by date descending', () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 86400000)

    const reviews = [
      { ...mockReview, id: 'review-1', createdAt: yesterday.toISOString() },
      { ...mockReview, id: 'review-2', createdAt: now.toISOString(), revieweeId: 'user-2' },
    ]

    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider reviews={reviews} currentUserId="user-1">
          {children}
        </ReviewProvider>
      ),
    })

    const userReviews = result.current.getReviewsForUser('user-2')

    // Most recent should be first
    expect(userReviews[0].createdAt).toBe(now.toISOString())
  })

  it('should support onReviewsUpdate callback', async () => {
    const onUpdate = vi.fn()

    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider
          currentUserId="user-1"
          swapRequests={[mockSwap]}
          onReviewsUpdate={onUpdate}
        >
          {children}
        </ReviewProvider>
      ),
    })

    await act(async () => {
      await result.current.addReview('swap-1', 5, 'Excellent!')
    })

    expect(onUpdate).toHaveBeenCalled()
  })

  it('should maintain review data integrity', () => {
    const testReview: Review = {
      id: 'test-id',
      reviewerId: 'reviewer-1',
      revieweeId: 'reviewee-1',
      swapRequestId: 'swap-123',
      rating: 4,
      comment: 'Good swap',
      createdAt: '2024-01-01T00:00:00Z',
    }

    const { result } = renderHook(() => useReviews(), {
      wrapper: ({ children }) => (
        <ReviewProvider reviews={[testReview]} currentUserId="user-1">
          {children}
        </ReviewProvider>
      ),
    })

    const retrieved = result.current.reviews[0]
    expect(retrieved.id).toBe('test-id')
    expect(retrieved.rating).toBe(4)
    expect(retrieved.comment).toBe('Good swap')
  })
})
