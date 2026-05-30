import { useState, useMemo } from 'react'
import { cn } from '@/utils/cn'

interface AvatarProps {
  avatarUrl?: string | null
  fullName: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string
  className?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
}

const sizeMap: Record<string, string> = {
  sm: 'size-8 rounded-xl text-xs',
  md: 'size-11 rounded-2xl text-sm',
  lg: 'size-14 rounded-3xl text-base',
  xl: 'size-20 rounded-[2rem] text-xl',
  '2xl': 'size-28 rounded-[2rem] text-3xl',
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

  if (avatarUrl !== prevUrl) {
    setPrevUrl(avatarUrl)
    setHasError(false)
  }

  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 0 || !parts[0]) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }, [fullName])

  const sizeClasses = sizeMap[size] || size

  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    const trimmed = url.trim()
    if (!trimmed) return false
    return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')
  }

  const showFallback = hasError || !isValidUrl(avatarUrl)

  if (showFallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center font-bold bg-gradient-to-br from-brand-600 to-tealish-500 text-white select-none uppercase shadow-soft',
          sizeClasses,
          className
        )}
        aria-label={fullName}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      alt={fullName}
      src={avatarUrl!.trim()}
      onError={() => setHasError(true)}
      loading={loading}
      decoding={decoding}
      className={cn('object-cover shadow-soft', sizeClasses, className)}
    />
  )
}
