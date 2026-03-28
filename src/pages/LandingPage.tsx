import { motion } from 'framer-motion'
import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { ButtonLink } from '@/components/common/ButtonLink'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { SkillChip } from '@/components/common/SkillChip'
import { useApp } from '@/context/AppContext'
import { computeMatchResult, formatRelativeTime } from '@/utils/app'

const steps = [
  {
    title: 'Create your skill identity',
    description: 'Add your city, bio, availability, and the skills you can teach or want to learn.',
    icon: Sparkles,
  },
  {
    title: 'Browse reciprocal swaps',
    description: 'Search the live board, compare offers and wants, and spot perfect matches instantly.',
    icon: Compass,
  },
  {
    title: 'Coordinate in chat',
    description: 'Once accepted, move into a preserved 1-on-1 chat and share session links.',
    icon: MessageCircleMore,
  },
  {
    title: 'Build trust with reviews',
    description: 'Complete swaps, leave ratings, and raise your reputation across the community.',
    icon: ShieldCheck,
  },
]

export function LandingPage() {
  const {
    currentUser,
    newTodayUsers,
    state,
    suggestedMatches,
    topRatedUsers,
    users,
  } = useApp()

  const featuredUsers =
    currentUser && suggestedMatches.length
      ? suggestedMatches.slice(0, 3)
      : topRatedUsers.map((user) => ({
          ...user,
          match: computeMatchResult(currentUser, user),
        }))

  const activeSwaps = state.swapRequests.filter((swap) => swap.status === 'Accepted').length
  const completedSwaps = state.swapRequests.filter((swap) => swap.status === 'Completed').length
  const averageRating = (
    users.reduce((sum, user) => sum + user.rating, 0) / Math.max(users.length, 1)
  ).toFixed(1)

  return (
    <PageTransition>
      <main className="page-shell space-y-16 pb-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-hero-gradient p-8 shadow-glow dark:bg-hero-gradient-dark sm:p-10 lg:p-14">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
            <div className="absolute right-10 top-8 h-28 w-28 animate-float rounded-[2rem] bg-white/60 blur-sm dark:bg-brand-500/10" />
            <div className="absolute bottom-16 right-24 h-44 w-44 animate-float rounded-full bg-teal-300/40 blur-3xl dark:bg-teal-500/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.42),transparent_50%)] dark:bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_50%)]" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <Badge tone="brand">Peer-to-peer knowledge barter</Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                  Teach what you know. Learn what you need. No money involved.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                  SkillBridge matches people who can teach each other. Post your offers,
                  browse live community listings, request a swap, chat, schedule sessions,
                  and review the experience once you both finish.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink size="lg" to={currentUser ? '/explore' : '/auth'}>
                  {currentUser ? 'Explore matches' : 'Create your profile'}
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink size="lg" to="/explore" variant="outline">
                  Browse live listings
                </ButtonLink>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Members', value: users.length.toString().padStart(2, '0') },
                  { label: 'Active swaps', value: activeSwaps.toString() },
                  { label: 'Completed', value: completedSwaps.toString() },
                ].map((stat) => (
                  <div
                    className="rounded-3xl border border-white/40 bg-white/70 px-4 py-5 dark:border-slate-700/70 dark:bg-slate-900/70"
                    key={stat.label}
                  >
                    <p className="text-sm text-slate-500 dark:text-slate-300">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featuredUsers.slice(0, 2).map((user, index) => (
                <motion.article
                  animate={{ y: [0, index % 2 === 0 ? -6 : 6, 0] }}
                  className="glass-panel rounded-[2rem] p-5"
                  key={user.id}
                  transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      alt={user.name}
                      className="size-14 rounded-3xl object-cover"
                      src={user.photo}
                    />
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{user.city}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {user.headline}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.skillsOffered.slice(0, 2).map((skill) => (
                      <SkillChip key={skill.id} skill={skill} />
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      {user.rating.toFixed(1)}
                    </div>
                    <Badge tone={user.match.score >= 80 ? 'teal' : 'slate'}>
                      {user.match.score}% match
                    </Badge>
                  </div>
                </motion.article>
              ))}

              <article className="glass-panel rounded-[2rem] p-5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-300">
                      Live feed snapshot
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                      New members joining today
                    </h3>
                  </div>
                  <Badge tone="amber">🔥 New Today</Badge>
                </div>
                <div className="mt-4 space-y-4">
                  {newTodayUsers.map((user) => (
                    <div
                      className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/75 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between"
                      key={user.id}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          alt={user.name}
                          className="size-11 rounded-2xl object-cover"
                          src={user.photo}
                        />
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-300">
                            Joined {formatRelativeTime(user.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {user.skillsWanted.slice(0, 2).map((skill) => (
                          <SkillChip key={skill.id} skill={skill} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div className="glass-panel space-y-4 p-6" key={step.title}>
                <div className="inline-flex rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </section>

        <section className="space-y-6">
          <SectionTitle
            action={
              <ButtonLink to="/explore" variant="outline">
                See all listings
              </ButtonLink>
            }
            description="Meet members already trading music, tech, languages, wellness, and more."
            eyebrow="Featured Profiles"
          >
            Top rated skill swappers
          </SectionTitle>
          <div className="grid gap-4 lg:grid-cols-3">
            {topRatedUsers.slice(0, 3).map((user) => (
              <div className="glass-panel flex flex-col gap-4 p-5" key={user.id}>
                <div className="flex items-center gap-3">
                  <img alt={user.name} className="size-14 rounded-3xl object-cover" src={user.photo} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-950 dark:text-white">{user.name}</h3>
                      <Badge tone="amber">⭐ {user.rating.toFixed(1)}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{user.city}</p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{user.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {user.skillsOffered.slice(0, 3).map((skill) => (
                    <SkillChip key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel p-6">
            <SectionTitle
              description="Short requests from members looking for a knowledge trade right now."
              eyebrow="Community Board"
            >
              Looking for posts
            </SectionTitle>
            <div className="mt-6 space-y-4">
              {state.posts.slice(0, 3).map((post) => {
                const author = users.find((user) => user.id === post.userId)
                return (
                  <div
                    className="rounded-3xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/75"
                    key={post.id}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          alt={author?.name ?? 'Member'}
                          className="size-10 rounded-2xl object-cover"
                          src={author?.photo}
                        />
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">
                            {author?.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-300">
                            {post.city}
                          </p>
                        </div>
                      </div>
                      <Badge tone="teal">{post.skillName}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {post.note}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-panel flex flex-col gap-6 p-6">
            <div>
              <Badge tone="teal">Trusted reputation loop</Badge>
              <h3 className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">
                A reputation system built around generosity and follow-through.
              </h3>
            </div>
            <div className="grid gap-4">
              {[
                {
                  label: 'Average community rating',
                  value: averageRating,
                  icon: Star,
                },
                {
                  label: 'Completed swap sessions',
                  value: completedSwaps.toString(),
                  icon: MessageCircleMore,
                },
                {
                  label: 'Skills tracked across the board',
                  value: '40+',
                  icon: BriefcaseBusiness,
                },
              ].map((metric) => {
                const Icon = metric.icon
                return (
                  <div
                    className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80"
                    key={metric.label}
                  >
                    <div className="inline-flex rounded-2xl bg-white p-3 text-brand-700 dark:bg-slate-900 dark:text-brand-200">
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {metric.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  )
}
