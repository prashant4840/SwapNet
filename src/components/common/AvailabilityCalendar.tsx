import { cn } from '@/utils/cn'
import type { AvailabilitySlot } from '@/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const SLOTS = ['Morning', 'Afternoon', 'Evening'] as const

const DAY_LABELS: Record<typeof DAYS[number], string> = {
  Mon: 'Mon',
  Tue: 'Tue',
  Wed: 'Wed',
  Thu: 'Thu',
  Fri: 'Fri',
  Sat: 'Sat',
  Sun: 'Sun',
}

const SLOT_LABELS: Record<typeof SLOTS[number], string> = {
  Morning: '🌅 Morning',
  Afternoon: '☀️ Afternoon',
  Evening: '🌙 Evening',
}

const SLOT_TIMES: Record<typeof SLOTS[number], string> = {
  Morning: '6am–12pm',
  Afternoon: '12pm–6pm',
  Evening: '6pm–11pm',
}

interface AvailabilityCalendarProps {
  value: AvailabilitySlot[]
  onChange: (value: AvailabilitySlot[]) => void
}

function toSlotKey(day: typeof DAYS[number], slot: typeof SLOTS[number]): AvailabilitySlot {
  return `${day}-${slot}` as AvailabilitySlot
}

function isLegacySlot(slot: AvailabilitySlot) {
  return ['Weekdays', 'Weekends', 'Evenings'].includes(slot)
}

export function AvailabilityCalendar({ value, onChange }: AvailabilityCalendarProps) {
  // Strip legacy slots — only work with the new day-based format
  const selected = new Set(value.filter((s) => !isLegacySlot(s)))

  function toggle(day: typeof DAYS[number], slot: typeof SLOTS[number]) {
    const key = toSlotKey(day, slot)
    const next = new Set(selected)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    onChange(Array.from(next) as AvailabilitySlot[])
  }

  function toggleDay(day: typeof DAYS[number]) {
    const daySlots = SLOTS.map((s) => toSlotKey(day, s))
    const allSelected = daySlots.every((s) => selected.has(s))
    const next = new Set(selected)
    if (allSelected) {
      daySlots.forEach((s) => next.delete(s))
    } else {
      daySlots.forEach((s) => next.add(s))
    }
    onChange(Array.from(next) as AvailabilitySlot[])
  }

  function toggleSlot(slot: typeof SLOTS[number]) {
    const slotKeys = DAYS.map((d) => toSlotKey(d, slot))
    const allSelected = slotKeys.every((s) => selected.has(s))
    const next = new Set(selected)
    if (allSelected) {
      slotKeys.forEach((s) => next.delete(s))
    } else {
      slotKeys.forEach((s) => next.add(s))
    }
    onChange(Array.from(next) as AvailabilitySlot[])
  }

  const totalSelected = selected.size
  const totalSlots = DAYS.length * SLOTS.length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {totalSelected === 0
            ? 'No slots selected — tap cells to mark when you are free'
            : `${totalSelected} of ${totalSlots} slots selected`}
        </p>
        {totalSelected > 0 ? (
          <button
            className="text-xs font-semibold text-rose-500 hover:text-rose-700 dark:text-rose-400"
            onClick={() => onChange([])}
            type="button"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr>
              {/* Empty corner */}
              <th className="w-28 pb-2 text-left" />
              {DAYS.map((day) => {
                const daySlots = SLOTS.map((s) => toSlotKey(day, s))
                const allSelected = daySlots.every((s) => selected.has(s))
                const someSelected = daySlots.some((s) => selected.has(s))
                return (
                  <th key={day} className="pb-2 text-center font-medium">
                    <button
                      className={cn(
                        'w-full rounded-xl py-1.5 text-xs font-semibold transition',
                        allSelected
                          ? 'bg-brand-600 text-white'
                          : someSelected
                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                      )}
                      onClick={() => toggleDay(day)}
                      type="button"
                      title={`Toggle all ${DAY_LABELS[day]} slots`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="space-y-1">
            {SLOTS.map((slot) => {
              const slotKeys = DAYS.map((d) => toSlotKey(d, slot))
              const allSelected = slotKeys.every((s) => selected.has(s))
              return (
                <tr key={slot}>
                  {/* Row header — click to toggle entire row */}
                  <td className="pr-3 py-1">
                    <button
                      className={cn(
                        'w-full rounded-xl px-2 py-2 text-left transition',
                        allSelected
                          ? 'bg-brand-600 text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                      )}
                      onClick={() => toggleSlot(slot)}
                      type="button"
                      title={`Toggle all ${slot} slots`}
                    >
                      <p className={cn(
                        'text-xs font-semibold',
                        allSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                      )}>
                        {SLOT_LABELS[slot]}
                      </p>
                      <p className={cn(
                        'text-[10px]',
                        allSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                      )}>
                        {SLOT_TIMES[slot]}
                      </p>
                    </button>
                  </td>

                  {/* Day cells */}
                  {DAYS.map((day) => {
                    const key = toSlotKey(day, slot)
                    const isSelected = selected.has(key)
                    return (
                      <td key={day} className="py-1 px-0.5 text-center">
                        <button
                          className={cn(
                            'mx-auto flex h-10 w-full items-center justify-center rounded-xl text-xs font-medium transition-all duration-200',
                            isSelected
                              ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                              : 'bg-slate-100/80 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800/80 dark:text-slate-500 dark:hover:bg-brand-500/20 dark:hover:text-brand-300',
                          )}
                          onClick={() => toggle(day, slot)}
                          type="button"
                          aria-label={`${isSelected ? 'Remove' : 'Add'} ${DAY_LABELS[day]} ${slot}`}
                          aria-pressed={isSelected}
                        >
                          {isSelected ? '✓' : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-brand-600" />
          Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
          Not available
        </span>
        <span className="text-slate-400 dark:text-slate-500">
          Tap a day or row header to select all
        </span>
      </div>
    </div>
  )
}
