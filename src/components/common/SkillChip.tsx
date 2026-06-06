import type { SkillEntry } from '@/types'
import { cn } from '@/utils/cn'

const categoryColor: Record<SkillEntry['category'], string> = {
  Music:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  Tech: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200',
  Creative:
    'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-200',
  Wellness:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  Lifestyle:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  Academic:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
  Business:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200',
  Languages:
    'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200',
}

interface SkillChipProps {
  skill: SkillEntry
  removable?: boolean
  onRemove?: () => void
}

export function SkillChip({ skill, removable, onRemove }: SkillChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold hover:scale-[1.03] hover:-translate-y-[1px] hover:shadow-md transition-all duration-300',
        categoryColor[skill.category],
      )}
    >
      <span>{skill.name}</span>
      {skill.level ? <span className="opacity-75">{skill.level}</span> : null}
      {removable && onRemove ? (
        <button
          aria-label={`Remove ${skill.name}`}
          className="rounded-full size-4 flex items-center justify-center bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors text-[9px] font-bold text-current focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
          onClick={onRemove}
          type="button"
        >
          ✕
        </button>
      ) : null}
    </span>
  )
}
