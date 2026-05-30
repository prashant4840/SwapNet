/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, type PropsWithChildren } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Review, SwapRequest } from '@/types'
import { createId } from '@/utils/app'

interface ReviewContextValue {
  reviews: Review[]
  hasMore: boolean
  loadingMore: boolean
  loadMoreReviews: () => Promise<void>
  addReview: (requestId: string, rating: number, comment: string) => Promise<boolean>
  getReviewsForUser: (userId: string) => Review[]
}

const ReviewContext = createContext<ReviewContextValue | undefined>(undefined)

import { getSeedState } from '@/data/seed'
import { useEffect } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { UserDiscoveryContext } from './UserDiscoveryContext'
import { trackReviewSubmitted } from '@/services/analytics'
import { sendReviewReceivedEmail } from '@/services/email'
import { captureException } from '@/services/errorTracking'

interface ReviewProviderProps extends PropsWithChildren {
  reviews?: Review[]
  currentUserId?: string | null
  onReviewsUpdate?: (reviews: Review[]) => void
  swapRequests?: SwapRequest[]
}

export function ReviewProvider({
  children,
  reviews: initialReviews = [],
  currentUserId,
  onReviewsUpdate,
  swapRequests = [],
}: ReviewProviderProps) {
  const discovery = useContext(UserDiscoveryContext)
  const users = useMemo(() => discovery ? discovery.users : [], [discovery])

  const [reviews, setReviews] = useState<Review[]>(() => {
    if (initialReviews.length > 0) return initialReviews
    if (!isSupabaseConfigured) {
      return getSeedState().reviews
    }
    return []
  })
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMoreReviews = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const start = reviews.length
      const end = start + 9 // Load 10 reviews per load
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map((r) => ({
          id: r.id,
          reviewerId: r.reviewer_id,
          revieweeId: r.reviewee_id,
          swapRequestId: r.swap_id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at,
        }))

        setReviews((prev) => {
          const existingIds = new Set(prev.map((item) => item.id))
          const filtered = mapped.filter((item) => !existingIds.has(item.id))
          const updated = [...prev, ...filtered]
          onReviewsUpdate?.(updated)
          return updated
        })

        if (data.length < 10) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more reviews:', err)
      captureException(err, { context: 'loadMoreReviews' })
    } finally {
      setLoadingMore(false)
    }
  }, [reviews.length, hasMore, loadingMore, onReviewsUpdate])

  useEffect(() => {
    if (initialReviews.length > 0) {
      setReviews(initialReviews)
      setHasMore(false)
      return
    }

    if (!isSupabaseConfigured || !supabase) return

    const loadReviews = async () => {
      try {
        const { data, error } = await supabase!
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false })
          .range(0, 9) // Load initial 10 reviews

        if (error) throw error

        if (data) {
          const mapped = data.map(
            (r: {
              id: string
              reviewer_id: string
              reviewee_id: string
              swap_id: string
              rating: number
              comment: string
              created_at: string
            }) => ({
              id: r.id,
              reviewerId: r.reviewer_id,
              revieweeId: r.reviewee_id,
              swapRequestId: r.swap_id,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.created_at,
            })
          )
          setReviews(mapped)
          onReviewsUpdate?.(mapped)
          if (data.length < 10) {
            setHasMore(false)
          }
        }
      } catch (error) {
        console.error('Failed to load reviews from database:', error)
        captureException(error, { context: 'loadReviewsFirstPage' })
      }
    }

    loadReviews()
  }, [initialReviews, onReviewsUpdate])

  const addReview = useCallback(
    async (requestId: string, rating: number, comment: string): Promise<boolean> => {
      if (!currentUserId || !supabase) return false

      const swap = swapRequests.find((item) => item.id === requestId)
      if (!swap || swap.status !== 'Completed') {
        toast.error('Complete the swap before leaving a review.')
        return false
      }

      const revieweeId = swap.senderId === currentUserId ? swap.receiverId : swap.senderId
      const exists = reviews.some(
        (r) =>
          r.swapRequestId === requestId &&
          r.reviewerId === currentUserId &&
          r.revieweeId === revieweeId
      )

      if (exists) {
        toast.error('You already reviewed this swap.')
        return false
      }

      try {
        const newReviewId = createId('review')
        const { data, error } = await supabase
          .from('reviews')
          .insert({
            id: newReviewId,
            reviewer_id: currentUserId,
            reported_user_id: undefined, // ensure no collision
            reviewee_id: revieweeId,
            swap_id: requestId,
            rating,
            comment: comment.trim(),
          })
          .select()
          .single()

        if (error || !data) {
          toast.error('Failed to submit review.')
          return false
        }

        const newReview: Review = {
          id: data.id,
          reviewerId: data.reviewer_id,
          revieweeId: data.reviewee_id,
          swapRequestId: data.swap_id,
          rating: data.rating,
          comment: data.comment,
          createdAt: data.created_at,
        }

        const updatedReviews = [newReview, ...reviews]
        setReviews(updatedReviews)
        onReviewsUpdate?.(updatedReviews)

        toast.success('Review submitted.')

        // Trigger analytics tracking
        trackReviewSubmitted(currentUserId, revieweeId, requestId, rating)

        // Trigger Resend email notification
        const reviewerProfile = users.find((u) => u.id === currentUserId)
        const revieweeProfile = users.find((u) => u.id === revieweeId)
        if (revieweeProfile && revieweeProfile.email) {
          void sendReviewReceivedEmail({
            receiverEmail: revieweeProfile.email,
            receiverName: revieweeProfile.name,
            reviewerName: reviewerProfile?.name || 'A user',
            rating,
            comment: comment.trim(),
          })
        }

        return true
      } catch (error) {
        console.error('Failed to add review:', error)
        captureException(error, { context: 'addReview', requestId, rating })
        toast.error('Failed to submit review.')
        return false
      }
    },
    [currentUserId, reviews, swapRequests, onReviewsUpdate, users]
  )

  const getReviewsForUser = useCallback(
    (userId: string) => {
      return reviews
        .filter((r) => r.revieweeId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    [reviews]
  )

  return (
    <ReviewContext.Provider
      value={{
        reviews,
        hasMore,
        loadingMore,
        loadMoreReviews,
        addReview,
        getReviewsForUser,
      }}
    >
      {children}
    </ReviewContext.Provider>
  )
}

export function useReviews() {
  const context = useContext(ReviewContext)
  if (!context) {
    throw new Error('useReviews must be used within ReviewProvider')
  }
  return context
}
