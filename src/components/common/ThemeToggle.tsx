import { MoonStar, SunMedium } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/common/Button'

export function ThemeToggle() {
  const { state, toggleTheme } = useApp()

  return (
    <Button
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      size="sm"
      variant="outline"
    >
      {state.theme === 'dark' ? (
        <>
          <SunMedium className="size-4" />
          Light
        </>
      ) : (
        <>
          <MoonStar className="size-4" />
          Dark
        </>
      )}
    </Button>
  )
}
