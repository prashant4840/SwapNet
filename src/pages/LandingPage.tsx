import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle,
  Compass,
  Menu,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { ButtonLink } from '@/components/common/ButtonLink'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { SkillChip } from '@/components/common/SkillChip'
import { useApp } from '@/context/AppContext'
import { cn } from '@/utils/cn'
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

const landingLinks = [
  { label: 'Explore', to: '/explore' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Community', href: '#community' },
] as const

const githubUrl = 'https://github.com/prashant4840/SkillBridge'

const revealTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
}

const revealViewport = {
  once: true,
  amount: 0.2,
}

function useEnteredViewport<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T | null>(null)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || hasEntered) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [hasEntered, threshold])

  return [ref, hasEntered] as const
}

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) {
      return
    }

    let frame = 0
    const startedAt = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick)
      }
    }

    frame = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frame)
  }, [active, duration, target])

  return value
}

function LandingBrand({ className }: { className?: string }) {
  return (
    <a
      className={cn('inline-flex items-center gap-3 text-slate-950 dark:text-white', className)}
      href="#top"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow">
        <ArrowLeftRight className="size-5" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">SkillBridge</span>
    </a>
  )
}

function LandingNavItem({
  className,
  href,
  label,
  onClick,
  to,
}: {
  className?: string
  href?: string
  label: string
  onClick?: () => void
  to?: string
}) {
  const baseClassName = cn(
    'text-sm font-semibold text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300',
    className,
  )

  if (to) {
    return (
      <Link className={baseClassName} onClick={onClick} to={to}>
        {label}
      </Link>
    )
  }

  return (
    <a className={baseClassName} href={href} onClick={onClick}>
      {label}
    </a>
  )
}

function CountUpStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-3xl border border-white/40 bg-white/72 px-4 py-5 shadow-soft transition-transform duration-300 hover:-translate-y-1 dark:border-slate-700/70 dark:bg-slate-900/72">
      <div className="inline-flex rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

export function LandingPage() {
  const {
    currentUser,
    newTodayUsers,
    state,
    suggestedMatches,
    topRatedUsers,
    users,
  } = useApp()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [statsRef, statsVisible] = useEnteredViewport<HTMLDivElement>(0.35)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    const closeMenu = () => setIsMobileMenuOpen(false)
    window.addEventListener('scroll', closeMenu, { passive: true })

    return () => window.removeEventListener('scroll', closeMenu)
  }, [isMobileMenuOpen])

  const featuredUsers =
    currentUser && suggestedMatches.length
      ? suggestedMatches.slice(0, 3)
      : topRatedUsers.map((user) => ({
          ...user,
          match: computeMatchResult(currentUser, user),
        }))

  const activeSwaps = state.swapRequests.filter((swap) => swap.status === 'Accepted').length
  const completedSwaps = state.swapRequests.filter((swap) => swap.status === 'Completed').length

  const animatedMembers = useCountUp(users.length, statsVisible)
  const animatedActiveSwaps = useCountUp(activeSwaps, statsVisible)
  const animatedCompletedSwaps = useCountUp(completedSwaps, statsVisible)

  const stats = [
    {
      label: 'Members',
      value: animatedMembers.toString().padStart(2, '0'),
      icon: Users,
    },
    {
      label: 'Active swaps',
      value: animatedActiveSwaps.toString(),
      icon: ArrowLeftRight,
    },
    {
      label: 'Completed',
      value: animatedCompletedSwaps.toString(),
      icon: CheckCircle,
    },
  ]

  return (
    <PageTransition>
      <div id="top" className="relative">
        <header className="fixed inset-x-0 top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div
              className={cn(
                'rounded-[1.75rem] px-4 py-3 transition-all duration-300 sm:px-5',
                isScrolled
                  ? 'border border-slate-200/80 bg-white shadow-soft dark:border-slate-800 dark:bg-[#0F172A]'
                  : 'border border-transparent bg-transparent shadow-none',
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <LandingBrand />

                <div className="hidden items-center gap-8 md:flex">
                  <nav className="flex items-center gap-6">
                    {landingLinks.map((item) => (
                      <LandingNavItem
                        href={'href' in item ? item.href : undefined}
                        key={item.label}
                        label={item.label}
                        to={'to' in item ? item.to : undefined}
                      />
                    ))}
                  </nav>

                  <ButtonLink
                    className="h-11 rounded-full border-0 bg-brand-600 px-5 text-white shadow-soft hover:bg-brand-500 hover:text-white dark:bg-brand-500 dark:hover:bg-brand-400"
                    to="/auth"
                    variant="outline"
                  >
                    Get Started
                  </ButtonLink>
                </div>

                <button
                  aria-expanded={isMobileMenuOpen}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  className="inline-flex size-11 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 text-slate-700 shadow-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200 dark:hover:border-brand-400 md:hidden"
                  onClick={() => setIsMobileMenuOpen((current) => !current)}
                  type="button"
                >
                  {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {isMobileMenuOpen ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-x-4 top-20 z-40 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/95 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-[#0F172A]/95 md:hidden"
              exit={{ opacity: 0, y: -12 }}
              initial={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <div className="space-y-2 p-4">
                {landingLinks.map((item) => (
                  <LandingNavItem
                    className="block rounded-2xl px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    href={'href' in item ? item.href : undefined}
                    key={item.label}
                    label={item.label}
                    onClick={() => setIsMobileMenuOpen(false)}
                    to={'to' in item ? item.to : undefined}
                  />
                ))}
                <ButtonLink
                  className="mt-2 h-11 w-full rounded-2xl border-0 bg-brand-600 px-5 text-white shadow-soft hover:bg-brand-500 hover:text-white dark:bg-brand-500 dark:hover:bg-brand-400"
                  onClick={() => setIsMobileMenuOpen(false)}
                  to="/auth"
                  variant="outline"
                >
                  Get Started
                </ButtonLink>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="page-shell space-y-16 pb-12">
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-hero-gradient p-8 pt-24 shadow-glow dark:bg-hero-gradient-dark sm:p-10 sm:pt-28 lg:p-14 lg:pt-24"
            initial={{ opacity: 0, y: 28 }}
            transition={revealTransition}
          >
            <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
              <div className="absolute right-10 top-8 h-28 w-28 animate-float rounded-[2rem] bg-white/60 blur-sm dark:bg-brand-500/10" />
              <div className="absolute bottom-16 right-24 h-44 w-44 animate-float rounded-full bg-teal-300/40 blur-3xl dark:bg-teal-500/10" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.42),transparent_50%)] dark:bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_50%)]" />
            </div>

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="relative space-y-6">
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(99,102,241,0.16)',
                      '0 0 0 7px rgba(45,212,191,0.08)',
                      '0 0 0 0 rgba(99,102,241,0.16)',
                    ],
                  }}
                  className="inline-flex rounded-full border border-brand-300/70 p-[1px]"
                  transition={{ duration: 4.8, ease: 'easeInOut', repeat: Infinity }}
                >
                  <Badge className="bg-white/70 dark:bg-slate-950/70" tone="brand">
                    Peer-to-peer knowledge barter
                  </Badge>
                </motion.div>

                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    x: [0, 18, -10, 0],
                    y: [0, -10, 12, 0],
                  }}
                  className="pointer-events-none absolute -left-16 top-2 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,rgba(45,212,191,0.1)_42%,transparent_72%)] blur-3xl"
                  transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
                />

                <div className="relative space-y-4">
                  <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                    Teach what you know. Learn what you need. No money involved.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                    SkillBridge matches people who can teach each other. Post your offers,
                    browse live community listings, request a swap, chat, schedule sessions,
                    and review the experience once you both finish.
                  </p>
                </div>

                <div className="relative flex flex-col gap-3 sm:flex-row">
                  <ButtonLink
                    className="h-auto rounded-2xl px-8 py-4 text-base shadow-glow sm:text-lg"
                    size="lg"
                    to={currentUser ? '/explore' : '/auth'}
                  >
                    {currentUser ? 'Explore matches' : 'Create your profile'}
                    <ArrowRight className="size-4" />
                  </ButtonLink>
                  <ButtonLink
                    className="h-auto rounded-2xl px-8 py-4 text-base sm:text-lg"
                    size="lg"
                    to="/explore"
                    variant="outline"
                  >
                    Browse live listings
                  </ButtonLink>
                </div>

                <div ref={statsRef} className="grid gap-4 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <CountUpStat icon={stat.icon} key={stat.label} label={stat.label} value={stat.value} />
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
          </motion.section>

          <motion.section
            className="grid scroll-mt-28 gap-4 md:grid-cols-4"
            id="how-it-works"
            initial={{ opacity: 0, y: 30 }}
            transition={revealTransition}
            viewport={revealViewport}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  className="glass-panel relative overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1"
                  initial={{ opacity: 0, y: 24 }}
                  key={step.title}
                  transition={{ ...revealTransition, delay: index * 0.08 }}
                  viewport={revealViewport}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <span className="absolute left-4 top-1 text-[4.5rem] font-black leading-none text-slate-200/75 dark:text-slate-800/70">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="relative space-y-4">
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
                </motion.div>
              )
            })}
          </motion.section>

          <motion.section
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            transition={revealTransition}
            viewport={revealViewport}
            whileInView={{ opacity: 1, y: 0 }}
          >
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
              {topRatedUsers.slice(0, 3).map((user, index) => (
                <motion.div
                  className="glass-panel flex flex-col gap-4 p-5"
                  initial={{ opacity: 0, y: 24 }}
                  key={user.id}
                  transition={{ ...revealTransition, delay: index * 0.08 }}
                  viewport={revealViewport}
                  whileInView={{ opacity: 1, y: 0 }}
                >
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
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="grid scroll-mt-28 gap-6 lg:grid-cols-[1.1fr_0.9fr]"
            id="community"
            initial={{ opacity: 0, y: 30 }}
            transition={revealTransition}
            viewport={revealViewport}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="glass-panel p-6">
              <SectionTitle
                description="Short requests from members looking for a knowledge trade right now."
                eyebrow="Community Board"
              >
                Looking for posts
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {state.posts.slice(0, 3).map((post, index) => {
                  const author = users.find((user) => user.id === post.userId)
                  return (
                    <motion.div
                      className="rounded-3xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/75"
                      initial={{ opacity: 0, y: 22 }}
                      key={post.id}
                      transition={{ ...revealTransition, delay: index * 0.08 }}
                      viewport={revealViewport}
                      whileInView={{ opacity: 1, y: 0 }}
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
                    </motion.div>
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
                    value: '4.8',
                    icon: Star,
                  },
                  {
                    label: 'Completed swap sessions',
                    value: '240+',
                    icon: MessageCircleMore,
                  },
                  {
                    label: 'Skills tracked across the board',
                    value: '120+',
                    icon: BriefcaseBusiness,
                  },
                ].map((metric, index) => {
                  const Icon = metric.icon
                  return (
                    <motion.div
                      className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80"
                      initial={{ opacity: 0, y: 22 }}
                      key={metric.label}
                      transition={{ ...revealTransition, delay: index * 0.08 }}
                      viewport={revealViewport}
                      whileInView={{ opacity: 1, y: 0 }}
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
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.section>
        </main>

        <motion.footer
          className="border-t border-slate-200/80 bg-white/55 py-8 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/40"
          initial={{ opacity: 0, y: 24 }}
          transition={revealTransition}
          viewport={revealViewport}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3 md:items-center lg:px-8">
            <div className="space-y-3">
              <LandingBrand />
              <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">
                Trade what you know for what you want to learn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:justify-center">
              <LandingNavItem label="Explore" to="/explore" />
              <a
                className="text-sm font-semibold text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
                href={githubUrl}
                rel="noreferrer"
                target="_blank"
              >
                GitHub
              </a>
              <LandingNavItem href="#how-it-works" label="How it Works" />
            </div>

            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300 md:text-right">
              <p>Built with React + Supabase</p>
              <p className="font-semibold text-slate-950 dark:text-white">@prashant4840</p>
            </div>
          </div>
        </motion.footer>
      </div>
    </PageTransition>
  )
}
