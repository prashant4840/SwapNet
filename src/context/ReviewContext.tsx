import { createContext, useContext, useState, useCallback, type PropsWithChildren } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Review, SwapRequest } from '@/types'
import { createId } from '@/utils/app'

interface ReviewContextValue {
  reviews: Review[]
  addReview: (requestId: string, rating: number, comment: string) => Promise<boolean>
  getReviewsForUser: (userId: string) => Review[]
}

const ReviewContext = createContext<ReviewContextValue | undefined>(undefined)

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
  const [reviews, setReviews] = useState<Review[]>(initialReviews)

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
        return true
      } catch (error) {
        console.error('Failed to add review:', error)
        toast.error('Failed to submit review.')
        return false
      }
    },
    [currentUserId, reviews, swapRequests, onReviewsUpdate]
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
