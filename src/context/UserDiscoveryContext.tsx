/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useEffect, useCallback, type PropsWithChildren } from 'react'
import type { UserProfile, MatchResult, AvailabilitySlot, LearningMode } from '@/types'
import { computeMatchResult, formatShortDate } from '@/utils/app'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getSeedState } from '@/data/seed'

interface DbSkillOffered {
  id: string
  skill_name: string
  category: string
  level: string
}

interface DbSkillWanted {
  id: string
  skill_name: string
  category: string
}

interface DbUser {
  id: string
  username: string
  name: string
  email: string
  photo?: string | null
  city: string
  bio: string
  age?: number | null
  headline: string
  availability?: AvailabilitySlot[] | null
  mode: string
  created_at?: string | null
  joinedAt?: string | null
  last_active_at?: string | null
  lastActiveAt?: string | null
  swap_score?: number | null
  rating?: number | string | null
  review_count?: number | null
  completed_swaps?: number | null
  taught_count?: number | null
  learned_count?: number | null
  badges?: string[] | null
  skills_offered?: DbSkillOffered[] | null
  skills_wanted?: DbSkillWanted[] | null
  reports?: number | null
}

export function mapDbUser(u: DbUser): UserProfile {
  const rating = Number(u.rating) || 0
  const completedSwaps = u.completed_swaps || 0
  const badges: string[] = []
  if (rating >= 4.8) badges.push('Top Rated')
  if (completedSwaps >= 2) badges.push('Active User')

  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    photo: u.photo || `https://api.dicebear.com/9.x/shapes/svg?seed=${u.id}`,
    city: u.city,
    bio: u.bio,
    age: u.age || undefined,
    headline: u.headline,
    availability: (u.availability || []) as AvailabilitySlot[],
    mode: u.mode as LearningMode,
    joinedAt: u.created_at || u.joinedAt || new Date().toISOString(),
    lastActiveAt: u.last_active_at || u.lastActiveAt || new Date().toISOString(),
    swapScore: u.swap_score || 0,
    rating,
    reviewCount: u.review_count || 0,
    completedSwaps,
    taughtCount: u.taught_count || 0,
    learnedCount: u.learned_count || 0,
    badges: u.badges || badges,
    skillsOffered: (u.skills_offered || []).map((s: DbSkillOffered) => ({
      id: s.id,
      name: s.skill_name,
      category: s.category as import('@/types').SkillCategory,
      level: s.level as import('@/types').SkillLevel,
    })),
    skillsWanted: (u.skills_wanted || []).map((s: DbSkillWanted) => ({
      id: s.id,
      name: s.skill_name,
      category: s.category as import('@/types').SkillCategory,
    })),
    reports: u.reports || 0,
  }
}

interface UserDiscoveryContextValue {
  users: UserProfile[]
  suggestedMatches: Array<UserProfile & { match: MatchResult }>
  newTodayUsers: UserProfile[]
  topRatedUsers: UserProfile[]
  hasMore: boolean
  loadingMore: boolean
  loadMoreUsers: () => Promise<void>
  ensureUsersLoaded: (userIds: string[]) => Promise<void>
}

export const UserDiscoveryContext = createContext<UserDiscoveryContextValue | undefined>(undefined)

interface UserDiscoveryProviderProps extends PropsWithChildren {
  users?: UserProfile[]
  currentUser?: UserProfile | null
}

export function UserDiscoveryProvider({ children, users: initialUsers = [], currentUser }: UserDiscoveryProviderProps) {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (initialUsers.length > 0) return initialUsers
    if (!isSupabaseConfigured) {
      return getSeedState().users
    }
    return []
  })
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMoreUsers = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const start = users.length
      const end = start + 11 // 12 users per page
      const { data, error } = await supabase
        .from('users')
        .select('*, skills_offered(*), skills_wanted(*)')
        .range(start, end)

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = (data as unknown as DbUser[]).map(mapDbUser)
        setUsers((current) => {
          const existingIds = new Set(current.map((u) => u.id))
          const filtered = mapped.filter((u) => !existingIds.has(u.id))
          return [...current, ...filtered]
        })
        if (data.length < 12) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more users:', err)
      const { captureException } = await import('@/services/errorTracking')
      captureException(err, { context: 'loadMoreUsers' })
    } finally {
      setLoadingMore(false)
    }
  }, [users.length, hasMore, loadingMore])

  useEffect(() => {
    if (initialUsers.length > 0) {
      setUsers(initialUsers)
      setHasMore(false)
      return
    }

    if (!isSupabaseConfigured || !supabase) return

    const loadUsers = async () => {
      try {
        const { data, error } = await supabase!
          .from('users')
          .select('*, skills_offered(*), skills_wanted(*)')
          .range(0, 11) // Load first page of 12 users
        if (error) throw error

        if (data) {
          setUsers((data as unknown as DbUser[]).map(mapDbUser))
          if (data.length < 12) {
            setHasMore(false)
          }
        }
      } catch (error) {
        console.error('Failed to load users from database:', error)
        void import('@/services/errorTracking').then((m) =>
          m.captureException(error, { context: 'loadUsersFirstPage' })
        )
      }
    }

    loadUsers()
  }, [initialUsers])

  // Keep discovery users list updated when currentUser changes
  useEffect(() => {
    if (!currentUser) return
    setUsers((current) => {
      const idx = current.findIndex((u) => u.id === currentUser.id)
      if (idx === -1) {
        return [...current, currentUser]
      }
      const existing = current[idx]
      if (
        existing.photo === currentUser.photo &&
        existing.name === currentUser.name &&
        existing.city === currentUser.city &&
        existing.headline === currentUser.headline &&
        existing.bio === currentUser.bio &&
        JSON.stringify(existing.skillsOffered) === JSON.stringify(currentUser.skillsOffered) &&
        JSON.stringify(existing.skillsWanted) === JSON.stringify(currentUser.skillsWanted)
      ) {
        return current
      }
      const copy = [...current]
      copy[idx] = { ...existing, ...currentUser }
      return copy
    })
  }, [currentUser])

  // Merge the latest currentUser state dynamically to ensure zero-delay rendering updates
  const mergedUsers = useMemo(() => {
    if (!currentUser) return users
    const idx = users.findIndex((u) => u.id === currentUser.id)
    if (idx === -1) {
      return [...users, currentUser]
    }
    const copy = [...users]
    copy[idx] = { ...copy[idx], ...currentUser }
    return copy
  }, [users, currentUser])

  // Compute suggested matches
  const suggestedMatches = useMemo(
    () =>
      currentUser
        ? mergedUsers
            .filter((u) => u.id !== currentUser.id)
            .map((u) => ({ ...u, match: computeMatchResult(currentUser, u) }))
            .filter((u) => u.match.score >= 55)
            .sort((a, b) => b.match.score - a.match.score)
            .slice(0, 6)
        : [],
    [currentUser, mergedUsers]
  )

  // Compute new today users
  const newTodayUsers = useMemo(
    () =>
      mergedUsers
        .filter((u) => formatShortDate(u.joinedAt) === formatShortDate(new Date().toISOString()))
        .slice(0, 4),
    [mergedUsers]
  )

  // Compute top rated users
  const topRatedUsers = useMemo(
    () =>
      [...mergedUsers]
        .sort((a, b) => b.rating - a.rating || b.swapScore - a.swapScore)
        .slice(0, 4),
    [mergedUsers]
  )

  const ensureUsersLoaded = useCallback(async (userIds: string[]) => {
    if (!isSupabaseConfigured || !supabase || userIds.length === 0) return

    // Filter out userIds we already have loaded
    const loadedIds = new Set(mergedUsers.map((u) => u.id))
    const missingIds = userIds.filter((id) => id && !loadedIds.has(id))

    if (missingIds.length === 0) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, skills_offered(*), skills_wanted(*)')
        .in('id', missingIds)

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = (data as unknown as DbUser[]).map(mapDbUser)
        setUsers((current) => {
          const existingIds = new Set(current.map((u) => u.id))
          const filtered = mapped.filter((u) => !existingIds.has(u.id))
          return [...current, ...filtered]
        })
      }
    } catch (err) {
      console.error('Failed to ensure users loaded:', err)
      const { captureException } = await import('@/services/errorTracking')
      captureException(err, { context: 'ensureUsersLoaded', userIds: missingIds })
    }
  }, [mergedUsers])

  return (
    <UserDiscoveryContext.Provider
      value={{
        users: mergedUsers,
        suggestedMatches,
        newTodayUsers,
        topRatedUsers,
        hasMore,
        loadingMore,
        loadMoreUsers,
        ensureUsersLoaded,
      }}
    >
      {children}
    </UserDiscoveryContext.Provider>
  )
}

export function useUserDiscovery() {
  const context = useContext(UserDiscoveryContext)
  if (!context) {
    throw new Error('useUserDiscovery must be used within UserDiscoveryProvider')
  }
  return context
}
