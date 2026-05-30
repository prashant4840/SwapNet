import { useDeferredValue, useState, useEffect, startTransition, type ReactNode, useMemo } from 'react'
import {
  ArrowUpDown,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ButtonLink } from '@/components/common/ButtonLink'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { SwapRequestModal } from '@/components/feed/SwapRequestModal'
import { UserCard } from '@/components/feed/UserCard'
import { useApp } from '@/context/AppContext'
import { skillCategories } from '@/data/skills'
import type { FeedFilters, UserProfile, SkillEntry, MatchResult } from '@/types'
import { computeMatchResult, uniqueCities } from '@/utils/app'
import { useDebounce } from '@/hooks/useDebounce'

const initialFilters: FeedFilters = {
  query: '',
  category: 'All',
  city: 'All',
  mode: 'All',
  rating: 'All',
  sort: 'match',
  perfectOnly: false,
  nearbyOnly: false,
  topRatedOnly: false,
}

function modeMatches(filter: FeedFilters['mode'], mode: UserProfile['mode']) {
  if (filter === 'All') {
    return true
  }

  if (filter === 'Online') {
    return mode === 'Online' || mode === 'Both'
  }

  if (filter === 'In-person') {
    return mode === 'In-person' || mode === 'Both'
  }

  return mode === filter
}

function minimumRating(filter: FeedFilters['rating']) {
  if (filter === '3+') {
    return 3
  }

  if (filter === '4+') {
    return 4
  }

  if (filter === '4.5+') {
    return 4.5
  }

  return 0
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
        active
          ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-soft dark:border-brand-400/40 dark:bg-brand-500/15 dark:text-brand-200'
          : 'border-slate-200/80 bg-white/75 text-slate-600 hover:border-brand-200 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:border-brand-400/30 dark:hover:text-white'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

export function ExplorePage() {
  const { currentUser, state, suggestedMatches, loading } = useApp()
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const deferredQuery = useDeferredValue(filters.query)
  const debouncedQuery = useDebounce(deferredQuery, 300)
  const query = debouncedQuery.trim().toLowerCase()

  const deferredFilters = useDeferredValue(filters)

  const memoizedResults = useMemo(() => {
    const deferredResults = currentUser
      ? state.users
          .filter((user) => user.id !== currentUser.id)
          .map((user) => ({
            user,
            match: computeMatchResult(currentUser, user),
          }))
      : state.users.map((user) => ({
          user,
          match: {
            score: 0,
            matchType: 'partial' as const,
            isPerfect: false,
            matchesOffering: [],
            matchesLearning: [],
            reasons: ['Sign in to see match reasons.'],
            sharedAvailability: [],
            locationBonus: false,
            ratingBoost: false,
          },
        }))

    return deferredResults.filter(({ user, match }: { user: UserProfile; match: MatchResult }) => {
      // Query filtering
      if (query && !user.name.toLowerCase().includes(query) && 
          !user.skillsOffered?.some((s: SkillEntry) => s.name.toLowerCase().includes(query)) &&
          !user.skillsWanted?.some((s: SkillEntry) => s.name.toLowerCase().includes(query))) {
        return false
      }

      if (deferredFilters.category !== 'All') {
        const matchesCategory = [...user.skillsOffered, ...user.skillsWanted].some(
          (skill) => skill.category === deferredFilters.category,
        )
        if (!matchesCategory) return false
      }

      if (deferredFilters.city !== 'All' && user.city !== deferredFilters.city) {
        return false
      }

      if (!modeMatches(deferredFilters.mode, user.mode)) {
        return false
      }

      const minRating = minimumRating(deferredFilters.rating)
      if (deferredFilters.rating !== 'All' && user.rating < minRating) {
        return false
      }

      if (deferredFilters.perfectOnly && match.matchType !== 'perfect') {
        return false
      }

      if (deferredFilters.nearbyOnly && currentUser && user.city !== currentUser.city) {
        return false
      }

      if (deferredFilters.topRatedOnly && user.rating < 4.8) {
        return false
      }

      if (deferredFilters.query) {
        const searchLower = deferredFilters.query.toLowerCase()
        return (
          user.name.toLowerCase().includes(searchLower) ||
          user.headline.toLowerCase().includes(searchLower) ||
          user.bio.toLowerCase().includes(searchLower) ||
          user.skillsOffered.some((skill) => skill.name.toLowerCase().includes(searchLower)) ||
          user.skillsWanted.some((skill) => skill.name.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
  }, [state.users, currentUser, deferredFilters, query])

  const paginatedResults = useMemo(() => {
    const startIndex = (page - 1) * 6
    return memoizedResults.slice(startIndex, startIndex + 6)
  }, [memoizedResults, page])

  const sortedResults = useMemo(() => {
    return paginatedResults.sort((left, right) => {
      if (filters.sort === 'rating') {
        return (
          right.user.rating - left.user.rating ||
          right.user.swapScore - left.user.swapScore ||
          right.match.score - left.match.score
        )
      }

      if (filters.sort === 'recent') {
        return (
          new Date(right.user.lastActiveAt).getTime() - new Date(left.user.lastActiveAt).getTime() ||
          right.match.score - left.match.score
        )
      }

      return right.match.score - left.match.score || right.user.rating - left.user.rating
    })
  }, [paginatedResults, filters.sort])

  const perPage = 6
  const visibleResults = sortedResults.slice(0, page * perPage)

  useEffect(() => {
    if (!loading) {
      startTransition(() => {
        setIsInitialLoad(false)
      })
    }
  }, [loading])

  async function handleRefresh() {
    setIsRefreshing(true)
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  function SkeletonCard() {
    return (
      <div className="glass-panel p-5 space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-3xl bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <section className="glass-panel overflow-hidden p-6 sm:p-8">
          <div className="relative space-y-8">
            <div className="absolute inset-x-0 top-0 h-40 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_46%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.12),transparent_38%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_46%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.16),transparent_38%)]" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-3">
                <Badge tone="brand">Smart Match Feed</Badge>
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    Discover people you can actually learn with.
                  </h1>
                  <Button
                    disabled={isRefreshing || loading}
                    onClick={handleRefresh}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  Explore reciprocal skill matches sorted by compatibility, availability,
                  proximity, and trust signals. The strongest swaps rise to the top by default.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[24rem]">
                {[
                  {
                    label: 'Perfect matches',
                    value: sortedResults.filter((entry) => entry.match.matchType === 'perfect').length,
                  },
                  {
                    label: 'Top rated',
                    value: sortedResults.filter((entry) => entry.user.rating >= 4.8).length,
                  },
                  {
                    label: 'Nearby',
                    value: currentUser
                      ? sortedResults.filter((entry) => entry.user.city === currentUser.city).length
                      : sortedResults.length,
                  },
                ].map((stat) => (
                  <div
                    className="rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                    key={stat.label}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="premium-input w-full rounded-[1.5rem] py-3 pl-11 pr-4"
                  onChange={(event) => {
                    setPage(1)
                    setFilters((current) => ({ ...current, query: event.target.value }))
                  }}
                  placeholder="Search skills, cities, or people"
                  value={filters.query}
                />
              </label>

              <select
                className="premium-input rounded-[1.5rem] px-4 py-3"
                onChange={(event) => {
                  setPage(1)
                  setFilters((current) => ({
                    ...current,
                    category: event.target.value as FeedFilters['category'],
                  }))
                }}
                value={filters.category}
              >
                <option value="All">All categories</option>
                {skillCategories.map((entry) => (
                  <option key={entry.category} value={entry.category}>
                    {entry.category}
                  </option>
                ))}
              </select>

              <select
                className="premium-input rounded-[1.5rem] px-4 py-3"
                onChange={(event) => {
                  setPage(1)
                  setFilters((current) => ({ ...current, city: event.target.value }))
                }}
                value={filters.city}
              >
                <option value="All">All cities</option>
                {uniqueCities(state.users).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <select
                className="premium-input rounded-[1.5rem] px-4 py-3"
                onChange={(event) => {
                  setPage(1)
                  setFilters((current) => ({
                    ...current,
                    mode: event.target.value as FeedFilters['mode'],
                  }))
                }}
                value={filters.mode}
              >
                <option value="All">All modes</option>
                <option value="Online">Online</option>
                <option value="In-person">In-person</option>
                <option value="Both">Both</option>
              </select>

              <select
                className="premium-input rounded-[1.5rem] px-4 py-3"
                onChange={(event) => {
                  setPage(1)
                  setFilters((current) => ({
                    ...current,
                    rating: event.target.value as FeedFilters['rating'],
                  }))
                }}
                value={filters.rating}
              >
                <option value="All">All ratings</option>
                <option value="3+">3+ stars</option>
                <option value="4+">4+ stars</option>
                <option value="4.5+">4.5+ stars</option>
              </select>
            </div>

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300">
                  <SlidersHorizontal className="size-4" />
                  Filters
                </div>
                <ToggleButton
                  active={filters.perfectOnly}
                  onClick={() => {
                    setPage(1)
                    setFilters((current) => ({
                      ...current,
                      perfectOnly: !current.perfectOnly,
                    }))
                  }}
                >
                  <Sparkles className="size-4" />
                  Perfect only
                </ToggleButton>
                <ToggleButton
                  active={filters.nearbyOnly}
                  onClick={() => {
                    setPage(1)
                    setFilters((current) => ({
                      ...current,
                      nearbyOnly: !current.nearbyOnly,
                    }))
                  }}
                >
                  <MapPin className="size-4" />
                  Nearby
                </ToggleButton>
                <ToggleButton
                  active={filters.topRatedOnly}
                  onClick={() => {
                    setPage(1)
                    setFilters((current) => ({
                      ...current,
                      topRatedOnly: !current.topRatedOnly,
                    }))
                  }}
                >
                  <Star className="size-4" />
                  Top rated
                </ToggleButton>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 p-1 dark:border-slate-700/80 dark:bg-slate-900/80">
                {[
                  { value: 'match', label: 'Best match' },
                  { value: 'rating', label: 'Top rated' },
                  { value: 'recent', label: 'Recently active' },
                ].map((option) => (
                  <button
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      filters.sort === option.value
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-500 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                    }`}
                    key={option.value}
                    onClick={() => {
                      setPage(1)
                      setFilters((current) => ({
                        ...current,
                        sort: option.value as FeedFilters['sort'],
                      }))
                    }}
                    type="button"
                  >
                    <ArrowUpDown className="size-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {currentUser && suggestedMatches.length ? (
          <section className="space-y-4">
            <SectionTitle
              description="Daily recommendations explain exactly why each profile is relevant to you."
              eyebrow="Recommended Matches"
            >
              Best next people to reach out to
            </SectionTitle>
            <div className="grid gap-4 xl:grid-cols-3">
              {suggestedMatches.slice(0, 3).map((entry) => (
                <div
                  className="glass-panel flex h-full flex-col gap-4 p-5"
                  key={entry.id}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        alt={entry.name}
                        className="size-14 rounded-3xl object-cover"
                        src={entry.photo}
                      />
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {entry.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                          {entry.city} · {entry.mode}
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={
                        entry.match.matchType === 'perfect'
                          ? 'brand'
                          : entry.match.matchType === 'good'
                            ? 'teal'
                            : 'slate'
                      }
                    >
                      {entry.match.score}% match
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {(entry.match.reasons ?? []).slice(0, 3).map((reason) => (
                      <p
                        className="inline-flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                        key={reason}
                      >
                        <Zap className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" />
                        <span>{reason}</span>
                      </p>
                    ))}
                  </div>

                  <div className="mt-auto flex gap-2">
                    <Button className="flex-1" onClick={() => setSelectedUser(entry)} size="sm">
                      Request Swap
                    </Button>
                    <ButtonLink size="sm" to={`/profile/${entry.username}`} variant="outline">
                      View
                    </ButtonLink>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <SectionTitle
            description={`${sortedResults.length} members match your current filters.`}
            eyebrow="Explore Community"
          >
            Browse profiles ranked for relevance
          </SectionTitle>

          {isInitialLoad ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {[...Array(6)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : visibleResults.length ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {visibleResults.map(({ user, match }) => (
                <UserCard key={user.id} match={match} onRequest={setSelectedUser} user={user} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matches for these filters"
              description="Try widening the city, rating, or match filters to surface more peers."
              action={
                <Button
                  onClick={() => {
                    setPage(1)
                    setFilters(initialFilters)
                  }}
                  variant="outline"
                >
                  Reset filters
                </Button>
              }
            />
          )}

          {visibleResults.length < sortedResults.length ? (
            <div className="flex justify-center pt-2">
              <Button onClick={() => setPage((current) => current + 1)} variant="outline">
                Load more matches
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <SwapRequestModal
        isOpen={Boolean(selectedUser)}
        key={selectedUser?.id ?? 'swap-request'}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </PageTransition>
  )
}
