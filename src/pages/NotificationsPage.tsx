import { Link } from 'react-router-dom'
import { BellRing, ChevronRight, Zap, MessageSquare, Heart, Users, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { useApp } from '@/context/AppContext'
import { formatRelativeTime } from '@/utils/app'
import type { NotificationType, NotificationItem } from '@/types'

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

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'match':
      return <Zap className="size-5" />
    case 'request':
      return <Users className="size-5" />
    case 'connection':
      return <Heart className="size-5" />
    case 'chat':
      return <MessageSquare className="size-5" />
    case 'review':
      return <CheckCircle className="size-5" />
    default:
      return <BellRing className="size-5" />
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case 'match':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200'
    case 'request':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
    case 'connection':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200'
    case 'chat':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200'
    case 'review':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
    default:
      return 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
  }
}

function getTypeLabel(type: NotificationType): string {
  switch (type) {
    case 'match':
      return 'Match Suggestions'
    case 'request':
      return 'Swap Requests'
    case 'connection':
      return 'Connections'
    case 'chat':
      return 'Messages'
    case 'review':
      return 'Reviews'
    default:
      return 'Other'
  }
}

interface NotificationGroup {
  type: NotificationType
  count: number
  unreadCount: number
  notifications: NotificationItem[]
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

  // Group by type
  const groupedNotifications = new Map<NotificationType, NotificationGroup>()
  const typeOrder: NotificationType[] = ['request', 'connection', 'chat', 'review', 'match']

  notifications.forEach((notification) => {
    if (!groupedNotifications.has(notification.type)) {
      groupedNotifications.set(notification.type, {
        type: notification.type,
        count: 0,
        unreadCount: 0,
        notifications: [],
      })
    }
    const group = groupedNotifications.get(notification.type)!
    group.notifications.push(notification)
    group.count += 1
    if (!notification.read) group.unreadCount += 1
  })

  const sortedGroups = typeOrder
    .filter((type) => groupedNotifications.has(type))
    .map((type) => groupedNotifications.get(type)!)

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
          <section className="space-y-6">
            {sortedGroups.map((group) => (
              <div key={group.type} className="space-y-3">
                {/* Group header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2 ${getNotificationColor(group.type)}`}>
                      {getNotificationIcon(group.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950 dark:text-white">
                        {getTypeLabel(group.type)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {group.count} notification{group.count !== 1 ? 's' : ''}
                        {group.unreadCount > 0 && ` • ${group.unreadCount} unread`}
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Badge tone={group.unreadCount > 0 ? 'brand' : 'slate'}>
                      {group.unreadCount > 0 ? group.unreadCount : group.count}
                    </Badge>
                  </div>
                </div>

                {/* Group notifications */}
                <div className="space-y-2">
                  {group.notifications.map((notification) => {
                    const content = (
                      <div
                        className={`glass-panel flex items-center justify-between gap-4 p-5 transition ${
                          notification.read ? 'opacity-75' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`rounded-2xl p-3 ${
                              notification.read
                                ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                                : getNotificationColor(notification.type)
                            }`}
                          >
                            {getNotificationIcon(notification.type)}
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
                        <ChevronRight className="size-4 text-slate-400 flex-shrink-0" />
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
                </div>
              </div>
            ))}
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
