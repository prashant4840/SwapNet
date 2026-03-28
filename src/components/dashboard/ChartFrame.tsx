import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ChartFrameProps {
  height?: number
  children: (size: { width: number; height: number }) => ReactNode
}

export function ChartFrame({ height = 288, children }: ChartFrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0
      setWidth(nextWidth)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="mt-6 h-72 min-w-0" ref={containerRef}>
      {width > 0 ? (
        children({ width, height })
      ) : (
        <div className="h-full animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
      )}
    </div>
  )
}
