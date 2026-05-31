/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef, type PropsWithChildren } from 'react'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserProfile, SignupPayload, ProfilePayload } from '@/types'
import { createId } from '@/utils/app'
import { sendWelcomeEmail } from '@/services/email'
import { trackSignup, trackProfileCompleted } from '@/services/analytics'
import { captureException, setUserContext, clearUserContext } from '@/services/errorTracking'
import { monitoring } from '@/services/monitoring'

// Local type definition for auth results
interface AuthActionResult {
  success: boolean
  message?: string
  shouldNavigate?: boolean
}

// Helper functions
function deriveNameFromAuthUser(user: User): string {
  return user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
}

function findUserProfileByAuthUser(users: UserProfile[], authUser: User): UserProfile | null {
  const email = authUser.email?.toLowerCase()
  return users.find((u) => u.email.toLowerCase() === email) ?? null
}

function createFallbackProfile(authUser: User): UserProfile {
  const email = authUser.email?.toLowerCase() ?? ''
  const derivedName = deriveNameFromAuthUser(authUser)

  return {
    id: authUser.id,
    email,
    name: derivedName,
    username: email.split('@')[0] || `user_${authUser.id.slice(0, 6)}`,
    city: authUser.user_metadata?.city || 'Remote',
    bio: 'Tell the community what you love teaching and what you want to learn next.',
    headline: 'New member ready to trade skills',
    photo: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/shapes/svg?seed=${authUser.id}`,
    skillsOffered: [],
    skillsWanted: [],
    availability: [],
    mode: 'Online',
    rating: 0,
    reviewCount: 0,
    completedSwaps: 0,
    swapScore: 0,
    taughtCount: 0,
    learnedCount: 0,
    badges: [],
    reports: 0,
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  }
}

interface AuthContextValue {
  user: User | null
  currentUser: UserProfile | null
  currentUserId: string | null
  isAuthenticated: boolean
  loading: boolean

  // Auth functions
  signUp: (payload: SignupPayload) => Promise<AuthActionResult>
  login: (payload: { email: string; password: string }) => Promise<AuthActionResult>
  loginWithGoogle: () => Promise<AuthActionResult>
  logout: () => Promise<void>

  // Profile functions
  updateProfile: (payload: ProfilePayload) => Promise<void>
  getUserById: (userId: string) => UserProfile | null
  getUserByUsername: (username: string) => UserProfile | null
  reportUser: (userId: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps extends PropsWithChildren {
  onUserUpdate?: (user: UserProfile | null) => void
  allUsers?: UserProfile[]
}

export function AuthProvider({ children, onUserUpdate, allUsers = [] }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const isActiveRef = useRef(true)

  // Initialize auth session on mount
  useEffect(() => {
    isActiveRef.current = true
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    const resolveUserProfile = async (authUser: User) => {
      let profile: UserProfile | null = null
      try {
        const { data, error } = await supabase!
          .from('users')
          .select('*, skills_offered(*), skills_wanted(*)')
          .eq('id', authUser.id)
          .single()

        if (data && !error) {
          const { mapDbUser } = await import('./UserDiscoveryContext')
          profile = mapDbUser(data)
        }
      } catch (err) {
        console.error('Failed to fetch authenticated user profile:', err)
      }

      if (!profile) {
        profile =
          findUserProfileByAuthUser(allUsers, authUser) ||
          createFallbackProfile(authUser)
      }
      return profile
    }

    const initializeSession = async () => {
      try {
        setLoading(true)
        const response = await supabase!.auth.getSession()
        if (!isActiveRef.current) return

        const authUser = response.data.session?.user ?? null
        setUser(authUser)

        if (authUser) {
          const profile = await resolveUserProfile(authUser)
          if (!isActiveRef.current) return
          setCurrentUser(profile)
          onUserUpdate?.(profile)
          setUserContext(profile.id, profile.email, profile.username)
          monitoring.setUser(profile.id, profile.email)
        }
      } catch (error) {
        console.error('Failed to initialize session:', error)
        captureException(error, { context: 'initializeSession' })
      } finally {
        setLoading(false)
      }
    }

    initializeSession()

    // Listen for auth state changes
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActiveRef.current) return
      const authUser = session?.user ?? null
      setUser(authUser)

      if (authUser) {
        resolveUserProfile(authUser).then((profile) => {
          if (!isActiveRef.current) return
          setCurrentUser(profile)
          onUserUpdate?.(profile)
          setUserContext(profile.id, profile.email, profile.username)
          monitoring.setUser(profile.id, profile.email)
        })
      } else {
        setCurrentUser(null)
        onUserUpdate?.(null)
        clearUserContext()
        monitoring.clearUser()
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [allUsers, onUserUpdate])

  const signUp = useCallback(async (payload: SignupPayload): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured || !supabase) {
      const newUser: UserProfile = {
        id: createId('user'),
        username: payload.name.toLowerCase().replace(/\s+/g, '-'),
        name: payload.name,
        email: payload.email,
        photo: '',
        city: payload.city,
        bio: '',
        headline: '',
        skillsOffered: [],
        skillsWanted: [],
        availability: ['Weekdays', 'Evenings'],
        mode: 'Both',
        swapScore: 100,
        rating: 5,
        reviewCount: 0,
        completedSwaps: 0,
        taughtCount: 0,
        learnedCount: 0,
        reports: 0,
        joinedAt: new Date().toISOString(),
        badges: [],
        lastActiveAt: new Date().toISOString(),
      }
      setCurrentUser(newUser)
      onUserUpdate?.(newUser)
      toast.success('Account created. Finish your profile to start matching.')
      return { success: true, shouldNavigate: true }
    }

    try {
      const name = payload.name.trim()
      const email = payload.email.trim().toLowerCase()
      const response = await supabase.auth.signUp({
        email,
        password: payload.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { city: payload.city.trim(), full_name: name, name },
        },
      })

      if (response.error) {
        captureException(response.error, { email, context: 'signUp' })
        return { success: false, message: response.error.message }
      }

      const user = response.data.user
      if (user) {
        trackSignup(user.id, email)
        void sendWelcomeEmail(email, name)
      }

      if (response.data.session) {
        toast.success('Account created. Finish your profile to start matching.')
        return { success: true, shouldNavigate: true }
      }

      toast.success('Account created. Check your email to confirm your address.')
      return {
        success: true,
        message: 'Check your email to confirm your account before continuing.',
        shouldNavigate: false,
      }
    } catch (error) {
      console.error('Signup error:', error)
      captureException(error, { payload, context: 'signUp' })
      return { success: false, message: 'Failed to create your account.' }
    }
  }, [])

  const login = useCallback(async (payload: { email: string; password: string }): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured || !supabase) {
      const email = payload.email.trim().toLowerCase()
      const mockUser = allUsers.find(u => u.email.toLowerCase() === email) || {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Ava Shah',
        email: 'ava@swapnet.app',
        username: 'ava-shah',
        photo: 'https://i.pravatar.cc/300?img=32',
        city: 'Mumbai',
        bio: 'Mock user bio',
        headline: 'Mock user headline',
        skillsOffered: [],
        skillsWanted: [],
        availability: ['Weekdays', 'Evenings'],
        mode: 'Both',
        swapScore: 92,
        rating: 4.9,
        reviewCount: 4,
        completedSwaps: 2,
        taughtCount: 2,
        learnedCount: 2,
        reports: 0,
        lastActiveAt: new Date().toISOString(),
      }
      setCurrentUser(mockUser as UserProfile)
      onUserUpdate?.(mockUser as UserProfile)
      toast.success(`Welcome back, ${mockUser.name.split(' ')[0]}. (Offline Demo)`)
      return { success: true, shouldNavigate: true }
    }

    try {
      const response = await supabase.auth.signInWithPassword({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      })

      if (response.error) {
        captureException(response.error, { email: payload.email, context: 'login' })
        return { success: false, message: response.error.message }
      }

      const firstName = deriveNameFromAuthUser(response.data.user).split(' ')[0] || 'there'
      toast.success(`Welcome back, ${firstName}.`)
      return { success: true, shouldNavigate: true }
    } catch (error) {
      console.error('Login error:', error)
      captureException(error, { email: payload.email, context: 'login' })
      return { success: false, message: 'Failed to sign in.' }
    }
  }, [])

  const loginWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase is not configured.' }
    }

    try {
      const response = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })

      if (response.error) return { success: false, message: response.error.message }
      return { success: true, shouldNavigate: false }
    } catch (error) {
      console.error('Google sign-in error:', error)
      return { success: false, message: 'Failed to sign in with Google.' }
    }
  }, [])

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.success('Logged out. (Offline Demo)')
      setCurrentUser(null)
      onUserUpdate?.(null)
      return
    }

    try {
      const response = await supabase.auth.signOut()
      if (response.error) {
        toast.error(response.error.message)
        return
      }
      toast.success('Logged out.')
      setCurrentUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to log out.')
    }
  }, [])

  const updateProfile = useCallback(async (payload: ProfilePayload) => {
    if (!currentUser) throw new Error('No current user')
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.')
    }

    const updated: UserProfile = {
      ...currentUser,
      ...payload,
      lastActiveAt: new Date().toISOString(),
    }

    try {
      await supabase.from('users').upsert(updated, { onConflict: 'id' })
      setCurrentUser(updated)
      onUserUpdate?.(updated)
      trackProfileCompleted(currentUser.id, updated.username)
    } catch (error) {
      console.error('Failed to update profile:', error)
      captureException(error, { userId: currentUser.id, context: 'updateProfile' })
      throw error
    }
  }, [currentUser, onUserUpdate])

  const getUserById = useCallback((userId: string): UserProfile | null => {
    return allUsers.find((u) => u.id === userId) ?? null
  }, [allUsers])

  const getUserByUsername = useCallback((username: string): UserProfile | null => {
    return allUsers.find((u) => u.username === username) ?? null
  }, [allUsers])

  const reportUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!currentUser || currentUser.id === userId || !supabase) return false

    try {
      const { error } = await supabase.from('abuse_reports').insert({
        reporter_id: currentUser.id,
        reported_user_id: userId,
        reason: 'Reported from profile page',
        created_at: new Date().toISOString(),
      })

      if (error) {
        toast.error('Failed to report user.')
        return false
      }

      toast.success('User reported. Thanks for helping keep the community safe.')
      return true
    } catch (error) {
      console.error('Failed to report user:', error)
      toast.error('Failed to report user.')
      return false
    }
  }, [currentUser])

  return (
    <AuthContext.Provider value={{
      user,
      currentUser,
      currentUserId: currentUser?.id ?? null,
      isAuthenticated: isSupabaseConfigured ? !!user : !!currentUser,
      loading,
      signUp,
      login,
      loginWithGoogle,
      logout,
      updateProfile,
      getUserById,
      getUserByUsername,
      reportUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
