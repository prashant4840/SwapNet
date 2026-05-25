import { CheckCircle2, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { profileCompletion, getProfileCompletionItems } from '@/utils/app'
import type { UserProfile } from '@/types'

interface ProfileCompletionCardProps {
  profile: UserProfile
}

export function ProfileCompletionCard({ profile }: ProfileCompletionCardProps) {
  const completionPercent = profileCompletion(profile)
  const missingItems = getProfileCompletionItems(profile)
  const isComplete = completionPercent === 100

  if (isComplete) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-950 dark:text-emerald-50">
                Profile complete!
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-200">
                You're all set to start swapping skills
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="font-semibold text-slate-950 dark:text-white">
            Complete your profile
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {completionPercent}% complete
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      {/* Missing items */}
      <div className="space-y-2 mb-4">
        {missingItems.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 flex-1">
              <div className="size-2 rounded-full bg-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {item.prompt}
                </p>
              </div>
            </div>
            {item.link && (
              <Link to={item.link} className="flex-shrink-0 ml-2">
                <ChevronRight className="size-4 text-slate-400" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {missingItems.length > 3 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          +{missingItems.length - 3} more items to complete
        </p>
      )}

      <Link to="/settings">
        <Button className="w-full" variant="outline">
          Complete profile
        </Button>
      </Link>
    </div>
  )
}
