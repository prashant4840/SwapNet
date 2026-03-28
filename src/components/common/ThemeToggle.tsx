import { MoonStar, SunMedium } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/common/Button'
import { cn } from '@/utils/cn'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const { state, toggleTheme } = useApp()
  const isDark = state.theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <Button
      aria-label={label}
      className={cn('shrink-0', className)}
      onClick={toggleTheme}
      size="sm"
      variant="outline"
    >
      {isDark ? (
        <>
          <SunMedium className="size-4" />
          {showLabel ? 'Light' : <span className="sr-only">Light</span>}
        </>
      ) : (
        <>
          <MoonStar className="size-4" />
          {showLabel ? 'Dark' : <span className="sr-only">Dark</span>}
        </>
      )}
    </Button>
  )
}
