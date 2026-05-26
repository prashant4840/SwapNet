/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef, useEffect, type PropsWithChildren } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { SwapRequest, ConnectionRequest, SwapRequestPayload, ConnectionRequestPayload, UserProfile } from '@/types'
import { createId } from '@/utils/app'

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

export function RequestProvider({
  children,
  swapRequests: initialSwaps = [],
  connectionRequests: initialConnections = [],
  currentUserId,
  currentUser,
  users = [],
}: RequestProviderProps) {
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(initialSwaps)
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>(initialConnections)
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
          id: newSwap.id,
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

      // Send email notification (async, fire-and-forget)
      if (receiver.email) {
        const offeredSkill = currentUser.skillsOffered.find(
          (s: { id: string; name: string }) => s.id === payload.offeredSkillId
        )
        const wantedSkill = currentUser.skillsWanted.find(
          (s: { id: string; name: string }) => s.id === payload.wantedSkillId
        )
        void supabase.functions.invoke('notify-swap-request', {
          body: {
            receiverEmail: receiver.email,
            receiverName: receiver.name,
            senderName: currentUser.name,
            skillOffered: offeredSkill?.name ?? 'a skill',
            skillWanted: wantedSkill?.name ?? 'a skill',
          },
        })
      }

      return true
    } catch (error) {
      console.error('Failed to send swap request:', error)
      toast.error('Failed to send request. Try again.')
      return false
    }
  }, [currentUser])

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
          id: newConnection.id,
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
      return true
    } catch (error) {
      console.error('Failed to send connection request:', error)
      toast.error('Failed to send connection request.')
      return false
    }
  }, [currentUser])

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

      setSwapRequests((current) =>
        current.map((swap) =>
          swap.id === requestId ? { ...swap, status, updatedAt: new Date().toISOString() } : swap,
        ),
      )

      toast.success(`Request ${status.toLowerCase()}.`)
      return true
    } catch (error) {
      console.error('Failed to respond to swap request:', error)
      toast.error('Failed to respond to request.')
      return false
    }
  }, [])

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
  }, [])

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
