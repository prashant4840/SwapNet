/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthActionResult {
  success: boolean
  message?: string
  shouldNavigate?: boolean
}

interface SignupPayload {
  name: string
  email: string
  password: string
  city: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  signUp: (payload: SignupPayload) => Promise<AuthActionResult>
  login: (payload: { email: string; password: string }) => Promise<AuthActionResult>
  loginWithGoogle: () => Promise<AuthActionResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If Supabase is not configured, immediately set loading false
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    let settled = false

    // Get initial session
    const getInitialSession = async () => {
      try {
        if (!supabase) return
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setUser(null)
      } finally {
        settled = true
        setLoading(false)
      }
    }

    // Safety net: if session check takes more than 3 seconds, unblock UI
    const timeout = setTimeout(() => {
      if (!settled) {
        console.warn('Session check timed out — proceeding as unauthenticated')
        setLoading(false)
      }
    }, 3000)

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (!supabase) return
    
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const signUp = async (payload: SignupPayload): Promise<AuthActionResult> => {
    if (!supabase) {
      return { success: false, message: 'Supabase is not configured.' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        options: {
          data: {
            name: payload.name.trim(),
            city: payload.city.trim(),
          },
        },
      })

      if (error) {
        return { success: false, message: error.message }
      }

      if (data.user && !data.session) {
        return {
          success: true,
          message: 'Account created! Please check your email to verify your account.',
        }
      }

      return { success: true, shouldNavigate: true }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, message: 'Failed to create account' }
    }
  }

  const login = async (payload: { email: string; password: string }): Promise<AuthActionResult> => {
    if (!supabase) {
      return { success: false, message: 'Supabase is not configured.' }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { success: true, shouldNavigate: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Failed to sign in' }
    }
  }

  const loginWithGoogle = async (): Promise<AuthActionResult> => {
    if (!supabase) {
      return { success: false, message: 'Supabase is not configured.' }
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Google login error:', error)
      return { success: false, message: 'Failed to sign in with Google' }
    }
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    signUp,
    login,
    loginWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
