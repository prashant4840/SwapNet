import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  icon?: LucideIcon
  className?: string
}

export function EmptyState({ title, description, action, icon: Icon, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-5 px-6 py-12 text-center', className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/20 to-tealish-500/15 blur-2xl" />
        <div className="relative rounded-3xl border border-slate-200/60 bg-gradient-to-br from-brand-50 via-white to-tealish-50 p-5 dark:border-slate-700/40 dark:from-brand-500/10 dark:via-slate-900 dark:to-tealish-500/10">
          {Icon ? (
            <Icon className="size-10 text-brand-400 dark:text-brand-300" strokeWidth={1.5} />
          ) : (
            <svg
              aria-hidden="true"
              className="size-10"
              fill="none"
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="4" y="8" width="32" height="24" rx="6" className="fill-brand-100 dark:fill-brand-500/20" />
              <rect x="8" y="14" width="18" height="3" rx="1.5" className="fill-brand-300 dark:fill-brand-400/40" />
              <rect x="8" y="20" width="12" height="3" rx="1.5" className="fill-tealish-300 dark:fill-tealish-400/40" />
              <rect x="8" y="26" width="15" height="3" rx="1.5" className="fill-slate-200 dark:fill-slate-600" />
              <circle cx="30" cy="24" r="5" className="fill-tealish-500 dark:fill-tealish-400" opacity="0.9" />
              <path d="M27.5 24L29.5 26L32.5 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
