import { ArrowLeftRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface AppLogoProps {
  className?: string
  to?: string
  compact?: boolean
}

export function AppLogo({ className, compact, to = '/' }: AppLogoProps) {
  return (
    <Link
      className={cn('inline-flex items-center gap-3 text-slate-950 dark:text-white', className)}
      to={to}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-tealish-500 text-white shadow-glow">
        <ArrowLeftRight className="size-5" />
      </span>
      {!compact ? (
        <span className="text-lg font-black tracking-tight">SkillBridge</span>
      ) : null}
    </Link>
  )
}
