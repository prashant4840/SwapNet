import { EndorseSkillsModal } from '@/components/feed/EndorseSkillsModal'
import { ProfileCompletionCard } from '@/components/profile/ProfileCompletionCard'
import type { SwapRequest } from '@/types'
import { useState, useEffect, lazy, Suspense } from 'react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ButtonLink } from '@/components/common/ButtonLink'
import { ChartFrame } from '@/components/dashboard/ChartFrame'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { Avatar } from '@/components/common/Avatar'
import { SwapRequestModal } from '@/components/feed/SwapRequestModal'
import { useApp } from '@/context/AppContext'
import { formatRelativeTime, resolveSwapPartner } from '@/utils/app'
import type { UserProfile } from '@/types'

const chartGridColor = '#cbd5e1'

const SwapStatsChart = lazy(() => import('@/components/dashboard/SwapStatsChart'))

export function DashboardPage() {
  const {
    currentUser,
    loading,
    respondToConnectionRequest,
    respondToSwapRequest,
    state,
    suggestedMatches,
    ensureUsersLoaded,
  } = useApp() 
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [endorseSwap, setEndorseSwap] = useState<SwapRequest | null>(null)

  // Hydrate all user profiles involved in active, pending, or completed transactions
  useEffect(() => {
    if (!currentUser) return

    const userIds = new Set<string>()

    state.swapRequests.forEach((request) => {
      if (request.senderId === currentUser.id || request.receiverId === currentUser.id) {
        userIds.add(request.senderId)
        userIds.add(request.receiverId)
      }
    })

    state.connectionRequests.forEach((request) => {
      if (request.senderId === currentUser.id || request.receiverId === currentUser.id) {
        userIds.add(request.senderId)
        userIds.add(request.receiverId)
      }
    })

    const idsToLoad = Array.from(userIds).filter((id) => id && id !== currentUser.id)
    if (idsToLoad.length > 0) {
      void ensureUsersLoaded(idsToLoad)
    }
  }, [currentUser, state.swapRequests, state.connectionRequests, ensureUsersLoaded])

  if (loading || !currentUser) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  const swaps = state.swapRequests.filter(
    (swap) => swap.senderId === currentUser.id || swap.receiverId === currentUser.id,
  )
  const incomingSwaps = swaps.filter(
    (swap) => swap.receiverId === currentUser.id && swap.status === 'Pending',
  )
  const activeSwaps = swaps.filter((swap) => swap.status === 'Accepted')

  const connections = state.connectionRequests.filter(
    (request) => request.senderId === currentUser.id || request.receiverId === currentUser.id,
  )
  const incomingConnections = connections.filter(
    (request) => request.receiverId === currentUser.id && request.status === 'Pending',
  )
  const acceptedConnections = connections.filter((request) => request.status === 'Accepted')

  const growthChart = [
    { name: 'Week 1', taught: 1, learned: 1 },
    { name: 'Week 2', taught: Math.max(1, currentUser.taughtCount - 1), learned: Math.max(1, currentUser.learnedCount - 1) },
    { name: 'Week 3', taught: currentUser.taughtCount, learned: currentUser.learnedCount },
  ]

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        {/* Left Column - Profile Completion + Pending Requests */}
        <div className="space-y-6">
          <ProfileCompletionCard profile={currentUser} />
          <div className="glass-panel p-6">
            <SectionTitle
              description="People waiting for you to approve a skill exchange."
              eyebrow="Pending Requests"
            >
              Incoming Requests
            </SectionTitle>
            <div className="mt-6 space-y-4">
              {incomingSwaps.length > 0 || incomingConnections.length > 0 ? (
                <>
                  {incomingSwaps.map((request) => {
                    const sender = state.users.find((user) => user.id === request.senderId)
                    return (
                      <div
                        className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                        key={request.id}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              avatarUrl={sender?.photo}
                              fullName={sender?.name || 'Sender'}
                              size="md"
                            />
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-white">
                                {sender?.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-300">
                                {formatRelativeTime(request.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {request.message}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                void respondToSwapRequest(request.id, 'Accepted')
                              }}
                              size="sm"
                            >
                              Accept
                            </Button>
                            <Button
                              onClick={() => {
                                void respondToSwapRequest(request.id, 'Declined')
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {incomingConnections.map((request) => {
                    const sender = state.users.find((user) => user.id === request.senderId)
                    return (
                      <div
                        className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                        key={request.id}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              avatarUrl={sender?.photo}
                              fullName={sender?.name || 'Sender'}
                              size="md"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-950 dark:text-white">
                                  {sender?.name}
                                </p>
                                <Badge tone="teal">Connect</Badge>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-300">
                                {formatRelativeTime(request.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {request.message}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                void respondToConnectionRequest(request.id, 'Accepted')
                              }}
                              size="sm"
                            >
                              Accept
                            </Button>
                            <Button
                              onClick={() => {
                                void respondToConnectionRequest(request.id, 'Declined')
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <EmptyState
                  title="No pending requests"
                  description="New requests will appear here."
                />
              )}
            </div>
          </div>

          <div className="glass-panel p-6">
            <SectionTitle
              description="Accepted swaps and connections ready for conversation."
              eyebrow="Active"
            >
              Active Swaps
            </SectionTitle>
            <div className="mt-6 space-y-4">
              {activeSwaps.length > 0 || acceptedConnections.length > 0 ? (
                <>
                  {activeSwaps.map((swap) => {
                    const partner = resolveSwapPartner(swap, currentUser.id, state.users)
                    return (
                      <div
                        className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                        key={swap.id}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              avatarUrl={partner?.photo}
                              fullName={partner?.name || 'Partner'}
                              size="md"
                            />
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-white">
                                {partner?.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-300">
                                Active swap
                              </p>
                            </div>
                          </div>
                          <div className="w-full max-w-32">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-brand-600 to-tealish-500 w-3/4 rounded-full" />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">75% complete</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Completed swaps — show endorse button */}
                    {swaps
                    .filter((swap) => swap.status === 'Completed')
                    .map((swap) => {
                      const partner = resolveSwapPartner(swap, currentUser.id, state.users)
                      return (
                        <div
                          className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                          key={swap.id}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                avatarUrl={partner?.photo}
                                fullName={partner?.name || 'Partner'}
                                size="md"
                              />
                              <div>
                                <p className="font-semibold text-slate-950 dark:text-white">
                                  {partner?.name}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-300">
                                  Completed swap
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => setEndorseSwap(swap)}
                              size="sm"
                              variant="outline"
                            >
                              Endorse skills
                            </Button>
                          </div>
                        </div>
                      )
                    })}

                  {acceptedConnections.map((connection) => {
                    const partner = state.users.find(
                      (user) => user.id === (connection.senderId === currentUser.id ? connection.receiverId : connection.senderId)
                    )
                    return (
                      <div
                        className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                        key={connection.id}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            avatarUrl={partner?.photo}
                            fullName={partner?.name || 'Partner'}
                            size="md"
                          />
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">
                              {partner?.name}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-300">
                              Direct connection
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <EmptyState
                  title="No active swaps"
                  description="Accepted requests will appear here."
                />
              )}
            </div>
          </div>
        </div>

        {/* Center Column - Weekly Impact */}
        <div className="glass-panel p-6">
          <SectionTitle
            description="Your teaching and learning impact over the past week."
            eyebrow="Analytics"
          >
            Weekly Impact
          </SectionTitle>
          <div className="mt-6">
            <ChartFrame>
              {({ width, height }) => (
                <Suspense fallback={<div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />}>
                  <SwapStatsChart data={growthChart} height={height} width={width} chartGridColor={chartGridColor} />
                </Suspense>
              )}
            </ChartFrame>
          </div>
        </div>

        {/* Right Column - Top Matches */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <SectionTitle
              description="Profiles ranked by compatibility and availability."
              eyebrow="Recommendations"
            >
              Top Matches
            </SectionTitle>
            <div className="mt-6 space-y-4">
              {suggestedMatches.length ? (
                suggestedMatches.slice(0, 4).map((match) => (
                  <div
                    className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                    key={match.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          avatarUrl={match.photo}
                          fullName={match.name}
                          size="md"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950 dark:text-white">
                              {match.name}
                            </p>
                            <Badge
                              tone={
                                match.match.matchType === 'perfect'
                                  ? 'brand'
                                  : match.match.matchType === 'good'
                                    ? 'teal'
                                    : 'slate'
                              }
                            >
                              {match.match.score}% match
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-300">
                            {match.city} · {match.mode}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedUser(match)}
                        size="sm"
                        variant="outline"
                      >
                        Request
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No matches yet"
                  description="Complete your profile to see recommendations."
                />
              )}
            </div>
            {suggestedMatches.length > 0 && (
              <div className="mt-4">
                <ButtonLink fullWidth to="/explore" variant="outline">
                  Find More Pairs
                </ButtonLink>
              </div>
            )}
          </div>

          {/* User Profile Summary */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar
                avatarUrl={currentUser.photo}
                fullName={currentUser.name}
                size="lg"
                className="ring-2 ring-white/20"
              />
              <div>
                <p className="text-lg font-bold text-slate-950 dark:text-white">
                  {currentUser.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {currentUser.headline}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.5rem] bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Rating
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {currentUser.rating.toFixed(1)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Students
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {currentUser.taughtCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SwapRequestModal
        isOpen={Boolean(selectedUser)}
        key={selectedUser?.id ?? 'dashboard-swap-request'}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
      {endorseSwap ? (
        <EndorseSkillsModal
          isOpen={Boolean(endorseSwap)}
          onClose={() => setEndorseSwap(null)}
          swap={endorseSwap}
          partner={
            resolveSwapPartner(endorseSwap, currentUser.id, state.users) ??
            state.users[0]
          }
          currentUserId={currentUser.id}
          onEndorsed={() => setEndorseSwap(null)}
        />
      ) : null}
    </PageTransition>
  )
}
