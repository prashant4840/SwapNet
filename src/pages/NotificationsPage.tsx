import { Link } from 'react-router-dom'
import { BellRing, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { useApp } from '@/context/AppContext'
import { formatRelativeTime } from '@/utils/app'

function SkeletonNotificationItem() {
  return (
    <div className="glass-panel flex items-center justify-between gap-4 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl p-3 bg-slate-200 dark:bg-slate-700">
          <div className="size-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
      <div className="size-4 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  )
}

export function NotificationsPage() {
  const { currentUser, loading, markAllNotificationsRead, markNotificationRead, state } = useApp()

  if (!currentUser) {
    return null
  }

  const notifications = state.notifications
    .filter((notification) => notification.userId === currentUser.id)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )

  return (
    <PageTransition>
      <div className="space-y-6">
        <section className="glass-panel p-6">
          <SectionTitle
            action={
              notifications.length ? (
                <Button onClick={markAllNotificationsRead} variant="outline">
                  Mark all read
                </Button>
              ) : null
            }
            description="Daily match suggestions, requests, chat updates, and review reminders all land here."
            eyebrow="Notifications"
          >
            Your update center
          </SectionTitle>
        </section>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonNotificationItem key={i} />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <section className="space-y-4">
            {notifications.map((notification) => {
              const content = (
                <div
                  className={`glass-panel flex items-center justify-between gap-4 p-5 ${
                    notification.read ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-2xl p-3 ${
                        notification.read
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
                      }`}
                    >
                      <BellRing className="size-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {notification.title}
                        </p>
                        {!notification.read ? <Badge tone="brand">New</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {notification.description}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-400" />
                </div>
              )

              if (notification.link) {
                return (
                  <Link
                    key={notification.id}
                    onClick={() => markNotificationRead(notification.id)}
                    to={notification.link}
                  >
                    {content}
                  </Link>
                )
              }

              return (
                <button
                  className="block w-full text-left"
                  key={notification.id}
                  onClick={() => markNotificationRead(notification.id)}
                  type="button"
                >
                  {content}
                </button>
              )
            })}
          </section>
        ) : (
          <EmptyState
            title="Nothing new yet"
            description="As soon as you receive a request, message, or review prompt, it will show up here."
          />
        )}
      </div>
    </PageTransition>
  )
}
