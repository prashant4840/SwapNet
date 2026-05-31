import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentMetadata } from '@/hooks/useDocumentMetadata'
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
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Avatar } from '@/components/common/Avatar'
import { useApp } from '@/context/AppContext'
import { cn } from '@/utils/cn'
import { computeMatchResult, formatRelativeTime } from '@/utils/app'
import { fetchPlatformMetrics, subscribeToMetricsChanges, type PlatformMetrics } from '@/services/platformMetrics'

type LandingLink = {
  kind: 'anchor' | 'route'
  label: string
  value: string
}

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

const landingLinks: LandingLink[] = [
  { label: 'Explore', kind: 'route', value: '/explore' },
  { label: 'How it Works', kind: 'anchor', value: '#how-it-works' },
  { label: 'Community', kind: 'anchor', value: '#community' },
]

const footerQuickLinks: LandingLink[] = [
  { label: 'Explore', kind: 'route', value: '/explore' },
  { label: 'How it Works', kind: 'anchor', value: '#how-it-works' },
  { label: 'Community Board', kind: 'route', value: '/post' },
  { label: 'Get Started', kind: 'route', value: '/auth' },
]

const profileUrl = 'https://github.com/prashant4840'
const repoUrl = 'https://github.com/prashant4840/skillbridge'
const bugUrl = 'https://github.com/prashant4840/skillbridge/issues/new'
const profileAvatarUrl = 'https://github.com/prashant4840.png'

const revealTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
}

const revealViewport = {
  once: true,
  amount: 0.2,
}

const hoverButtonClass = 'transform-gpu transition-all duration-300 hover:scale-105'
const landingPanelClass =
  'glass-panel dark:border-slate-700/80 dark:bg-slate-800/95 dark:shadow-[0_18px_56px_rgba(79,70,229,0.16)]'

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
      <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)]">
        <ArrowLeftRight className="size-5" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">SwapNet</span>
    </a>
  )
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.08-.73.08-.71.08-.71 1.2.08 1.83 1.22 1.83 1.22 1.06 1.82 2.78 1.29 3.46.98.11-.77.42-1.29.75-1.58-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.37 1.22-3.2-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.28 1.22a11.34 11.34 0 0 1 5.97 0c2.28-1.54 3.28-1.22 3.28-1.22.65 1.65.24 2.87.12 3.17.76.83 1.22 1.89 1.22 3.2 0 4.62-2.81 5.63-5.49 5.93.43.37.81 1.08.81 2.19v3.25c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

function LandingNavItem({
  className,
  item,
  onClick,
}: {
  className?: string
  item: LandingLink
  onClick?: () => void
}) {
  const baseClassName = cn(
    'text-sm font-semibold text-slate-700 transition-colors duration-300 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-300',
    className,
  )

  if (item.kind === 'route') {
    return (
      <Link className={baseClassName} onClick={onClick} to={item.value}>
        {item.label}
      </Link>
    )
  }

  return (
    <a className={baseClassName} href={item.value} onClick={onClick}>
      {item.label}
    </a>
  )
}

function ExternalActionLink({
  children,
  className,
  href,
}: {
  children: ReactNode
  className?: string
  href: string
}) {
  return (
    <a
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold',
        hoverButtonClass,
        className,
      )}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
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
    <div className="rounded-3xl border border-white/40 bg-white/72 px-4 py-5 shadow-soft transition-transform duration-300 hover:-translate-y-1 dark:border-slate-700/80 dark:bg-slate-800/95 dark:shadow-[0_18px_48px_rgba(79,70,229,0.18)]">
      <div className="inline-flex rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

export function LandingPage() {
  useDocumentMetadata({
    title: 'SwapNet - Teach what you know, learn what you need',
    description: 'SwapNet is a peer-to-peer skill-sharing community where developers, creators, and professionals trade skills for free. No money involved.',
  })

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

  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadMetrics() {
      try {
        const data = await fetchPlatformMetrics()
        if (active) {
          setMetrics(data)
          setMetricsError(null)
          setMetricsLoading(false)
        }
      } catch (err) {
        if (active) {
          const message = err instanceof Error ? err.message : 'Failed to fetch metrics'
          setMetricsError(message)
          setMetricsLoading(false)
        }
      }
    }

    loadMetrics()

    const unsubscribe = subscribeToMetricsChanges((updatedMetrics) => {
      if (active) {
        setMetrics(updatedMetrics)
        setMetricsError(null)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const metricsData = useMemo(() => {
    if (metricsLoading) {
      return [
        {
          label: 'Loading rating...',
          value: '...',
          icon: Star,
        },
        {
          label: 'Loading completed swaps...',
          value: '...',
          icon: MessageCircleMore,
        },
        {
          label: 'Loading skills...',
          value: '...',
          icon: BriefcaseBusiness,
        },
      ]
    }

    if (metricsError || !metrics) {
      return [
        {
          label: 'Data unavailable',
          value: '—',
          icon: Star,
        },
        {
          label: 'Data unavailable',
          value: '—',
          icon: MessageCircleMore,
        },
        {
          label: 'Data unavailable',
          value: '—',
          icon: BriefcaseBusiness,
        },
      ]
    }

    return [
      {
        label: metrics.averageRating === 0.0 ? 'No ratings yet' : 'Average community rating',
        value: metrics.averageRating === 0.0 ? '0.0' : metrics.averageRating.toFixed(1),
        icon: Star,
      },
      {
        label: 'Completed swap sessions',
        value: String(metrics.completedSwaps),
        icon: MessageCircleMore,
      },
      {
        label: 'Skills tracked across the platform',
        value: String(metrics.trackedSkills),
        icon: BriefcaseBusiness,
      },
    ]
  }, [metrics, metricsLoading, metricsError])

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

  const featuredUsers = useMemo(
    () =>
      currentUser && suggestedMatches.length
        ? suggestedMatches.slice(0, 3)
        : topRatedUsers.map((user) => ({
            ...user,
            match: computeMatchResult(currentUser, user),
          })),
    [currentUser, suggestedMatches, topRatedUsers],
  )

  const activeSwaps = useMemo(
    () => state.swapRequests.filter((swap) => swap.status === 'Accepted').length,
    [state.swapRequests],
  )

  const completedSwaps = useMemo(
    () => state.swapRequests.filter((swap) => swap.status === 'Completed').length,
    [state.swapRequests],
  )

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
        <header
          className={cn(
           // 'fixed left-1/2 top-0 z-50 w-[calc(100%-1.5rem)] max-w-[1200px] -translate-x-1/2 overflow-hidden rounded-b-2xl rounded-t-none border border-[rgba(255,255,255,0.08)] transition-all duration-300 ease-out sm:w-[calc(100%-3rem)]',
           'fixed left-0 top-0 z-50 w-full transition-all duration-300 ease-out',
            isScrolled
              ? 'border-black/5 bg-white/70 backdrop-blur-xl dark:border-brand-400/15 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.82),rgba(15,23,42,0.8))]'
              : 'border-transparent bg-transparent backdrop-blur-0',
          )}
        >
          <div
            className={cn(
             // 'mx-auto flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden px-4 transition-all duration-300 ease-out sm:px-6',
             'mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-3 overflow-hidden px-4 transition-all duration-300 ease-out sm:px-6 lg:px-8',
              isScrolled ? 'py-3' : 'py-4',
            )}
          >
            <LandingBrand />

            <div className="hidden min-w-0 items-center gap-4 md:flex lg:gap-6">
              <nav className="flex min-w-0 items-center gap-4 lg:gap-6">
                {landingLinks.map((item) => (
                  <LandingNavItem item={item} key={item.label} />
                ))}
              </nav>

              <ThemeToggle
                className="rounded-full border-slate-200/70 bg-white/65 px-3 shadow-sm backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/55"
                showLabel={false}
              />

              <ButtonLink
                className={cn(
                  'h-auto shrink-0 rounded-full border-0 bg-brand-600 px-4 py-2 text-white shadow-[0_14px_28px_rgba(79,70,229,0.24)] hover:bg-brand-500 hover:text-white lg:px-6 lg:py-2.5',
                  hoverButtonClass,
                )}
                to="/auth"
                variant="outline"
              >
                Get Started
              </ButtonLink>
            </div>

            <button
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex size-11 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/75 text-slate-700 shadow-soft transition-all duration-300 hover:scale-105 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-brand-400 md:hidden"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              type="button"
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </header>

        <AnimatePresence>
          {isMobileMenuOpen ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-x-4 top-[4.75rem] z-40 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 shadow-soft backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/85 md:hidden"
              exit={{ opacity: 0, y: -12 }}
              initial={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <div className="space-y-2 p-4">
                {landingLinks.map((item) => (
                  <LandingNavItem
                    className="block rounded-2xl px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    item={item}
                    key={item.label}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}

                <div className="grid gap-3 pt-3">
                  <ThemeToggle
                    className="w-full justify-center rounded-2xl border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/80"
                  />

                  <ButtonLink
                    className={cn(
                      'h-auto w-full rounded-2xl border-0 bg-brand-600 px-4 py-2 text-white shadow-soft hover:bg-brand-500 hover:text-white',
                      hoverButtonClass,
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                    to="/auth"
                    variant="outline"
                  >
                    Get Started
                  </ButtonLink>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="page-shell space-y-16 pb-12 pt-0 sm:space-y-20">
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              landingPanelClass,
              'relative overflow-hidden p-8 pt-32 shadow-glow sm:p-10 sm:pt-36 lg:p-14 lg:pt-40',
            )}
            initial={{ opacity: 0, y: 28 }}
            transition={revealTransition}
          >
            <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" />
            <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
              <div className="absolute right-10 top-10 h-28 w-28 animate-float rounded-[2rem] bg-white/60 blur-sm dark:bg-brand-500/20" />
              <div className="absolute bottom-16 right-20 h-48 w-48 animate-float rounded-full bg-teal-300/35 blur-3xl dark:bg-tealish-500/18" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.42),transparent_50%)] dark:bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.24),transparent_52%)]" />
            </div>

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="relative space-y-6">
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(99,102,241,0.16)',
                      '0 0 0 8px rgba(45,212,191,0.08)',
                      '0 0 0 0 rgba(99,102,241,0.16)',
                    ],
                  }}
                  className="inline-flex rounded-full border border-brand-300/70 p-[1px]"
                  transition={{ duration: 4.8, ease: 'easeInOut', repeat: Infinity }}
                >
                  <Badge className="bg-white/75 dark:bg-slate-900/65" tone="brand">
                    Peer-to-peer knowledge barter
                  </Badge>
                </motion.div>

                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    x: [0, 18, -10, 0],
                    y: [0, -10, 12, 0],
                  }}
                  className="pointer-events-none absolute -left-16 top-2 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,rgba(45,212,191,0.1)_42%,transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(79,70,229,0.32)_0%,rgba(13,148,136,0.18)_45%,transparent_74%)]"
                  transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
                />

                <div className="relative space-y-4">
                  <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                    Teach what you know. Learn what you need. No money involved.
                  </h1>
                  <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                    SwapNet connects people who can teach each other. Post your skills,
                    find reciprocal matches, coordinate via chat, and build trust
                    through completed exchanges.
                  </p>
                </div>

                <div className="relative flex flex-col gap-3 sm:flex-row">
                  <ButtonLink
                    className={cn(
                      'h-auto rounded-2xl px-8 py-4 text-base shadow-glow sm:text-lg',
                      hoverButtonClass,
                    )}
                    size="lg"
                    to={currentUser ? '/explore' : '/auth'}
                  >
                    {currentUser ? 'Explore matches' : 'Create your profile'}
                    <ArrowRight className="size-4" />
                  </ButtonLink>
                  <ButtonLink
                    className={cn(
                      'h-auto rounded-2xl px-8 py-4 text-base sm:text-lg',
                      hoverButtonClass,
                    )}
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
                    className={cn(landingPanelClass, 'rounded-[2rem] p-6')}
                    key={user.id}
                    transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        avatarUrl={user.photo}
                        fullName={user.name}
                        size="size-14 rounded-3xl"
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

                <article className={cn(landingPanelClass, 'rounded-[2rem] p-6 sm:col-span-2')}>
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
                        className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/75 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/90 sm:flex-row sm:items-center sm:justify-between"
                        key={user.id}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            avatarUrl={user.photo}
                            fullName={user.name}
                            size="size-11 rounded-2xl"
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
                  className={cn(
                    landingPanelClass,
                    'relative overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1',
                  )}
                  initial={{ opacity: 0, y: 24 }}
                  key={step.title}
                  transition={{ ...revealTransition, delay: index * 0.08 }}
                  viewport={revealViewport}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <span className="pointer-events-none absolute right-4 top-3 select-none text-[5rem] font-extrabold leading-none text-[rgba(99,102,241,0.08)] dark:text-[rgba(255,255,255,0.06)]">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="relative z-10 space-y-4">
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
                <ButtonLink className={hoverButtonClass} to="/explore" variant="outline">
                  See all listings
                </ButtonLink>
              }
              description="Members trading skills across tech, languages, music, design, and more."
              eyebrow="Featured Profiles"
            >
              Top rated skill swappers
            </SectionTitle>
            <div className="grid gap-4 lg:grid-cols-3">
              {topRatedUsers.slice(0, 3).map((user, index) => (
                <motion.div
                  className={cn(landingPanelClass, 'flex flex-col gap-4 p-6')}
                  initial={{ opacity: 0, y: 24 }}
                  key={user.id}
                  transition={{ ...revealTransition, delay: index * 0.08 }}
                  viewport={revealViewport}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      avatarUrl={user.photo}
                      fullName={user.name}
                      size="size-14 rounded-3xl"
                    />
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
            <div className={cn(landingPanelClass, 'p-6')}>
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
                      className="rounded-3xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-800/90"
                      initial={{ opacity: 0, y: 22 }}
                      key={post.id}
                      transition={{ ...revealTransition, delay: index * 0.08 }}
                      viewport={revealViewport}
                      whileInView={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            avatarUrl={author?.photo}
                            fullName={author?.name ?? 'Member'}
                            size="size-10 rounded-2xl"
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

            <div className={cn(landingPanelClass, 'flex flex-col gap-6 p-6')}>
              <div>
                <Badge tone="teal">Trusted reputation loop</Badge>
                <h3 className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">
                  A reputation system built on reliability.
                </h3>
              </div>
              <div className="grid gap-4">
                {metricsData.map((metric, index) => {
                  const Icon = metric.icon
                  return (
                    <motion.div
                      className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/90 dark:shadow-[0_18px_42px_rgba(79,70,229,0.14)]"
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

          <motion.section
            className="py-12 lg:py-20"
            initial={{ opacity: 0, y: 30 }}
            transition={revealTransition}
            viewport={revealViewport}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(254,243,199,0.88),rgba(255,255,255,0.92))] p-6 shadow-[0_18px_60px_rgba(217,119,6,0.12)] dark:border-amber-400/20 dark:bg-[linear-gradient(135deg,rgba(69,39,10,0.76),rgba(120,53,15,0.42),rgba(30,41,59,0.94))] dark:shadow-[0_18px_60px_rgba(245,158,11,0.12)] sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-400/10" />
              <div className="pointer-events-none absolute bottom-0 left-12 h-32 w-32 rounded-full bg-white/40 blur-3xl dark:bg-amber-200/5" />

              <div className="relative max-w-4xl space-y-6">
                <Badge className="bg-white/75 text-amber-800 dark:bg-slate-900/40 dark:text-amber-200" tone="amber">
                  Open Source Support
                </Badge>

                <div className="space-y-3">
                  <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    SwapNet is free, forever.
                  </h2>
                  <p className="max-w-2xl text-base leading-8 text-slate-700 dark:text-slate-200">
                    If it helped you learn something new, consider starring the repo or
                    contributing to the project.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <ExternalActionLink
                    className="bg-slate-950 text-white shadow-soft hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                    href={repoUrl}
                  >
                    <GitHubMark className="size-4" />
                    <span aria-hidden="true">⭐</span>
                    Star on GitHub
                  </ExternalActionLink>

                  <ExternalActionLink
                    className="border border-brand-300 bg-white/80 text-brand-700 shadow-soft hover:border-brand-400 dark:border-brand-300/30 dark:bg-slate-900/45 dark:text-brand-100"
                    href={repoUrl}
                  >
                    <span aria-hidden="true">🤝</span>
                    Contribute
                  </ExternalActionLink>
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
                  Open source · No ads · No paywalls
                </p>

                <div className="flex flex-col gap-4 border-t border-amber-300/40 pt-6 dark:border-amber-300/15 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      avatarUrl={profileAvatarUrl}
                      fullName="Prashant Sharma"
                      size="size-11 rounded-full"
                      className="border border-white/70 shadow-soft dark:border-slate-700"
                    />
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      Built by <span className="font-semibold text-slate-950 dark:text-white">Prashant Sharma</span>
                    </p>
                  </div>

                  <ExternalActionLink
                    className="bg-slate-950 text-white shadow-soft hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                    href={profileUrl}
                  >
                    <GitHubMark className="size-4" />
                    View GitHub Profile
                  </ExternalActionLink>
                </div>
              </div>
            </div>
          </motion.section>
        </main>

        <motion.footer
          className="border-t border-brand-500/15 bg-white/55 py-12 backdrop-blur-sm dark:bg-slate-950/45 lg:py-20"
          initial={{ opacity: 0, y: 24 }}
          transition={revealTransition}
          viewport={revealViewport}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-[1.1fr_0.8fr_1fr]">
              <div className="space-y-4">
                <LandingBrand />
                <p className="max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Trade what you know for what you want to learn.
                </p>
                <a
                  className={cn(
                    'inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white/75 text-slate-700 shadow-soft dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-100',
                    hoverButtonClass,
                  )}
                  href={profileUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <GitHubMark className="size-4" />
                  <span className="sr-only">GitHub profile</span>
                </a>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-300">
                  Quick Links
                </h3>
                <div className="flex flex-col gap-3">
                  {footerQuickLinks.map((item) => (
                    <LandingNavItem item={item} key={item.label} />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-300">
                  Open Source
                </h3>
                <div className="flex flex-col gap-3">
                  <a
                    className="text-sm font-semibold text-slate-700 transition-colors duration-300 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-300"
                    href={repoUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View on GitHub
                  </a>
                  <a
                    className="text-sm font-semibold text-slate-700 transition-colors duration-300 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-300"
                    href={bugUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Report a Bug
                  </a>
                  <a
                    className="text-sm font-semibold text-slate-700 transition-colors duration-300 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-300"
                    href={repoUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Contribute
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-brand-500/15 pt-6 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} SwapNet</p>
              <p>Made with ☕ and React by Prashant</p>
            </div>
          </div>
        </motion.footer>
      </div>
    </PageTransition>
  )
}
