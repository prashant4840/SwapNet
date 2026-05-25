import { createContext, useContext, useState, useEffect, useCallback, useRef, type PropsWithChildren } from 'react'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserProfile, SignupPayload, ProfilePayload } from '@/types'

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
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    const initializeSession = async () => {
      try {
        setLoading(true)
        const response = await supabase!.auth.getSession()
        if (!isActiveRef.current) return

        const authUser = response.data.session?.user ?? null
        setUser(authUser)

        if (authUser && allUsers.length > 0) {
          const profile = findUserProfileByAuthUser(allUsers, authUser)
          setCurrentUser(profile)
          onUserUpdate?.(profile)
        }
      } catch (error) {
        console.error('Failed to initialize session:', error)
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

      if (authUser && allUsers.length > 0) {
        const profile = findUserProfileByAuthUser(allUsers, authUser)
        setCurrentUser(profile)
        onUserUpdate?.(profile)
      } else {
        setCurrentUser(null)
        onUserUpdate?.(null)
      }
    })

    return () => {
      isActiveRef.current = false
      subscription?.unsubscribe()
    }
  }, [allUsers, onUserUpdate])

  const signUp = useCallback(async (payload: SignupPayload): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase is not configured.' }
    }

    try {
      const name = payload.name.trim()
      const email = payload.email.trim().toLowerCase()
      const response = await supabase.auth.signUp({
        email,
        password: payload.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { city: payload.city.trim(), full_name: name, name },
        },
      })

      if (response.error) return { success: false, message: response.error.message }

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
      return { success: false, message: 'Failed to create your account.' }
    }
  }, [])

  const login = useCallback(async (payload: { email: string; password: string }): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase is not configured.' }
    }

    try {
      const response = await supabase.auth.signInWithPassword({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      })

      if (response.error) return { success: false, message: response.error.message }

      const firstName = deriveNameFromAuthUser(response.data.user).split(' ')[0] || 'there'
      toast.success(`Welcome back, ${firstName}.`)
      return { success: true, shouldNavigate: true }
    } catch (error) {
      console.error('Login error:', error)
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
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })

      if (response.error) return { success: false, message: response.error.message }
      return { success: true, shouldNavigate: false }
    } catch (error) {
      console.error('Google sign-in error:', error)
      return { success: false, message: 'Failed to sign in with Google.' }
    }
  }, [])

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return

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
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }, [currentUser, onUserUpdate])

  const getUserById = useCallback((userId: string): UserProfile | null => {
    return allUsers.find((u) => u.id === userId) ?? null
  }, [allUsers])

  const getUserByUsername = useCallback((username: string): UserProfile | null => {
    return allUsers.find((u) => u.username === username) ?? null
  }, [allUsers])

  return (
    <AuthContext.Provider value={{
      user,
      currentUser,
      currentUserId: currentUser?.id ?? null,
      isAuthenticated: !!currentUser,
      loading,
      signUp,
      login,
      loginWithGoogle,
      logout,
      updateProfile,
      getUserById,
      getUserByUsername,
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
