import type { PropsWithChildren } from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps {
  className?: string
  tone?: 'brand' | 'teal' | 'slate' | 'amber' | 'rose'
}

const toneClasses = {
  brand: 'border border-brand-200/60 bg-brand-100/80 text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/20 dark:text-brand-200',
  teal: 'border border-tealish-200/60 bg-tealish-100/80 text-tealish-700 dark:border-tealish-400/20 dark:bg-tealish-500/20 dark:text-tealish-200',
  slate: 'border border-slate-200/80 bg-slate-100/80 text-slate-700 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-200',
  amber: 'border border-amber-200/60 bg-amber-100/80 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/20 dark:text-amber-200',
  rose: 'border border-rose-200/60 bg-rose-100/80 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/20 dark:text-rose-200',
}

export function Badge({
  children,
  className,
  tone = 'slate',
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.04em]',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
