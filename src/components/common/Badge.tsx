import type { PropsWithChildren } from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps {
  className?: string
  tone?: 'brand' | 'teal' | 'slate' | 'amber' | 'rose'
}

const toneClasses = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200',
  teal: 'bg-tealish-100 text-tealish-700 dark:bg-tealish-500/20 dark:text-tealish-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
}

export function Badge({
  children,
  className,
  tone = 'slate',
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
