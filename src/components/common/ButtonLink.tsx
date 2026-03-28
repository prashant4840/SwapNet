import type { PropsWithChildren } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/utils/cn'

type ButtonLinkVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonLinkSize = 'sm' | 'md' | 'lg'

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonLinkVariant
  size?: ButtonLinkSize
  fullWidth?: boolean
  className?: string
}

const variantClasses: Record<ButtonLinkVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-600 to-tealish-500 text-white shadow-glow hover:brightness-110',
  secondary:
    'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
  outline:
    'border border-slate-200 bg-white text-slate-900 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70',
}

const sizeClasses: Record<ButtonLinkSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

export function ButtonLink({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth,
  ...props
}: PropsWithChildren<ButtonLinkProps>) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
