import { useDeferredValue, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
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
import type { FeedFilters, UserProfile } from '@/types'
import { computeMatchResult, uniqueCities } from '@/utils/app'

const initialFilters: FeedFilters = {
  query: '',
  category: 'All',
  city: 'All',
  mode: 'All',
  rating: 'All',
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

export function ExplorePage() {
  const { currentUser, state, suggestedMatches } = useApp()
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const deferredQuery = useDeferredValue(filters.query)
  const query = deferredQuery.trim().toLowerCase()

  const results = state.users
    .filter((user) => user.id !== currentUser?.id)
    .filter((user) => {
      if (filters.category !== 'All') {
        const matchesCategory = [...user.skillsOffered, ...user.skillsWanted].some(
          (skill) => skill.category === filters.category,
        )
        if (!matchesCategory) {
          return false
        }
      }

      if (filters.city !== 'All' && user.city !== filters.city) {
        return false
      }

      if (!modeMatches(filters.mode, user.mode)) {
        return false
      }

      const minimumRating =
        filters.rating === 'All'
          ? 0
          : filters.rating === '3+'
            ? 3
            : filters.rating === '4+'
              ? 4
              : 4.5

      if (user.rating < minimumRating) {
        return false
      }

      if (!query) {
        return true
      }

      const haystack = [
        user.name,
        user.city,
        user.bio,
        user.headline,
        ...user.skillsOffered.map((skill) => skill.name),
        ...user.skillsWanted.map((skill) => skill.name),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
    .map((user) => ({
      user,
      match: computeMatchResult(currentUser, user),
    }))
    .sort((left, right) => right.match.score - left.match.score || right.user.rating - left.user.rating)

  const perPage = 6
  const visibleResults = results.slice(0, page * perPage)

  return (
    <PageTransition>
      <div className="space-y-8">
        <section className="glass-panel space-y-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge tone="brand">Live Skill Listings</Badge>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                Find someone who teaches exactly what you need.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Search by skill, city, format, or rating. Perfect reciprocal swaps get surfaced
                automatically when both sides can teach what the other wants.
              </p>
            </div>
            {!currentUser ? (
              <ButtonLink to="/auth">
                <Sparkles className="size-4" />
                Join to request swaps
              </ButtonLink>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.25fr_repeat(4,minmax(0,1fr))]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-3xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm dark:border-slate-700 dark:bg-slate-900/80"
                onChange={(event) => {
                  setPage(1)
                  setFilters((current) => ({ ...current, query: event.target.value }))
                }}
                placeholder="Find someone who teaches Yoga"
                value={filters.query}
              />
            </label>

            <select
              className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/80"
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
              className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/80"
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
              className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/80"
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
              className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/80"
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
        </section>

        {currentUser && suggestedMatches.length ? (
          <section className="space-y-4">
            <SectionTitle
              description="Mutual skill swaps with the strongest overlap based on what you teach, want, availability, and mode."
              eyebrow="Daily Suggestions"
            >
              Best matches for you
            </SectionTitle>
            <div className="grid gap-4 xl:grid-cols-3">
              {suggestedMatches.slice(0, 3).map((entry) => (
                <div className="glass-panel flex items-center gap-4 p-5" key={entry.id}>
                  <img alt={entry.name} className="size-14 rounded-3xl object-cover" src={entry.photo} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-950 dark:text-white">
                        {entry.name}
                      </p>
                      <Badge tone="teal">{entry.match.score}% match</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-300">
                      {entry.headline}
                    </p>
                  </div>
                  <Button onClick={() => setSelectedUser(entry)} size="sm">
                    Request
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <SectionTitle
            description={`${results.length} members match your filters.`}
            eyebrow="Browse Feed"
          >
            Explore the community board
          </SectionTitle>

          {visibleResults.length ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {visibleResults.map(({ user, match }) => (
                <UserCard key={user.id} match={match} onRequest={setSelectedUser} user={user} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No members matched those filters"
              description="Try widening the city or category filter, or browse all listings to discover adjacent skills."
              action={
                <Button
                  onClick={() => {
                    setFilters(initialFilters)
                    setPage(1)
                  }}
                  variant="outline"
                >
                  Clear filters
                </Button>
              }
            />
          )}

          {visibleResults.length < results.length ? (
            <div className="flex justify-center">
              <Button onClick={() => setPage((current) => current + 1)} variant="outline">
                Load more listings
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <SwapRequestModal
        isOpen={Boolean(selectedUser)}
        key={selectedUser?.id ?? 'swap-request-modal'}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </PageTransition>
  )
}
