import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'
import type { UserProfile, MatchResult } from '@/types'
import { computeMatchResult, formatShortDate } from '@/utils/app'

interface UserDiscoveryContextValue {
  users: UserProfile[]
  suggestedMatches: Array<UserProfile & { match: MatchResult }>
  newTodayUsers: UserProfile[]
  topRatedUsers: UserProfile[]
}

const UserDiscoveryContext = createContext<UserDiscoveryContextValue | undefined>(undefined)

interface UserDiscoveryProviderProps extends PropsWithChildren {
  users?: UserProfile[]
  currentUser?: UserProfile | null
}

export function UserDiscoveryProvider({ children, users = [], currentUser }: UserDiscoveryProviderProps) {
  // Compute suggested matches
  const suggestedMatches = useMemo(
    () =>
      currentUser
        ? users
            .filter((u) => u.id !== currentUser.id)
            .map((u) => ({ ...u, match: computeMatchResult(currentUser, u) }))
            .filter((u) => u.match.score >= 55)
            .sort((a, b) => b.match.score - a.match.score)
            .slice(0, 6)
        : [],
    [currentUser, users]
  )

  // Compute new today users
  const newTodayUsers = useMemo(
    () =>
      users
        .filter((u) => formatShortDate(u.joinedAt) === formatShortDate(new Date().toISOString()))
        .slice(0, 4),
    [users]
  )

  // Compute top rated users
  const topRatedUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => b.rating - a.rating || b.swapScore - a.swapScore)
        .slice(0, 4),
    [users]
  )

  return (
    <UserDiscoveryContext.Provider
      value={{
        users,
        suggestedMatches,
        newTodayUsers,
        topRatedUsers,
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
