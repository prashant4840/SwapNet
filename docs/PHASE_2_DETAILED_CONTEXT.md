# Phase 2 In Depth: Extract Independent Contexts (Days 2-3)

## 🎯 Phase 2 Overview

**Goal**: Extract 3 independent contexts from the monolithic AppContext
- **ThemeContext** - Theme state management (easiest)
- **AuthContext** - Authentication & user profile (foundation)
- **NotificationContext** - System notifications (medium complexity)

**Why this order**:
1. ThemeContext has ZERO dependencies (no risk)
2. AuthContext is the foundation for all others
3. NotificationContext depends only on AuthContext

**Impact**: These 3 contexts prevent unnecessary re-renders when:
- User toggles theme (only ThemeContext re-renders)
- User receives a notification (only NotificationContext re-renders)
- User logs in/out (only AuthContext re-renders)

---

## 📋 Context 1: ThemeContext (Easiest - ~1 hour)

### What Is It?
Simple dark/light mode toggle stored in localStorage and applied to entire app.

### Current Implementation (AppContext.tsx)
```typescript
// Lines ~1100
const [theme, setTheme] = useState<ThemeMode>(() => {
  const savedTheme = localStorage.getItem('theme')
  return (savedTheme as ThemeMode) || 'light'
})

const toggleTheme = useCallback(() => {
  startTransition(() => {
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', newTheme)
      document.documentElement.classList.toggle('dark')
      return newTheme
    })
  })
}, [])
```

### New ThemeContext (What We'll Create)
**File**: `src/context/ThemeContext.tsx`

```typescript
import { createContext, useContext, useState, useCallback, type PropsWithChildren } from 'react'
import type { ThemeMode } from '@/types'

interface ThemeContextValue {
  theme: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as ThemeMode) || 'light'
  })

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', newTheme)
      document.documentElement.classList.toggle('dark')
      return newTheme
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### Where It's Used
```typescript
// Before (using AppContext)
const { state } = useApp()
const theme = state.theme

// After (using ThemeContext)
const { theme } = useTheme()

// Places that use it:
// - ThemeToggle.tsx (toggles dark/light mode)
// - Global CSS (applies dark class)
```

### Tests Needed: `ThemeContext.test.tsx`
```typescript
describe('ThemeContext', () => {
  it('should provide initial theme from localStorage', () => { })
  it('should toggle theme on toggleTheme call', () => { })
  it('should persist theme to localStorage', () => { })
  it('should apply/remove dark class on document element', () => { })
  it('should throw error when useTheme used outside provider', () => { })
})
```

### Benefits After Extraction
- ✅ Theme toggle only re-renders ThemeContext subscribers
- ✅ No unnecessary re-renders in Chat, Messages, Explore pages
- ✅ 100% independent (no dependencies on other contexts)
- ✅ Can be tested in isolation

---

## 🔐 Context 2: AuthContext (Foundation - ~3 hours)

### What Is It?
Authentication, user session management, and user profile operations.

### Current Implementation (Scattered in AppContext)
```typescript
// Lines ~300-500, ~1500-1700
const [user, setUser] = useState<User | null>(null)
const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)

// Multiple auth functions:
async function signUp(payload: SignupPayload) { }
async function login(payload: { email: string; password: string }) { }
async function loginWithGoogle() { }
async function logout() { }
async function updateProfile(payload: ProfilePayload) { }
function getUserById(userId: string) { }
function getUserByUsername(username: string) { }
```

### New AuthContext (What We'll Create)
**File**: `src/context/AuthContext.tsx` (~400 lines)

```typescript
import { createContext, useContext, useState, useEffect, useCallback, type PropsWithChildren } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserProfile, SignupPayload, ProfilePayload, AuthActionResult } from '@/types'

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

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])

  // Initialize auth session on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    initAuth()
  }, [])

  const signUp = useCallback(async (payload: SignupPayload): Promise<AuthActionResult> => {
    // Implementation: Create user in Supabase Auth
    // Create profile in public.users table
    // Return success/error
  }, [])

  const login = useCallback(async (payload: { email: string; password: string }): Promise<AuthActionResult> => {
    // Implementation: Authenticate with Supabase
    // Fetch user profile from public.users
    // Return success/error
  }, [])

  const loginWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    // Implementation: Google OAuth flow
  }, [])

  const logout = useCallback(async () => {
    // Implementation: Sign out from Supabase
    // Clear local state
  }, [])

  const updateProfile = useCallback(async (payload: ProfilePayload) => {
    // Implementation: Update user profile in database
    // Update currentUser state
  }, [])

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
      currentUserId: user?.id ?? null,
      isAuthenticated: !!user,
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
```

### Where It's Used
```typescript
// Before
const { currentUser, isAuthenticated, login, logout } = useApp()

// After
const { currentUser, isAuthenticated, login, logout } = useAuth()

// Used in:
// - AuthPage.tsx (login/signup)
// - SettingsPage.tsx (update profile)
// - AppShell.tsx (logout button)
// - Profile lookups across app
```

### Tests Needed: `AuthContext.test.tsx`
```typescript
describe('AuthContext', () => {
  describe('Authentication', () => {
    it('should signup user with email', () => { })
    it('should login user with credentials', () => { })
    it('should handle Google OAuth', () => { })
    it('should logout user', () => { })
    it('should restore session on mount', () => { })
  })
  
  describe('Profile Management', () => {
    it('should update user profile', () => { })
    it('should fetch user by ID', () => { })
    it('should fetch user by username', () => { })
  })
  
  describe('State', () => {
    it('should set isAuthenticated true after login', () => { })
    it('should set isAuthenticated false after logout', () => { })
    it('should track loading state', () => { })
  })
})
```

### Why AuthContext First (Before Others)?
- It's the **foundation** - all other contexts depend on it
- Contains core session management
- Used everywhere in the app
- Provides `currentUserId` needed by other contexts

### Benefits After Extraction
- ✅ Auth changes don't trigger NotificationContext re-renders
- ✅ Profile updates isolated to AuthContext
- ✅ Easier to test authentication flows
- ✅ Can be used by other contexts as dependency

---

## 🔔 Context 3: NotificationContext (Medium - ~2 hours)

### What Is It?
System notifications (alerts about messages, swaps, requests, etc.) with real-time subscriptions.

### Current Implementation (AppContext.tsx)
```typescript
// Lines ~945-1000, scattered
const [notifications, setNotifications] = useState<NotificationItem[]>([])

const markNotificationRead = useCallback((notificationId: string) => {
  // Mark as read in DB
  // Update state
}, [])

const markAllNotificationsRead = useCallback(() => {
  // Mark all as read in DB
  // Update state
}, [])

const setupNotificationsSubscription = useCallback((authUser: User) => {
  const channel = supabase.channel('notifications-realtime')
    .on('postgres_changes', { /* ... */ })
    .subscribe()
  
  return () => supabase.removeChannel(channel)
}, [])
```

### New NotificationContext (What We'll Create)
**File**: `src/context/NotificationContext.tsx` (~300 lines)

```typescript
import { createContext, useContext, useState, useEffect, useCallback, type PropsWithChildren } from 'react'
import type { NotificationItem } from '@/types'
import { useAuth } from './AuthContext' // ⚠️ Dependency on AuthContext

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadNotificationCount: number
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: PropsWithChildren) {
  const { currentUserId } = useAuth() // ⚠️ Uses AuthContext
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  // Setup real-time subscription when currentUserId changes
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`notifications:${currentUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`,
      }, (payload) => {
        const newNotification = payload.new as NotificationItem
        setNotifications((prev) => [newNotification, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const markNotificationRead = useCallback((notificationId: string) => {
    // Update in database
    // Update state
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    // Update all in database
    // Update state
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    )
  }, [])

  const unreadNotificationCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadNotificationCount,
      markNotificationRead,
      markAllNotificationsRead,
    }}>
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
```

### Where It's Used
```typescript
// Before
const { state, markNotificationRead } = useApp()
const unreadCount = state.unreadNotificationCount

// After
const { notifications, unreadNotificationCount, markNotificationRead } = useNotifications()

// Used in:
// - AppShell.tsx (show unread badge)
// - NotificationsPage.tsx (list all notifications)
// - Real-time updates (Supabase subscriptions)
```

### Tests Needed: `NotificationContext.test.tsx`
```typescript
describe('NotificationContext', () => {
  describe('Notifications Display', () => {
    it('should provide notifications array', () => { })
    it('should calculate unreadNotificationCount', () => { })
  })
  
  describe('Marking as Read', () => {
    it('should mark single notification as read', () => { })
    it('should mark all notifications as read', () => { })
  })
  
  describe('Real-time Subscriptions', () => {
    it('should setup subscription on mount', () => { })
    it('should receive new notifications', () => { })
    it('should cleanup subscription on unmount', () => { })
  })
  
  describe('Dependencies', () => {
    it('should only subscribe when currentUserId is available', () => { })
  })
})
```

### ⚠️ Dependency Diagram
```
AuthContext
    ↓
    ├─→ NotificationContext (depends on currentUserId from Auth)
    ├─→ Other contexts...
```

### Benefits After Extraction
- ✅ Notification changes don't affect other parts of app
- ✅ Real-time subscription isolated and easier to test
- ✅ Can pause/resume notifications independently
- ✅ Unread badge updates don't trigger full re-render

---

## 📊 Phase 2 Summary Table

| Context | Lines | Complexity | Dependencies | Tests | Time |
|---------|-------|-----------|-------------|-------|------|
| **ThemeContext** | ~80 | Very Low | None | 5 | 1h |
| **AuthContext** | ~400 | Medium | None | 15 | 2-3h |
| **NotificationContext** | ~300 | Medium | AuthContext | 10 | 1-2h |
| **TOTAL** | ~780 | - | - | 30 | ~6h |

---

## 🎬 Implementation Steps (Per Context)

### For Each Context (ThemeContext, AuthContext, NotificationContext):

1. **Create new file** `src/context/XxxContext.tsx`
2. **Extract code** from AppContext.tsx (copy relevant lines)
3. **Create provider component** with useContext hook
4. **Create test file** `src/context/__tests__/XxxContext.test.tsx`
5. **Write tests** (all 5-15 test cases)
6. **Run tests** (`npm test`)
7. **Update AppContext** to import from new contexts (done later in Phase 5)

### Example Extraction Flow
```bash
# Day 2 (Morning): ThemeContext
- Extract theme state & toggleTheme function
- Create ThemeContext.tsx (~80 lines)
- Create ThemeContext.test.tsx (~50 lines)
- Run tests: npm test ✅

# Day 2 (Afternoon): AuthContext
- Extract auth functions & user state
- Create AuthContext.tsx (~400 lines)
- Create AuthContext.test.tsx (~150 lines)
- Run tests: npm test ✅

# Day 3 (Morning): NotificationContext
- Extract notifications state & functions
- Create NotificationContext.tsx (~300 lines)
- Create NotificationContext.test.tsx (~100 lines)
- Run tests: npm test ✅

# Day 3 (Afternoon): Verification
- All 3 contexts created ✅
- All tests passing ✅
- Ready for Phase 3 ✅
```

---

## 🔗 How Contexts Connect

```
AppProvider (Composite - created in Phase 5)
├── ThemeProvider
│   └── { theme, toggleTheme }
├── AuthProvider
│   └── { user, currentUser, login, logout, ... }
└── NotificationProvider (depends on AuthProvider)
    └── { notifications, unreadNotificationCount, ... }

Later phases will add:
├── UserDiscoveryProvider
├── PostProvider
├── ReviewProvider
├── ChatProvider
└── RequestProvider
```

---

## 💡 Key Principles for Phase 2

✅ **Isolation**: Each context is standalone initially
✅ **Testing**: Write tests as you extract
✅ **No breaking changes**: Old code still works (updated in Phase 5)
✅ **Dependencies only flow down**: AuthContext → NotificationContext (not vice versa)
✅ **Single responsibility**: Each context does one thing well

---

## ⚡ Expected Outcomes After Phase 2

### Performance Improvements
- Theme toggle: Re-render only ThemeContext subscribers (~2 components)
- Notification update: Re-render only NotificationContext subscribers (~3 components)
- Auth changes: Re-render only AuthContext subscribers (~5 components)

**Before**: All changes triggered app-wide re-render (55+ components)
**After**: Changes trigger only relevant context subscribers (2-5 components)

### Code Organization
- ✅ Modular contexts: 3 independent, testable modules
- ✅ Clear dependencies: ThemeContext (none) → AuthContext (none) → NotificationContext (Auth)
- ✅ Easier to maintain: Changes isolated to specific context
- ✅ Simpler testing: Test each context independently

### Testing Foundation
- ✅ 30 new test cases
- ✅ Cover happy paths and edge cases
- ✅ Establish testing patterns for remaining contexts (Phase 3-4)

---

## 🎯 What Success Looks Like

After Phase 2:
```bash
✅ 3 new context files created
✅ 3 new test files created
✅ 30+ tests written and passing
✅ npm test → all passing ✅
✅ npm run build → no errors ✅
✅ No breaking changes to existing code ✅
✅ Ready for Phase 3 ✅
```

---

## 📝 Notes on Phase 2

- **No changes to existing pages/components yet** (they still use AppContext for now)
- **New contexts are optional** (will add to AppContext in Phase 5)
- **Can run in parallel**: Extract ThemeContext while writing AuthContext tests
- **Test-driven**: Write tests as you extract code
- **Git-friendly**: Each context in separate commit = easy to review

---
