import { useEffect, useRef, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  Link2,
  Paperclip,
  Search,
  SendHorizonal,
  SmilePlus,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ButtonLink } from '@/components/common/ButtonLink'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SkillChip } from '@/components/common/SkillChip'
import { useApp } from '@/context/AppContext'
import { buildSwapThreadKey, formatRelativeTime, isRecentlyActive, parseThreadKey } from '@/utils/app'
import { cn } from '@/utils/cn'

const quickTemplates = [
  'Session scheduled: Saturday 7 PM. I will share a Google Meet link.',
  'Meet link: https://meet.google.com/replace-with-your-room',
  'I reviewed the notes. Ready for our next exchange whenever you are.',
]

export function ChatPage() {
  const { threadId = '', swapId = '' } = useParams()
  const {
    completeSwap,
    currentUser,
    getMessagesForThread,
    getSwapById,
    getThreadById,
    loading,
    messageThreads,
    sendChatMessage,
    subscribeToThreadMessages,
    state,
  } = useApp()
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)
  const resolvedThreadId = threadId || (swapId ? buildSwapThreadKey(swapId) : '') || messageThreads[0]?.id || ''
  const activeThread = getThreadById(resolvedThreadId)
  const activeMessages = activeThread ? getMessagesForThread(activeThread.id) : []

  useEffect(() => {
    if (!activeThread?.id) return
    return subscribeToThreadMessages(activeThread.id)
  }, [activeThread?.id, subscribeToThreadMessages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [resolvedThreadId, activeMessages.length])

  if (loading || !currentUser) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading messages...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!messageThreads.length) {
    return (
      <PageTransition>
        <EmptyState
          title="No conversations yet"
          description="Accept a swap request or connection to unlock direct messaging."
          action={
            <ButtonLink to="/explore" variant="outline">
              Explore members
            </ButtonLink>
          }
        />
      </PageTransition>
    )
  }

  const filteredThreads = messageThreads.filter((thread) => {
    const partner = state.users.find((user) => user.id === thread.partnerId)
    const haystack = [partner?.name, partner?.headline, thread.preview, thread.contextLabel]
      .join(' ')
      .toLowerCase()
    return haystack.includes(search.trim().toLowerCase())
  })

  if (!activeThread) {
    return (
      <PageTransition>
        <EmptyState
          title="Conversation not found"
          description="This thread may have been archived or the link is no longer valid."
          action={
            <ButtonLink to="/messages" variant="outline">
              Back to messages
            </ButtonLink>
          }
        />
      </PageTransition>
    )
  }

  const partner = state.users.find((user) => user.id === activeThread.partnerId) ?? null
  const activeSwapId =
    activeThread.kind === 'swap' ? (parseThreadKey(activeThread.id)?.sourceId ?? activeThread.id) : null
  const activeSwap = activeSwapId ? getSwapById(activeSwapId) : null
  const sender =
    activeSwap ? state.users.find((user) => user.id === activeSwap.senderId) ?? null : null
  const senderOffer =
    activeSwap && sender
      ? sender.skillsOffered.find((skill) => skill.id === activeSwap.offeredSkillId) ?? null
      : null
  const senderWant =
    activeSwap && sender
      ? sender.skillsWanted.find((skill) => skill.id === activeSwap.wantedSkillId) ?? null
      : null
  const canCompleteSwap = Boolean(activeSwap && activeSwap.status === 'Accepted')

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <aside className="glass-panel flex min-h-[78vh] flex-col overflow-hidden">
          <div className="border-b border-slate-200/80 p-5 dark:border-slate-700/80">
            <div className="space-y-2">
              <Badge tone="brand">Messages</Badge>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Conversations
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Accepted swaps and direct connections live here.
              </p>
            </div>
            <label className="relative mt-5 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="premium-input w-full rounded-[1.5rem] py-3 pl-11 pr-4"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search mentors..."
                value={search}
              />
            </label>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {filteredThreads.length ? (
              filteredThreads.map((thread) => {
                const threadPartner = state.users.find((user) => user.id === thread.partnerId)
                const active = thread.id === activeThread.id
                return (
                  <Link
                    className={cn(
                      'flex items-center gap-3 rounded-[1.5rem] border p-3 transition-all duration-300',
                      active
                        ? 'border-brand-200 bg-brand-50/80 shadow-soft dark:border-brand-400/30 dark:bg-brand-500/10'
                        : 'border-transparent bg-white/60 hover:border-slate-200 hover:bg-white dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900/80',
                    )}
                    key={thread.id}
                    to={`/messages/${thread.id}`}
                  >
                    <div className="relative shrink-0">
                      <img
                        alt={threadPartner?.name}
                        className="size-12 rounded-2xl object-cover"
                        src={threadPartner?.photo}
                      />
                      {threadPartner && isRecentlyActive(threadPartner.lastActiveAt) ? (
                        <span className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-slate-950 dark:text-white">
                          {threadPartner?.name}
                        </p>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {formatRelativeTime(thread.updatedAt)}
                        </span>
                      </div>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-300">
                        {thread.preview}
                      </p>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="p-3">
                <EmptyState
                  title="No results"
                  description="Try a different search term or open another thread."
                />
              </div>
            )}
          </div>
        </aside>

        <section className="glass-panel flex min-h-[78vh] flex-col overflow-hidden">
          <div className="border-b border-slate-200/80 p-5 dark:border-slate-700/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    alt={partner?.name}
                    className="size-14 rounded-3xl object-cover"
                    src={partner?.photo}
                  />
                  {partner && isRecentlyActive(partner.lastActiveAt) ? (
                    <span className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                  ) : null}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-slate-950 dark:text-white">
                      {partner?.name}
                    </p>
                    <Badge tone={activeThread.kind === 'swap' ? 'brand' : 'teal'}>
                      {activeThread.kind === 'swap' ? 'Swap thread' : 'Direct connection'}
                    </Badge>
                    {activeThread.status === 'completed' ? <Badge tone="amber">Completed</Badge> : null}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    {partner && isRecentlyActive(partner.lastActiveAt)
                      ? 'Active recently'
                      : 'Offline right now'}
                  </p>
                </div>
              </div>

              <Link to={`/profile/${partner?.username}`}>
                <Button size="sm" variant="outline">
                  View profile
                </Button>
              </Link>
            </div>
          </div>

          {activeSwap ? (
            <div className="border-b border-slate-200/70 bg-gradient-to-r from-brand-50/80 to-tealish-50/80 px-5 py-4 dark:border-slate-700/70 dark:from-brand-500/10 dark:to-tealish-500/10">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <CalendarClock className="size-4 text-brand-600 dark:text-brand-300" />
                    Session card
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {sender?.name} teaches {senderOffer?.name} and wants {senderWant?.name}.
                  </p>
                </div>
                <Button
                  className="sm:w-auto"
                  onClick={() =>
                    sendChatMessage(
                      activeThread.id,
                      'Session scheduled: Saturday 7 PM. I will share a Google Meet link.',
                      'template',
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  Add to chat
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {activeMessages.map((chat) => {
              const isOwn = chat.senderId === currentUser.id
              return (
                <div
                  className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                  key={chat.id}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-[1.75rem] px-4 py-3 text-sm leading-6 shadow-soft',
                      chat.message_type === 'system'
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        : isOwn
                          ? 'bg-gradient-to-r from-brand-600 to-tealish-500 text-white'
                          : 'bg-slate-100/90 text-slate-700 dark:bg-slate-800/90 dark:text-slate-100',
                    )}
                  >
                    <p>{chat.message}</p>
                    <p
                      className={cn(
                        'mt-2 text-xs',
                        chat.message_type === 'system'
                          ? 'text-slate-500 dark:text-slate-400'
                          : isOwn
                            ? 'text-white/70'
                            : 'text-slate-400 dark:text-slate-500',
                      )}
                    >
                      {formatRelativeTime(chat.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200/80 p-5 dark:border-slate-700/80">
            <div className="mb-4 flex flex-wrap gap-2">
              {quickTemplates.map((template) => (
                <button
                  className="rounded-full border border-slate-200/80 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700/80 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-200"
                  key={template}
                  onClick={() => sendChatMessage(activeThread.id, template, 'template')}
                  type="button"
                >
                  {template.includes('scheduled')
                    ? 'Session scheduled'
                    : template.includes('Meet link')
                      ? 'Share meet link'
                      : 'Follow up'}
                </button>
              ))}
            </div>

            <form
              className="flex items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                sendChatMessage(activeThread.id, message)
                setMessage('')
              }}
            >
              <div className="flex flex-1 items-center gap-2 rounded-[1.75rem] border border-slate-200/80 bg-white/85 px-3 py-2 shadow-soft dark:border-slate-700/80 dark:bg-slate-900/85">
                <button
                  className="inline-flex size-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  type="button"
                >
                  <SmilePlus className="size-4" />
                </button>
                <button
                  className="inline-flex size-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  type="button"
                >
                  <Paperclip className="size-4" />
                </button>
                <input
                  className="w-full bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Type a message, add a link, or plan the next session"
                  value={message}
                />
              </div>
              <Button type="submit">
                <SendHorizonal className="size-4" />
                Send
              </Button>
            </form>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3">
              <img
                alt={partner?.name}
                className="size-16 rounded-3xl object-cover"
                src={partner?.photo}
              />
              <div>
                <p className="text-lg font-bold text-slate-950 dark:text-white">{partner?.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">{partner?.headline}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {partner?.bio}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[1.5rem] bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Rating
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {partner?.rating.toFixed(1)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Students
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {partner?.taughtCount ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Skills offered
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {partner?.skillsOffered.slice(0, 6).map((skill) => (
                    <SkillChip key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Wants to learn
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {partner?.skillsWanted.slice(0, 6).map((skill) => (
                    <SkillChip key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <ButtonLink fullWidth to={`/profile/${partner?.username}`} variant="outline">
                View profile
              </ButtonLink>
            </div>
          </div>

          <div className="glass-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Thread context
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.5rem] bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {activeThread.contextLabel}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  Updated {formatRelativeTime(activeThread.updatedAt)}
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Link2 className="size-4 text-brand-600 dark:text-brand-300" />
                  Share Zoom, Google Meet, notes, or docs directly in chat.
                </div>
              </div>

              {activeSwap && canCompleteSwap ? (
                <Button className="w-full" onClick={() => completeSwap(activeSwap.id)} size="lg">
                  <CheckCircle2 className="size-4" />
                  Mark swap complete
                </Button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </PageTransition>
  )
}
