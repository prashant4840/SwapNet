import { useState, useMemo } from 'react'
import { cn } from '@/utils/cn'

interface AvatarProps {
  avatarUrl?: string | null
  fullName: string | null | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string
  className?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
}

const sizeMap: Record<string, string> = {
  sm: 'size-8 rounded-full text-xs',
  md: 'size-11 rounded-full text-sm',
  lg: 'size-14 rounded-full text-base',
  xl: 'size-20 rounded-full text-xl',
  '2xl': 'size-28 rounded-full text-3xl',
}

export function Avatar({
  avatarUrl,
  fullName,
  size = 'md',
  className,
  loading = 'lazy',
  decoding = 'async',
}: AvatarProps) {
  const [hasError, setHasError] = useState(false)

  const [prevUrl, setPrevUrl] = useState(avatarUrl)

  // Reset state when URL changes to ensure it doesn't get stuck in fallback mode
  if (avatarUrl !== prevUrl) {
    setPrevUrl(avatarUrl)
    setHasError(false)
  }

  const name = fullName || 'User'

  const initials = useMemo(() => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0 || !parts[0]) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }, [name])

  // Ensure all avatars are circular by replacing non-circular rounded- classes
  let sizeClasses = sizeMap[size] || size
  if (sizeClasses.includes('rounded-')) {
    sizeClasses = sizeClasses.replace(/rounded-\S+/g, 'rounded-full')
  } else if (!sizeClasses.includes('rounded-full')) {
    sizeClasses = `${sizeClasses} rounded-full`
  }

  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    const trimmed = url.trim()
    if (!trimmed) return false
    return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')
  }

  const trimmedUrl = avatarUrl?.trim()
  const showFallback = hasError || !isValidUrl(trimmedUrl)

  if (showFallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center font-bold bg-gradient-to-br from-brand-600 to-tealish-500 text-white select-none uppercase shadow-soft ring-2 ring-slate-100 dark:ring-slate-800',
          sizeClasses,
          className
        )}
        aria-label={name}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      alt={name}
      src={trimmedUrl}
      onError={() => setHasError(true)}
      onLoad={() => setHasError(false)}
      loading={loading}
      decoding={decoding}
      className={cn('object-cover shadow-soft ring-2 ring-slate-100 dark:ring-slate-800', sizeClasses, className)}
    />
  )
}


