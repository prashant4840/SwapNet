import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-panel flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="rounded-3xl bg-gradient-to-br from-brand-100 to-teal-100 p-5 dark:from-brand-500/20 dark:to-teal-500/20">
        <svg
          aria-hidden="true"
          className="h-24 w-24"
          fill="none"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="20" y="38" width="120" height="80" rx="18" fill="#EEF2FF" />
          <rect x="30" y="50" width="100" height="12" rx="6" fill="#A5B4FC" />
          <rect x="30" y="70" width="70" height="10" rx="5" fill="#99F6E4" />
          <rect x="30" y="88" width="90" height="10" rx="5" fill="#CBD5F5" />
          <circle cx="118" cy="82" r="18" fill="#14B8A6" opacity="0.9" />
          <path d="M108 82L116 90L128 74" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
