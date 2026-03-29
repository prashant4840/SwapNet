import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, MonitorPlay, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { SkillChip } from '@/components/common/SkillChip'
import { useApp } from '@/context/AppContext'
import type { MatchResult, UserProfile } from '@/types'
import { memo } from 'react'

interface UserCardProps {
  user: UserProfile
  match: MatchResult
  onRequest: (user: UserProfile) => void
}

export const UserCard = memo(function UserCard({ user, match, onRequest }: UserCardProps) {
  const { currentUser, sendConnectionRequest } = useApp()

  return (
    <article className="group glass-panel flex h-full flex-col gap-5 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(79,70,229,0.16)] dark:hover:shadow-[0_28px_70px_rgba(79,70,229,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            alt={user.name}
            className="size-16 rounded-3xl object-cover ring-4 ring-white/70 dark:ring-slate-800/80"
            src={user.photo}
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">{user.name}</h3>
              {match.matchType === 'perfect' ? <Badge tone="brand">Perfect Match</Badge> : null}
              {user.rating >= 4.8 ? <Badge tone="amber">Top Rated</Badge> : null}
              {user.badges.includes('Active User') ? <Badge tone="teal">Active User</Badge> : null}
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

        <div className="rounded-[1.25rem] border border-brand-200/70 bg-brand-50/90 px-3 py-2 text-right dark:border-brand-400/20 dark:bg-brand-500/10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Match
          </p>
          <p className="text-xl font-bold text-brand-700 dark:text-brand-200">{match.score}%</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.headline}</p>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{user.bio}</p>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-900/70">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Why this match works
          </p>
          <Badge tone={match.matchType === 'perfect' ? 'brand' : match.matchType === 'good' ? 'teal' : 'slate'}>
            {match.matchType}
          </Badge>
        </div>
        <div className="mt-3 space-y-2">
          {match.reasons.slice(0, 3).map((reason) => (
            <p
              className="inline-flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
              key={reason}
            >
              <Zap className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" />
              <span>{reason}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Skills offered
          </p>
          <div className="flex flex-wrap gap-2">
            {user.skillsOffered.map((skill) => (
              <SkillChip key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Wants to learn
          </p>
          <div className="flex flex-wrap gap-2">
            {user.skillsWanted.map((skill) => (
              <SkillChip key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-4 border-t border-slate-200/80 pt-4 dark:border-slate-700/80">
        <div className="flex items-center justify-between gap-4">
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
          <Link
            className="inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            to={`/profile/${user.username}`}
          >
            View Profile
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {currentUser ? (
            <>
              <Button
                onClick={() =>
                  sendConnectionRequest({
                    receiverId: user.id,
                    message: `Hi ${user.name.split(' ')[0]}, your profile looks like a strong fit for a SkillBridge connection.`,
                  })
                }
                className="h-11"
                variant="outline"
              >
                Connect
              </Button>
              <Button className="h-11" onClick={() => onRequest(user)}>
                <Sparkles className="size-4" />
                Request Swap
              </Button>
            </>
          ) : (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-600 to-tealish-500 px-4 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 sm:col-span-2"
              to="/auth"
            >
              Join to connect
            </Link>
          )}
        </div>
      </div>
    </article>
  )
})
