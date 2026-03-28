import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquareMore,
  Network,
  Star,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ChartFrame } from '@/components/dashboard/ChartFrame'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { RatingStars } from '@/components/common/RatingStars'
import { SectionTitle } from '@/components/common/SectionTitle'
import { SwapRequestModal } from '@/components/feed/SwapRequestModal'
import { useApp } from '@/context/AppContext'
import { formatRelativeTime, resolveSwapPartner } from '@/utils/app'
import type { UserProfile } from '@/types'

const chartGridColor = '#cbd5e1'

export function DashboardPage() {
  const {
    addReview,
    completeSwap,
    currentUser,
    messageThreads,
    respondToConnectionRequest,
    respondToSwapRequest,
    state,
    suggestedMatches,
  } = useApp()
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { rating: number; comment: string }>
  >({})
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  if (!currentUser) {
    return null
  }

  const swaps = state.swapRequests.filter(
    (swap) => swap.senderId === currentUser.id || swap.receiverId === currentUser.id,
  )
  const incomingSwaps = swaps.filter(
    (swap) => swap.receiverId === currentUser.id && swap.status === 'Pending',
  )
  const outgoingSwaps = swaps.filter(
    (swap) => swap.senderId === currentUser.id && swap.status === 'Pending',
  )
  const activeSwaps = swaps.filter((swap) => swap.status === 'Accepted')
  const completedSwaps = swaps.filter((swap) => swap.status === 'Completed')

  const connections = state.connectionRequests.filter(
    (request) => request.senderId === currentUser.id || request.receiverId === currentUser.id,
  )
  const incomingConnections = connections.filter(
    (request) => request.receiverId === currentUser.id && request.status === 'Pending',
  )
  const outgoingConnections = connections.filter(
    (request) => request.senderId === currentUser.id && request.status === 'Pending',
  )
  const acceptedConnections = connections.filter((request) => request.status === 'Accepted')

  const requestChart = [
    { name: 'Requests', value: incomingSwaps.length + outgoingSwaps.length },
    { name: 'Connections', value: incomingConnections.length + outgoingConnections.length },
    { name: 'Active', value: activeSwaps.length + acceptedConnections.length },
    { name: 'Completed', value: completedSwaps.length },
  ]

  const growthChart = [
    { name: 'Week 1', taught: 1, learned: 1 },
    { name: 'Week 2', taught: Math.max(1, currentUser.taughtCount - 1), learned: Math.max(1, currentUser.learnedCount - 1) },
    { name: 'Week 3', taught: currentUser.taughtCount, learned: currentUser.learnedCount },
  ]

  const metrics = [
    {
      label: 'Swap Score',
      value: currentUser.swapScore,
      note: 'Trust and follow-through',
    },
    {
      label: 'Live threads',
      value: messageThreads.length,
      note: 'Open swap or connection chats',
    },
    {
      label: 'Pending actions',
      value: incomingSwaps.length + incomingConnections.length,
      note: 'Needs your response',
    },
    {
      label: 'Completed sessions',
      value: currentUser.completedSwaps,
      note: 'Swaps wrapped successfully',
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-8">
        <section className="glass-panel overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge tone="brand">Operator Dashboard</Badge>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Your skill network, requests, and momentum in one place.
              </h1>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                Manage incoming requests, unlock direct peer conversations, and review the
                strongest recommended matches based on what you teach and want to learn.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[28rem]">
              {metrics.map((item) => (
                <div
                  className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                  key={item.label}
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="glass-panel min-w-0 p-6">
            <SectionTitle
              description="A simple view of how much you are teaching and learning over time."
              eyebrow="Momentum"
            >
              Learning velocity
            </SectionTitle>
            <ChartFrame>
              {({ width, height }) => (
                <AreaChart data={growthChart} height={height} width={width}>
                  <defs>
                    <linearGradient id="dashboard-taught" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.82} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="dashboard-learned" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.82} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area
                    dataKey="taught"
                    fill="url(#dashboard-taught)"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Area
                    dataKey="learned"
                    fill="url(#dashboard-learned)"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              )}
            </ChartFrame>
          </div>

          <div className="glass-panel min-w-0 p-6">
            <SectionTitle
              description="Requests, accepted connections, and completions at a glance."
              eyebrow="Pipeline"
            >
              Relationship flow
            </SectionTitle>
            <ChartFrame>
              {({ width, height }) => (
                <BarChart data={requestChart} height={height} width={width}>
                  <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" radius={[16, 16, 0, 0]} />
                </BarChart>
              )}
            </ChartFrame>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <SectionTitle
                description="People waiting for you to approve a skill exchange."
                eyebrow="Incoming Swap Requests"
              >
                Pending swap approvals
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {incomingSwaps.length ? (
                  incomingSwaps.map((request) => {
                    const sender = state.users.find((user) => user.id === request.senderId)
                    return (
                      <div
                        className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                        key={request.id}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <img
                                alt={sender?.name}
                                className="size-12 rounded-2xl object-cover"
                                src={sender?.photo}
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
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => respondToSwapRequest(request.id, 'Accepted')}
                              size="sm"
                            >
                              Accept
                            </Button>
                            <Button
                              onClick={() => respondToSwapRequest(request.id, 'Declined')}
                              size="sm"
                              variant="outline"
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <EmptyState
                    title="No swap approvals pending"
                    description="New reciprocal requests will show up here."
                  />
                )}
              </div>
            </div>

            <div className="glass-panel p-6">
              <SectionTitle
                description="These members want to connect directly before or beyond a swap."
                eyebrow="Connection Requests"
              >
                Direct peer connections
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {incomingConnections.length ? (
                  incomingConnections.map((request) => {
                    const sender = state.users.find((user) => user.id === request.senderId)
                    return (
                      <div
                        className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                        key={request.id}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <img
                                alt={sender?.name}
                                className="size-12 rounded-2xl object-cover"
                                src={sender?.photo}
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
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                respondToConnectionRequest(request.id, 'Accepted')
                              }
                              size="sm"
                            >
                              Accept
                            </Button>
                            <Button
                              onClick={() =>
                                respondToConnectionRequest(request.id, 'Declined')
                              }
                              size="sm"
                              variant="outline"
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <EmptyState
                    title="No connection requests waiting"
                    description="Accepted connections unlock direct chat threads in Messages."
                  />
                )}
              </div>
            </div>

            <div className="glass-panel p-6">
              <SectionTitle
                description="Accepted swaps and peer connections ready for live conversation."
                eyebrow="Active Threads"
              >
                Open conversations
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {messageThreads.length ? (
                  messageThreads.slice(0, 5).map((thread) => {
                    const partner = state.users.find((user) => user.id === thread.partnerId)
                    return (
                      <div
                        className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                        key={thread.id}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              alt={partner?.name}
                              className="size-12 rounded-2xl object-cover"
                              src={partner?.photo}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-semibold text-slate-950 dark:text-white">
                                  {partner?.name}
                                </p>
                                <Badge tone={thread.kind === 'swap' ? 'brand' : 'teal'}>
                                  {thread.kind === 'swap' ? 'Swap' : 'Connection'}
                                </Badge>
                              </div>
                              <p className="truncate text-sm text-slate-500 dark:text-slate-300">
                                {thread.preview}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Link to={`/messages/${thread.id}`}>
                              <Button size="sm">
                                <MessageSquareMore className="size-4" />
                                Open chat
                              </Button>
                            </Link>
                            {thread.kind === 'swap' && thread.status !== 'completed' ? (
                              <Button
                                onClick={() => completeSwap(thread.id)}
                                size="sm"
                                variant="outline"
                              >
                                <CheckCircle2 className="size-4" />
                                Complete
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <EmptyState
                    title="No active conversations yet"
                    description="Accept a swap or connection to unlock the new Messages workspace."
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6">
              <SectionTitle
                description="Profiles ranked by teach/learn overlap, availability, location, and trust."
                eyebrow="Recommended Matches"
              >
                Smart introductions
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
                          <img
                            alt={match.name}
                            className="size-12 rounded-2xl object-cover"
                            src={match.photo}
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

                      <div className="mt-4 space-y-2">
                        {match.match.reasons.slice(0, 3).map((reason) => (
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
                  ))
                ) : (
                  <EmptyState
                    title="No recommendations yet"
                    description="Complete your profile with both offered and wanted skills to improve suggestions."
                  />
                )}
              </div>
            </div>

            <div className="glass-panel p-6">
              <SectionTitle
                description="Requests and invitations you already sent."
                eyebrow="Outbound"
              >
                Waiting on replies
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {[...outgoingSwaps, ...outgoingConnections].length ? (
                  <>
                    {outgoingSwaps.map((request) => {
                      const receiver = state.users.find((user) => user.id === request.receiverId)
                      return (
                        <div
                          className="rounded-[1.75rem] bg-slate-100/80 p-4 dark:bg-slate-800/80"
                          key={request.id}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              alt={receiver?.name}
                              className="size-11 rounded-2xl object-cover"
                              src={receiver?.photo}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-950 dark:text-white">
                                  {receiver?.name}
                                </p>
                                <Badge tone="brand">Swap</Badge>
                              </div>
                              <div className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-300">
                                <Clock3 className="size-4" />
                                Awaiting response
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {outgoingConnections.map((request) => {
                      const receiver = state.users.find((user) => user.id === request.receiverId)
                      return (
                        <div
                          className="rounded-[1.75rem] bg-slate-100/80 p-4 dark:bg-slate-800/80"
                          key={request.id}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              alt={receiver?.name}
                              className="size-11 rounded-2xl object-cover"
                              src={receiver?.photo}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-950 dark:text-white">
                                  {receiver?.name}
                                </p>
                                <Badge tone="teal">Connection</Badge>
                              </div>
                              <div className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-300">
                                <Network className="size-4" />
                                Connection pending
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <EmptyState
                    title="No outgoing items waiting"
                    description="Send a swap or connection request from Explore to start building momentum."
                  />
                )}
              </div>
            </div>

            <div className="glass-panel p-6">
              <SectionTitle
                description="Leave feedback after a completed swap to strengthen trust on the platform."
                eyebrow="Completed Swaps"
              >
                Ratings and reviews
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {completedSwaps.length ? (
                  completedSwaps.map((swap) => {
                    const partner = resolveSwapPartner(swap, currentUser.id, state.users)
                    const reviewDraft = reviewDrafts[swap.id] ?? { rating: 5, comment: '' }
                    const hasReviewed = state.reviews.some(
                      (review) =>
                        review.swapRequestId === swap.id && review.reviewerId === currentUser.id,
                    )

                    return (
                      <div
                        className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/80"
                        key={swap.id}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">
                              {partner?.name}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-300">
                              Completed {formatRelativeTime(swap.updatedAt)}
                            </p>
                          </div>
                          <Badge tone="teal">Completed</Badge>
                        </div>

                        {hasReviewed ? (
                          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                            <Star className="size-4" />
                            Review submitted
                          </div>
                        ) : (
                          <div className="mt-4 space-y-4">
                            <RatingStars
                              onChange={(rating) =>
                                setReviewDrafts((current) => ({
                                  ...current,
                                  [swap.id]: {
                                    ...reviewDraft,
                                    rating,
                                  },
                                }))
                              }
                              rating={reviewDraft.rating}
                            />
                            <textarea
                              className="premium-input min-h-24 w-full rounded-[1.5rem] px-4 py-3"
                              onChange={(event) =>
                                setReviewDrafts((current) => ({
                                  ...current,
                                  [swap.id]: {
                                    ...reviewDraft,
                                    comment: event.target.value,
                                  },
                                }))
                              }
                              placeholder="How did the exchange go?"
                              value={reviewDraft.comment}
                            />
                            <Button
                              onClick={() =>
                                addReview(swap.id, reviewDraft.rating, reviewDraft.comment)
                              }
                              size="sm"
                            >
                              Submit review
                              <ArrowRight className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <EmptyState
                    title="No completed swaps yet"
                    description="Finish an active exchange to unlock reviews and public trust signals."
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <SwapRequestModal
        isOpen={Boolean(selectedUser)}
        key={selectedUser?.id ?? 'dashboard-swap-request'}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </PageTransition>
  )
}
