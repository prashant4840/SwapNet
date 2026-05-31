import { useEffect, useRef, useState, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface UnifiedSelectOption {
  label: string
  value: string
}

export interface UnifiedSelectProps {
  options: UnifiedSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  showSearch?: boolean
  searchPlaceholder?: string
  allowCustomInput?: boolean
  customInputLabel?: string
}

export function UnifiedSelect({
  options,
  value,
  onChange,
  placeholder,
  showSearch = false,
  searchPlaceholder = 'Search...',
  allowCustomInput = false,
  customInputLabel = 'Use custom value',
}: UnifiedSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLabel = useMemo(() => {
    const matched = options.find((opt) => opt.value.toLowerCase() === value.toLowerCase())
    if (matched) return matched.label
    if (value && value !== 'All') return value
    return placeholder
  }, [options, value, placeholder])

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q))
  }, [options, searchQuery])

  const hasExactMatch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return options.some((opt) => opt.label.toLowerCase() === q || opt.value.toLowerCase() === q)
  }, [options, searchQuery])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = searchQuery.trim()
      if (trimmed) {
        if (allowCustomInput && !hasExactMatch) {
          handleSelect(trimmed)
        } else if (filteredOptions.length > 0) {
          handleSelect(filteredOptions[0].value)
        }
      }
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (isOpen) {
            setSearchQuery('')
          }
        }}
        className={cn(
          "premium-input w-full rounded-xl px-3.5 py-2 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-brand-500/60 text-sm h-10 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-850",
          isOpen && "ring-2 ring-brand-500/60 border-brand-500"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-slate-700 dark:text-slate-200 font-medium">
          {currentLabel}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition-transform duration-200", isOpen && "transform rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-[99] rounded-xl border border-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 shadow-xl dark:border-slate-800/80 dark:shadow-slate-950/30 flex flex-col gap-1.5 max-w-full">
          {showSearch && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="premium-input w-full rounded-xl py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/60 bg-slate-50 dark:bg-slate-950/50"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
            {allowCustomInput && !hasExactMatch && searchQuery.trim() && (
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 dark:hover:bg-brand-500/20 transition-all duration-200 flex items-center justify-between border border-dashed border-brand-300/50 dark:border-brand-500/30"
              >
                <span className="truncate">{customInputLabel} "{searchQuery.trim()}"</span>
                <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider shrink-0 ml-1">Press Enter</span>
              </button>
            )}

            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 truncate",
                  value.toLowerCase() === opt.value.toLowerCase()
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                {opt.label}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <p className="text-[11px] text-slate-400 p-2 text-center">No options found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
