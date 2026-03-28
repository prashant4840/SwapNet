import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

interface RatingStarsProps {
  rating: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
}

export function RatingStars({ rating, onChange, size = 'md' }: RatingStarsProps) {
  const starSize = size === 'sm' ? 'size-4' : 'size-5'

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const value = index + 1
        return (
          <button
            className={cn(
              'rounded-full transition',
              onChange ? 'cursor-pointer' : 'cursor-default',
            )}
            disabled={!onChange}
            key={value}
            onClick={() => onChange?.(value)}
            type="button"
          >
            <Star
              className={cn(
                starSize,
                value <= rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 dark:text-slate-600',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
