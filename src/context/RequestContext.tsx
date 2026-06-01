/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, type PropsWithChildren } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { SwapRequest, ConnectionRequest, SwapRequestPayload, ConnectionRequestPayload, UserProfile } from '@/types'
import { createId, cleanId } from '@/utils/app'
import { trackSwapRequest, trackSwapAccepted } from '@/services/analytics'
import { sendSwapRequestReceivedEmail, sendSwapRequestAcceptedEmail } from '@/services/email'
import { captureException } from '@/services/errorTracking'

interface RequestContextValue {
  swapRequests: SwapRequest[]
  connectionRequests: ConnectionRequest[]
  sendSwapRequest: (payload: SwapRequestPayload) => Promise<boolean>
  sendConnectionRequest: (payload: ConnectionRequestPayload) => Promise<boolean>
  respondToSwapRequest: (requestId: string, status: 'Accepted' | 'Declined') => Promise<boolean>
  respondToConnectionRequest: (requestId: string, status: 'Accepted' | 'Declined') => Promise<boolean>
  completeSwap: (requestId: string) => Promise<void>
  getSwapById: (swapId: string) => SwapRequest | null
}

const RequestContext = createContext<RequestContextValue | undefined>(undefined)

interface RequestProviderProps extends PropsWithChildren {
  swapRequests?: SwapRequest[]
  connectionRequests?: ConnectionRequest[]
  currentUserId?: string | null
  currentUser?: UserProfile | null
  users?: UserProfile[]
}

import { getSeedState } from '@/data/seed'
import { isSupabaseConfigured } from '@/lib/supabase'
import { UserDiscoveryContext } from './UserDiscoveryContext'
import { NotificationContext } from './NotificationContext'

export function RequestProvider({
  children,
  swapRequests: initialSwaps = [],
  connectionRequests: initialConnections = [],
  currentUserId,
  currentUser,
  users: initialUsers = [],
}: RequestProviderProps) {
  const discovery = useContext(UserDiscoveryContext)
  const notificationsCtx = useContext(NotificationContext)
  const createNotification = notificationsCtx?.createNotification || (async () => {})
  const users = useMemo(() => {
    return initialUsers.length > 0 ? initialUsers : (discovery ? discovery.users : [])
  }, [initialUsers, discovery])

  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(() => {
    if (initialSwaps.length > 0) return initialSwaps
    if (!isSupabaseConfigured) {
      return getSeedState().swapRequests
    }
    return []
  })
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>(() => {
    if (initialConnections.length > 0) return initialConnections
    if (!isSupabaseConfigured) {
      return getSeedState().connectionRequests
    }
    return []
  })

  useEffect(() => {
    if (initialSwaps.length > 0) {
      setSwapRequests(initialSwaps)
    }
    if (initialConnections.length > 0) {
      setConnectionRequests(initialConnections)
    }
  }, [initialSwaps, initialConnections])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUserId) return

    const loadRequests = async () => {
      try {
        const [swapsRes, connsRes] = await Promise.all([
          supabase!
            .from('swap_requests')
            .select('*')
            .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`),
          supabase!
            .from('connection_requests')
            .select('*')
            .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`),
        ])

        if (swapsRes.error) throw swapsRes.error
        if (connsRes.error) throw connsRes.error

        if (swapsRes.data) {
          setSwapRequests(
            swapsRes.data.map(
              (s: {
                id: string
                sender_id: string
                receiver_id: string
                message: string
                status: SwapRequest['status']
                created_at: string
                updated_at: string
                offered_skill_id: string | null
                wanted_skill_id: string | null
                completed_by: string[] | null
              }) => ({
                id: s.id,
                senderId: s.sender_id,
                receiverId: s.receiver_id,
                message: s.message,
                status: s.status,
                createdAt: s.created_at,
                updatedAt: s.updated_at,
                offeredSkillId: s.offered_skill_id || '',
                wantedSkillId: s.wanted_skill_id || '',
                completedBy: s.completed_by || [],
              })
            )
          )
        }

        if (connsRes.data) {
          setConnectionRequests(
            connsRes.data.map(
              (c: {
                id: string
                sender_id: string
                receiver_id: string
                message: string
                status: ConnectionRequest['status']
                created_at: string
                updated_at: string
              }) => ({
                id: c.id,
                senderId: c.sender_id,
                receiverId: c.receiver_id,
                message: c.message,
                status: c.status,
                createdAt: c.created_at,
                updatedAt: c.updated_at,
              })
            )
          )
        }
      } catch (error) {
        console.error('Failed to load requests from database:', error)
      }
    }

    loadRequests()

    if (typeof supabase.channel !== 'function') return

    const swapChannel = supabase
      .channel(`swap-requests-realtime-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swap_requests',
        },
        (payload) => {
          const s = payload.new as {
            id: string
            sender_id: string
            receiver_id: string
            message: string
            status: SwapRequest['status']
            created_at: string
            updated_at: string
            offered_skill_id: string | null
            wanted_skill_id: string | null
            completed_by: string[] | null
          } | null
          const old = payload.old as { id: string } | null
          const eventType = payload.eventType

          if (eventType === 'DELETE') {
            const oldId = old?.id
            if (oldId) {
              setSwapRequests((current) => current.filter((item) => cleanId(item.id) !== cleanId(oldId)))
            }
            return
          }

          if (s && (s.sender_id === currentUserId || s.receiver_id === currentUserId)) {
            const mappedSwap: SwapRequest = {
              id: s.id,
              senderId: s.sender_id,
              receiverId: s.receiver_id,
              message: s.message,
              status: s.status,
              createdAt: s.created_at,
              updatedAt: s.updated_at,
              offeredSkillId: s.offered_skill_id || '',
              wantedSkillId: s.wanted_skill_id || '',
              completedBy: s.completed_by || [],
            }

            setSwapRequests((current) => {
              const cleanedId = cleanId(mappedSwap.id)
              const exists = current.some((item) => cleanId(item.id) === cleanedId)
              if (eventType === 'INSERT') {
                if (exists) return current
                return [mappedSwap, ...current]
              } else if (eventType === 'UPDATE') {
                return current.map((item) => (cleanId(item.id) === cleanedId ? mappedSwap : item))
              }
              return current
            })
          }
        }
      )
      .subscribe()

    const connChannel = supabase
      .channel(`connection-requests-realtime-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests',
        },
        (payload) => {
          const c = payload.new as {
            id: string
            sender_id: string
            receiver_id: string
            message: string
            status: ConnectionRequest['status']
            created_at: string
            updated_at: string
          } | null
          const old = payload.old as { id: string } | null
          const eventType = payload.eventType

          if (eventType === 'DELETE') {
            const oldId = old?.id
            if (oldId) {
              setConnectionRequests((current) => current.filter((item) => cleanId(item.id) !== cleanId(oldId)))
            }
            return
          }

          if (c && (c.sender_id === currentUserId || c.receiver_id === currentUserId)) {
            const mappedConn: ConnectionRequest = {
              id: c.id,
              senderId: c.sender_id,
              receiverId: c.receiver_id,
              message: c.message,
              status: c.status,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
            }

            setConnectionRequests((current) => {
              const cleanedId = cleanId(mappedConn.id)
              const exists = current.some((item) => cleanId(item.id) === cleanedId)
              if (eventType === 'INSERT') {
                if (exists) return current
                return [mappedConn, ...current]
              } else if (eventType === 'UPDATE') {
                return current.map((item) => (cleanId(item.id) === cleanedId ? mappedConn : item))
              }
              return current
            })
          }
        }
      )
      .subscribe()

    return () => {
      if (supabase) {
        void supabase.removeChannel(swapChannel)
        void supabase.removeChannel(connChannel)
      }
    }
  }, [currentUserId])

  const stateRef = useRef({ swapRequests, connectionRequests, users, currentUserId, currentUser })

  useEffect(() => {
    stateRef.current = { swapRequests, connectionRequests, users, currentUserId, currentUser }
  }, [swapRequests, connectionRequests, users, currentUserId, currentUser])

  const sendSwapRequest = useCallback(async (payload: SwapRequestPayload): Promise<boolean> => {
    if (!currentUser) {
      toast.error('Log in to send a swap request.')
      return false
    }

    if (!supabase) {
      toast.error('Supabase is not configured.')
      return false
    }

    const duplicate = stateRef.current.swapRequests.some(
      (swap) =>
        swap.senderId === currentUser.id &&
        swap.receiverId === payload.receiverId &&
        ['Pending', 'Accepted'].includes(swap.status),
    )

    if (duplicate) {
      toast.error('You already have an active request with this member.')
      return false
    }

    const receiver = stateRef.current.users.find((u) => u.id === payload.receiverId)
    if (!receiver) {
      toast.error('Could not find that member.')
      return false
    }

    const newSwap: SwapRequest = {
      id: createId('swap'),
      senderId: currentUser.id,
      receiverId: payload.receiverId,
      message: payload.message.trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offeredSkillId: payload.offeredSkillId,
      wantedSkillId: payload.wantedSkillId,
      completedBy: [],
    }

    try {
      const { data, error } = await supabase
        .from('swap_requests')
        .insert({
          id: cleanId(newSwap.id),
          sender_id: newSwap.senderId,
          receiver_id: newSwap.receiverId,
          message: newSwap.message,
          status: newSwap.status,
          offered_skill_id: newSwap.offeredSkillId || null,
          wanted_skill_id: newSwap.wantedSkillId || null,
          completed_by: [],
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to send request. Try again.')
        return false
      }

      const createdSwap: SwapRequest = {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        message: data.message,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        offeredSkillId: data.offered_skill_id ?? '',
        wantedSkillId: data.wanted_skill_id ?? '',
        completedBy: data.completed_by ?? [],
      }

      setSwapRequests((current) => [createdSwap, ...current])

      toast.success(`Swap request sent to ${receiver.name}.`)

      // Generate notification
      void createNotification({
        userId: payload.receiverId,
        type: 'request',
        title: 'New Swap Request',
        description: `${currentUser.name} wants to trade skills with you.`,
        link: '/notifications',
      })

      // Send email notification (async, fire-and-forget)
      if (receiver.email) {
        const offeredSkill = currentUser.skillsOffered.find(
          (s: { id: string; name: string }) => s.id === payload.offeredSkillId
        )
        const wantedSkill = currentUser.skillsWanted.find(
          (s: { id: string; name: string }) => s.id === payload.wantedSkillId
        )
        void sendSwapRequestReceivedEmail({
          receiverEmail: receiver.email,
          receiverName: receiver.name,
          senderName: currentUser.name,
          skillOffered: offeredSkill?.name ?? 'a skill',
          skillWanted: wantedSkill?.name ?? 'a skill',
        })
      }

      // Trigger analytics tracking
      trackSwapRequest(
        currentUser.id,
        receiver.id,
        currentUser.skillsOffered.find((s: { id: string; name: string }) => s.id === payload.offeredSkillId)?.name ?? 'a skill',
        currentUser.skillsWanted.find((s: { id: string; name: string }) => s.id === payload.wantedSkillId)?.name ?? 'a skill'
      )

      return true
    } catch (error) {
      console.error('Failed to send swap request:', error)
      captureException(error, { context: 'sendSwapRequest', payload })
      toast.error('Failed to send request. Try again.')
      return false
    }
  }, [currentUser, createNotification])

  const sendConnectionRequest = useCallback(async (payload: ConnectionRequestPayload): Promise<boolean> => {
    if (!currentUser) {
      toast.error('Log in to connect with members.')
      return false
    }

    if (!supabase) {
      toast.error('Supabase is not configured.')
      return false
    }

    const duplicate = stateRef.current.connectionRequests.some(
      (conn) =>
        conn.senderId === currentUser.id &&
        conn.receiverId === payload.receiverId &&
        conn.status === 'Pending',
    )

    if (duplicate) {
      toast.error('You already have a pending connection request with this member.')
      return false
    }

    const receiver = stateRef.current.users.find((u) => u.id === payload.receiverId)
    if (!receiver) {
      toast.error('Could not find that member.')
      return false
    }

    const newConnection: ConnectionRequest = {
      id: createId('connection'),
      senderId: currentUser.id,
      receiverId: payload.receiverId,
      message: payload.message.trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .insert({
          id: cleanId(newConnection.id),
          sender_id: newConnection.senderId,
          receiver_id: newConnection.receiverId,
          message: newConnection.message,
          status: newConnection.status,
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to send connection request.')
        return false
      }

      const createdConnection: ConnectionRequest = {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        message: data.message,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      setConnectionRequests((current) => [createdConnection, ...current])

      toast.success(`Connection request sent to ${receiver.name}.`)

      // Generate notification
      void createNotification({
        userId: payload.receiverId,
        type: 'connection',
        title: 'New Connection Request',
        description: `${currentUser.name} wants to connect with you.`,
        link: '/notifications',
      })

      return true
    } catch (error) {
      console.error('Failed to send connection request:', error)
      toast.error('Failed to send connection request.')
      return false
    }
  }, [currentUser, createNotification])

  const respondToSwapRequest = useCallback(async (requestId: string, status: 'Accepted' | 'Declined'): Promise<boolean> => {
    if (!supabase) return false

    try {
      const { error } = await supabase
        .from('swap_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) {
        toast.error('Failed to respond to request.')
        return false
      }

      const swap = stateRef.current.swapRequests.find((s) => s.id === requestId)
      if (swap) {
        if (status === 'Accepted') {
          const partner = (stateRef.current.users as UserProfile[]).find((u) => u.id === swap.senderId)
          if (partner && partner.email) {
            void sendSwapRequestAcceptedEmail({
              receiverEmail: partner.email,
              receiverName: partner.name,
              senderName: currentUser?.name || 'A user',
            })
          }
          trackSwapAccepted(requestId, swap.senderId, swap.receiverId)
        }

        // Generate notification
        void createNotification({
          userId: swap.senderId,
          type: 'request',
          title: `Swap Request ${status}`,
          description: `${currentUser?.name || 'A user'} has ${status.toLowerCase()} your swap request.`,
          link: '/notifications',
        })
      }

      setSwapRequests((current) =>
        current.map((s) =>
          s.id === requestId ? { ...s, status, updatedAt: new Date().toISOString() } : s,
        ),
      )

      toast.success(`Request ${status.toLowerCase()}.`)
      return true
    } catch (error) {
      console.error('Failed to respond to swap request:', error)
      captureException(error, { context: 'respondToSwapRequest', requestId, status })
      toast.error('Failed to respond to request.')
      return false
    }
  }, [currentUser, createNotification])

  const respondToConnectionRequest = useCallback(async (requestId: string, status: 'Accepted' | 'Declined'): Promise<boolean> => {
    if (!supabase) return false

    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) {
        toast.error('Failed to respond to connection request.')
        return false
      }

      const conn = stateRef.current.connectionRequests.find((c) => c.id === requestId)
      if (conn) {
        void createNotification({
          userId: conn.senderId,
          type: 'connection',
          title: `Connection Request ${status}`,
          description: `${currentUser?.name || 'A user'} has ${status.toLowerCase()} your connection request.`,
          link: '/notifications',
        })
      }

      setConnectionRequests((current) =>
        current.map((conn) =>
          conn.id === requestId ? { ...conn, status, updatedAt: new Date().toISOString() } : conn,
        ),
      )

      toast.success(`Connection request ${status.toLowerCase()}.`)
      return true
    } catch (error) {
      console.error('Failed to respond to connection request:', error)
      toast.error('Failed to respond to connection request.')
      return false
    }
  }, [currentUser, createNotification])

  const completeSwap = useCallback(async (requestId: string): Promise<void> => {
    if (!currentUser || !supabase) return

    try {
      const swap = stateRef.current.swapRequests.find((s) => s.id === requestId)
      if (!swap) return

      const completedBy = swap.completedBy || []
      if (!completedBy.includes(currentUser.id)) {
        completedBy.push(currentUser.id)
      }

      const newStatus = completedBy.length === 2 ? 'Completed' : swap.status

      const { error } = await supabase
        .from('swap_requests')
        .update({
          status: newStatus,
          completed_by: completedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) {
        toast.error('Failed to mark swap as complete.')
        return
      }

      setSwapRequests((current) =>
        current.map((s) =>
          s.id === requestId
            ? { ...s, status: newStatus as 'Accepted' | 'Declined' | 'Completed', completedBy, updatedAt: new Date().toISOString() }
            : s,
        ),
      )

      if (newStatus === 'Completed') {
        toast.success('Swap marked as complete!')
      }
    } catch (error) {
      console.error('Failed to complete swap:', error)
      toast.error('Failed to mark swap as complete.')
    }
  }, [currentUser])

  const getSwapById = useCallback(
    (swapId: string) => {
      return stateRef.current.swapRequests.find((s) => s.id === swapId) ?? null
    },
    [],
  )

  return (
    <RequestContext.Provider
      value={{
        swapRequests,
        connectionRequests,
        sendSwapRequest,
        sendConnectionRequest,
        respondToSwapRequest,
        respondToConnectionRequest,
        completeSwap,
        getSwapById,
      }}
    >
      {children}
    </RequestContext.Provider>
  )
}

export function useRequests() {
  const context = useContext(RequestContext)
  if (!context) {
    throw new Error('useRequests must be used within RequestProvider')
  }
  return context
}
