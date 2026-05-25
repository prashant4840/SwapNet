import { createContext, useContext, useState, useEffect, useCallback, useRef, type PropsWithChildren } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { NotificationItem } from '@/types'

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadNotificationCount: number
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

interface NotificationProviderProps extends PropsWithChildren {
  currentUserId?: string | null
  onNotificationsUpdate?: (notifications: NotificationItem[]) => void
}

export function NotificationProvider({
  children,
  currentUserId,
  onNotificationsUpdate,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const subscriptionCleanupRef = useRef<(() => void) | null>(null)

  // Setup realtime subscription when currentUserId changes
  useEffect(() => {
    if (!currentUserId || !isSupabaseConfigured || !supabase) return

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

          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === (n.id as string) ? { ...notif, read: n.read as boolean } : notif
            )
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
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
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

  const unreadNotificationCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
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
