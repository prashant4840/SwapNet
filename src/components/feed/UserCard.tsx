import { Link } from 'react-router-dom'
import { MapPin, MonitorPlay, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { SkillChip } from '@/components/common/SkillChip'
import { useApp } from '@/context/AppContext'
import type { MatchResult, UserProfile } from '@/types'

interface UserCardProps {
  user: UserProfile
  match: MatchResult
  onRequest: (user: UserProfile) => void
}

export function UserCard({ user, match, onRequest }: UserCardProps) {
  const { currentUser } = useApp()

  return (
    <article className="group glass-panel flex h-full flex-col gap-5 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            alt={user.name}
            className="size-16 rounded-3xl object-cover ring-4 ring-white/60 dark:ring-slate-800/70"
            src={user.photo}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">{user.name}</h3>
              {match.isPerfect ? <Badge tone="brand">Perfect Match 🎯</Badge> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" />
                {user.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <MonitorPlay className="size-4" />
                {user.mode}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right dark:bg-slate-800/70">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Match</p>
          <p className="text-xl font-bold text-brand-700 dark:text-brand-200">{match.score}%</p>
        </div>
      </div>

      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{user.headline}</p>

      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Skills offered
          </p>
          <div className="flex flex-wrap gap-2">
            {user.skillsOffered.map((skill) => (
              <SkillChip key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Wants to learn
          </p>
          <div className="flex flex-wrap gap-2">
            {user.skillsWanted.map((skill) => (
              <SkillChip key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            {user.rating.toFixed(1)}
            <span className="font-normal text-slate-500">({user.reviewCount})</span>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300">
            <ShieldCheck className="size-4" />
            Swap score {user.swapScore}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            to={`/profile/${user.username}`}
          >
            View Profile
          </Link>
          {currentUser ? (
            <Button onClick={() => onRequest(user)}>
              <Sparkles className="size-4" />
              Request Swap
            </Button>
          ) : (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-600 to-tealish-500 px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
              to="/auth"
            >
              Join to Swap
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
