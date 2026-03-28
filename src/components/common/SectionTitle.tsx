import type { PropsWithChildren, ReactNode } from 'react'

interface SectionTitleProps {
  eyebrow?: string
  description?: string
  action?: ReactNode
}

export function SectionTitle({
  eyebrow,
  description,
  action,
  children,
}: PropsWithChildren<SectionTitleProps>) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">
            {eyebrow}
          </p>
        ) : null}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {children}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  )
}
