/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef, type PropsWithChildren } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { NotificationItem } from '@/types'
import { createId, cleanId } from '@/utils/app'

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadNotificationCount: number
  hasMore: boolean
  loadingMore: boolean
  loadMoreNotifications: () => Promise<void>
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  createNotification: (payload: {
    userId: string
    type: NotificationItem['type']
    title: string
    description: string
    link?: string
  }) => Promise<void>
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

interface NotificationProviderProps extends PropsWithChildren {
  currentUserId?: string | null
  onNotificationsUpdate?: (notifications: NotificationItem[]) => void
}

import { getSeedState } from '@/data/seed'

export function NotificationProvider({
  children,
  currentUserId,
  onNotificationsUpdate,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (!isSupabaseConfigured) {
      return getSeedState().notifications
    }
    return []
  })
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const subscriptionCleanupRef = useRef<(() => void) | null>(null)

  const createNotification = useCallback(
    async (payload: {
      userId: string
      type: NotificationItem['type']
      title: string
      description: string
      link?: string
    }) => {
      const newNotif: NotificationItem = {
        id: createId('notification'),
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        link: payload.link,
        createdAt: new Date().toISOString(),
        read: false,
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from('notifications').insert({
            id: cleanId(newNotif.id),
            user_id: newNotif.userId,
            type: newNotif.type,
            title: newNotif.title,
            description: newNotif.description,
            link: newNotif.link || null,
            read: false,
          })
          if (error) throw error
        } catch (err) {
          console.error('Failed to insert notification in database:', err)
          void import('@/services/errorTracking').then((m) =>
            m.captureException(err, { context: 'createNotification', payload })
          )
        }
      } else {
        if (newNotif.userId === currentUserId) {
          setNotifications((prev) => {
            const updated = [newNotif, ...prev]
            onNotificationsUpdate?.(updated)
            return updated
          })
          setUnreadNotificationCount((prev) => prev + 1)
        } else {
          const seed = getSeedState()
          seed.notifications = [newNotif, ...seed.notifications]
        }
      }
    },
    [currentUserId, onNotificationsUpdate]
  )


  const loadMoreNotifications = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !currentUserId || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const start = notifications.length
      const end = start + 9 // Load 10 notifications per load
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map((n) => ({
          id: n.id,
          userId: n.user_id,
          type: n.type as NotificationItem['type'],
          title: n.title,
          description: n.description,
          link: n.link || undefined,
          createdAt: n.created_at,
          read: n.read,
        }))

        setNotifications((prev) => {
          const existingIds = new Set(prev.map((item) => item.id))
          const filtered = mapped.filter((item) => !existingIds.has(item.id))
          const updated = [...prev, ...filtered]
          onNotificationsUpdate?.(updated)
          return updated
        })

        if (data.length < 10) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more notifications:', err)
      void import('@/services/errorTracking').then((m) =>
        m.captureException(err, { context: 'loadMoreNotifications' })
      )
    } finally {
      setLoadingMore(false)
    }
  }, [currentUserId, notifications.length, hasMore, loadingMore, onNotificationsUpdate])

  // Setup realtime subscription and initial load when currentUserId changes
  useEffect(() => {
    if (!currentUserId) return

    if (!isSupabaseConfigured || !supabase) return

    const loadNotifications = async () => {
      try {
        // Fetch unread count first
        const { count: unreadCount, error: countErr } = await supabase!
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUserId)
          .eq('read', false)

        if (!countErr && unreadCount !== null) {
          setUnreadNotificationCount(unreadCount)
        }

        // Fetch initial page of 10 notifications
        const { data, error } = await supabase!
          .from('notifications')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .range(0, 9)

        if (error) throw error

        if (data) {
          const mapped = data.map(
            (n: {
              id: string
              user_id: string
              type: NotificationItem['type']
              title: string
              description: string
              link: string | null
              created_at: string
              read: boolean
            }) => ({
              id: n.id,
              userId: n.user_id,
              type: n.type,
              title: n.title,
              description: n.description,
              link: n.link || undefined,
              createdAt: n.created_at,
              read: n.read,
            })
          )
          setNotifications(mapped)
          if (data.length < 10) {
            setHasMore(false)
          }
        }
      } catch (error) {
        console.error('Failed to load notifications from database:', error)
        void import('@/services/errorTracking').then((m) =>
          m.captureException(error, { context: 'loadNotificationsFirstPage' })
        )
      }
    }

    loadNotifications()

    const channel = supabase
      .channel(`notifications-realtime-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const n = payload.new as Record<string, unknown>

          const newNotification: NotificationItem = {
            id: n.id as string,
            userId: n.user_id as string,
            type: n.type as NotificationItem['type'],
            title: n.title as string,
            description: n.description as string,
            link: n.link as string | undefined,
            createdAt: n.created_at as string,
            read: n.read as boolean,
          }

          setNotifications((prev) =>
            [newNotification, ...prev].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          )

          if (!newNotification.read) {
            setUnreadNotificationCount((prev) => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const n = payload.new as Record<string, unknown>
          const isRead = n.read as boolean

          setNotifications((prev) =>
            prev.map((notif) => {
              if (notif.id === (n.id as string)) {
                // If read state changed, adjust unread count
                if (notif.read !== isRead) {
                  setUnreadNotificationCount((prev) => (isRead ? Math.max(0, prev - 1) : prev + 1))
                }
                return { ...notif, read: isRead }
              }
              return notif
            })
          )
        }
      )
      .subscribe()

    subscriptionCleanupRef.current = () => {
      void supabase?.removeChannel(channel)
    }

    return () => {
      subscriptionCleanupRef.current?.()
      subscriptionCleanupRef.current = null
    }
  }, [currentUserId])

  const markNotificationRead = useCallback(
    (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id === notificationId && !n.read) {
            setUnreadNotificationCount((count) => Math.max(0, count - 1))
            return { ...n, read: true }
          }
          return n
        })
      )

      // Persist to Supabase
      if (isSupabaseConfigured && supabase) {
        void supabase.from('notifications').update({ read: true }).eq('id', notificationId)
      }

      onNotificationsUpdate?.(notifications)
    },
    [notifications, onNotificationsUpdate]
  )

  const markAllNotificationsRead = useCallback(() => {
    if (!currentUserId) return

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadNotificationCount(0)

    // Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      void supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUserId)
        .eq('read', false)
    }

    onNotificationsUpdate?.(notifications)
  }, [currentUserId, notifications, onNotificationsUpdate])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadNotificationCount,
        hasMore,
        loadingMore,
        loadMoreNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        createNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
