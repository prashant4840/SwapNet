import { useEffect, useRef, useState } from 'react'
import { CalendarClock, CheckCircle2, Link2, SendHorizonal } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { useApp } from '@/context/AppContext'
import { formatRelativeTime, resolveSwapPartner } from '@/utils/app'

const quickTemplates = [
  'Session scheduled: Saturday 7 PM. I will share a Google Meet link.',
  'Meet link: https://meet.google.com/replace-with-your-room',
  'Great session. I practiced what we covered and I am ready for the next one.',
]

export function ChatPage() {
  const { swapId = '' } = useParams()
  const { completeSwap, currentUser, getMessagesForSwap, getSwapById, sendChatMessage, state } =
    useApp()
  const [message, setMessage] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)
  const swap = getSwapById(swapId)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [swapId, state.messages.length])

  if (!currentUser || !swap) {
    return (
      <PageTransition>
        <EmptyState
          title="Chat not available"
          description="This swap thread could not be found."
        />
      </PageTransition>
    )
  }

  const partner = resolveSwapPartner(swap, currentUser.id, state.users)
  const sender = state.users.find((user) => user.id === swap.senderId)
  const senderOffer = sender?.skillsOffered.find((skill) => skill.id === swap.offeredSkillId)
  const senderWant = sender?.skillsWanted.find((skill) => skill.id === swap.wantedSkillId)
  const messages = getMessagesForSwap(swapId)

  if (!['Accepted', 'Completed'].includes(swap.status)) {
    return (
      <PageTransition>
        <EmptyState
          title="Chat opens after acceptance"
          description="Accept the swap first from the dashboard before coordinating sessions."
        />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel flex min-h-[70vh] flex-col p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <img alt={partner?.name} className="size-14 rounded-3xl object-cover" src={partner?.photo} />
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">{partner?.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {swap.status === 'Accepted' ? 'Swap in progress' : 'Swap completed'}
                </p>
              </div>
            </div>
            {swap.status === 'Accepted' ? <Badge tone="teal">Live chat</Badge> : <Badge tone="amber">Completed</Badge>}
          </div>

          <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((chat) => {
              const isOwn = chat.senderId === currentUser.id
              return (
                <div
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  key={chat.id}
                >
                  <div
                    className={`max-w-[85%] rounded-[2rem] px-4 py-3 text-sm leading-6 ${
                      chat.type === 'system'
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        : isOwn
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                          : 'bg-brand-50 text-slate-700 dark:bg-brand-500/10 dark:text-slate-100'
                    }`}
                  >
                    <p>{chat.message}</p>
                    <p
                      className={`mt-2 text-xs ${
                        chat.type === 'system'
                          ? 'text-slate-500 dark:text-slate-400'
                          : isOwn
                            ? 'text-white/70 dark:text-slate-500'
                            : 'text-slate-400 dark:text-slate-400'
                      }`}
                    >
                      {formatRelativeTime(chat.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          <div className="mt-6 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="flex flex-wrap gap-2">
              {quickTemplates.map((template) => (
                <button
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200"
                  key={template}
                  onClick={() => sendChatMessage(swap.id, template, 'template')}
                  type="button"
                >
                  {template.includes('scheduled') ? 'Session scheduled' : template.includes('Meet link') ? 'Share meet link' : 'Follow up'}
                </button>
              ))}
            </div>

            <form
              className="flex gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                sendChatMessage(swap.id, message)
                setMessage('')
              }}
            >
              <input
                className="w-full rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/80"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Send a message or drop a meeting link"
                value={message}
              />
              <Button type="submit">
                <SendHorizonal className="size-4" />
                Send
              </Button>
            </form>
          </div>
        </section>

        <section className="space-y-6">
          <div className="glass-panel p-6">
            <SectionTitle
              description="What this swap is centered around."
              eyebrow="Swap Details"
            >
              Exchange summary
            </SectionTitle>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Trade</p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {sender?.name} teaches {senderOffer?.name} ↔ wants {senderWant?.name}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Status</p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {swap.status}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  Updated {formatRelativeTime(swap.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <SectionTitle
              description="Quick actions for the current swap."
              eyebrow="Next Steps"
            >
              Coordinate sessions
            </SectionTitle>
            <div className="mt-6 space-y-3">
              <div className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <CalendarClock className="size-4 text-brand-600 dark:text-brand-300" />
                  Suggest a date and time in chat.
                </div>
              </div>
              <div className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Link2 className="size-4 text-tealish-600 dark:text-tealish-300" />
                  Share Zoom, Google Meet, or any useful study links.
                </div>
              </div>
              {swap.status === 'Accepted' ? (
                <Button className="w-full" onClick={() => completeSwap(swap.id)} size="lg">
                  <CheckCircle2 className="size-4" />
                  Mark swap complete
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
