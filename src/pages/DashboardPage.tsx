import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, CheckCircle2, Clock3, MessageCircleMore, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ChartFrame } from '@/components/dashboard/ChartFrame'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { RatingStars } from '@/components/common/RatingStars'
import { SectionTitle } from '@/components/common/SectionTitle'
import { useApp } from '@/context/AppContext'
import { formatRelativeTime, resolveSwapPartner } from '@/utils/app'

export function DashboardPage() {
  const {
    addReview,
    completeSwap,
    currentUser,
    respondToSwapRequest,
    state,
    suggestedMatches,
  } = useApp()
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { rating: number; comment: string }>
  >({})

  if (!currentUser) {
    return null
  }

  const swaps = state.swapRequests.filter(
    (swap) => swap.senderId === currentUser.id || swap.receiverId === currentUser.id,
  )
  const incoming = swaps.filter((swap) => swap.receiverId === currentUser.id && swap.status === 'Pending')
  const outgoing = swaps.filter((swap) => swap.senderId === currentUser.id && swap.status === 'Pending')
  const active = swaps.filter((swap) => swap.status === 'Accepted')
  const completed = swaps.filter((swap) => swap.status === 'Completed')

  const requestChart = [
    { name: 'Incoming', value: incoming.length },
    { name: 'Active', value: active.length },
    { name: 'Completed', value: completed.length },
  ]
  const growthChart = [
    { name: 'Week 1', taught: 1, learned: 1 },
    { name: 'Week 2', taught: 2, learned: 2 },
    { name: 'Week 3', taught: currentUser.taughtCount, learned: currentUser.learnedCount },
  ]

  return (
    <PageTransition>
      <div className="space-y-8">
        <section className="grid gap-4 lg:grid-cols-4">
          {[
            { label: 'Swap Score', value: currentUser.swapScore, note: 'Reputation metric' },
            { label: 'Skills taught', value: currentUser.taughtCount, note: 'Completed sessions' },
            { label: 'Skills learned', value: currentUser.learnedCount, note: 'Growth tracked' },
            { label: 'Pending requests', value: incoming.length + outgoing.length, note: 'Awaiting action' },
          ].map((item) => (
            <div className="glass-panel p-5" key={item.label}>
              <p className="text-sm text-slate-500 dark:text-slate-300">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{item.note}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-panel min-w-0 p-6">
            <SectionTitle
              description="A quick read on how your swap activity is moving."
              eyebrow="Activity"
            >
              Swap momentum
            </SectionTitle>
            <ChartFrame>
              {({ width, height }) => (
                <AreaChart data={growthChart} height={height} width={width}>
                  <defs>
                    <linearGradient id="taught" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="learned" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area dataKey="taught" fill="url(#taught)" stroke="#4f46e5" type="monotone" />
                  <Area dataKey="learned" fill="url(#learned)" stroke="#14b8a6" type="monotone" />
                </AreaChart>
              )}
            </ChartFrame>
          </div>

          <div className="glass-panel min-w-0 p-6">
            <SectionTitle
              description="Where your requests stand right now."
              eyebrow="Request Status"
            >
              My swaps
            </SectionTitle>
            <ChartFrame>
              {({ width, height }) => (
                <BarChart data={requestChart} height={height} width={width}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" radius={[16, 16, 0, 0]} />
                </BarChart>
              )}
            </ChartFrame>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <SectionTitle
                description="Requests waiting on your response."
                eyebrow="Incoming"
              >
                Incoming requests
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {incoming.length ? (
                  incoming.map((request) => {
                    const sender = state.users.find((user) => user.id === request.senderId)
                    return (
                      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80" key={request.id}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <img alt={sender?.name} className="size-11 rounded-2xl object-cover" src={sender?.photo} />
                              <div>
                                <p className="font-semibold text-slate-950 dark:text-white">{sender?.name}</p>
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
                            <Button onClick={() => respondToSwapRequest(request.id, 'Accepted')} size="sm">
                              Accept
                            </Button>
                            <Button onClick={() => respondToSwapRequest(request.id, 'Declined')} size="sm" variant="outline">
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <EmptyState
                    title="No incoming requests"
                    description="Once someone requests a swap with you, it will appear here."
                  />
                )}
              </div>
            </div>

            <div className="glass-panel p-6">
              <SectionTitle
                description="Accepted exchanges that are actively being coordinated."
                eyebrow="Active"
              >
                Active swaps in progress
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {active.length ? (
                  active.map((swap) => {
                    const partner = resolveSwapPartner(swap, currentUser.id, state.users)
                    return (
                      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80" key={swap.id}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">{partner?.name}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                              Last updated {formatRelativeTime(swap.updatedAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/chat/${swap.id}`}>
                              <Button size="sm">
                                <MessageCircleMore className="size-4" />
                                Open chat
                              </Button>
                            </Link>
                            <Button onClick={() => completeSwap(swap.id)} size="sm" variant="outline">
                              <CheckCircle2 className="size-4" />
                              Complete
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <EmptyState
                    title="No active swaps right now"
                    description="Accept a request or send one from the explore feed to get a chat thread going."
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6">
              <SectionTitle
                description="Requests you sent that still need a reply."
                eyebrow="Outgoing"
              >
                Pending requests
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {outgoing.length ? (
                  outgoing.map((request) => {
                    const receiver = state.users.find((user) => user.id === request.receiverId)
                    return (
                      <div className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80" key={request.id}>
                        <div className="flex items-center gap-3">
                          <img alt={receiver?.name} className="size-11 rounded-2xl object-cover" src={receiver?.photo} />
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">{receiver?.name}</p>
                            <div className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-300">
                              <Clock3 className="size-4" />
                              Pending response
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    No outgoing requests waiting right now.
                  </p>
                )}
              </div>
            </div>

            <div className="glass-panel p-6">
              <SectionTitle
                description="Leave feedback once the exchange is complete."
                eyebrow="Completed"
              >
                Completed swaps & reviews
              </SectionTitle>
              <div className="mt-6 space-y-4">
                {completed.length ? (
                  completed.map((swap) => {
                    const partner = resolveSwapPartner(swap, currentUser.id, state.users)
                    const reviewDraft = reviewDrafts[swap.id] ?? { rating: 5, comment: '' }
                    const hasReviewed = state.reviews.some(
                      (review) =>
                        review.swapRequestId === swap.id && review.reviewerId === currentUser.id,
                    )

                    return (
                      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80" key={swap.id}>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">{partner?.name}</p>
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
                              className="min-h-24 w-full rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/80"
                              onChange={(event) =>
                                setReviewDrafts((current) => ({
                                  ...current,
                                  [swap.id]: {
                                    ...reviewDraft,
                                    comment: event.target.value,
                                  },
                                }))
                              }
                              placeholder="How did the swap go?"
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
                    description="Finish an active skill exchange to unlock the rating and review flow."
                  />
                )}
              </div>
            </div>

            {suggestedMatches.length ? (
              <div className="glass-panel p-6">
                <SectionTitle
                  description="People you might want to request next."
                  eyebrow="Suggested"
                >
                  Strong nearby matches
                </SectionTitle>
                <div className="mt-6 space-y-4">
                  {suggestedMatches.slice(0, 3).map((match) => (
                    <div className="flex items-center justify-between gap-4 rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80" key={match.id}>
                      <div className="flex items-center gap-3">
                        <img alt={match.name} className="size-11 rounded-2xl object-cover" src={match.photo} />
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">{match.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-300">{match.match.score}% match</p>
                        </div>
                      </div>
                      <Link to={`/profile/${match.username}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
