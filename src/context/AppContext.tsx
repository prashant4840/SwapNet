/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { getSeedState } from '@/data/seed'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type {
  AppState,
  ChatMessage,
  ConnectionRequestPayload,
  LookingForPost,
  MatchResult,
  MessageThread,
  NotificationItem,
  ProfilePayload,
  Review,
  SignupPayload,
  SkillCategory,
  SwapRequest,
  SwapRequestPayload,
  UserProfile,
} from '@/types'
import {
  buildShareUrl,
  buildMessageThreads,
  computeMatchResult,
  createId,
  formatShortDate,
  hydrateState,
  resolveSwapPartner,
  slugify,
} from '@/utils/app'

const STORAGE_KEY = 'skillbridge-state-v1'
const CHANNEL_KEY = 'skillbridge-live-sync'

interface AuthActionResult {
  success: boolean
  message?: string
  shouldNavigate?: boolean
}

interface AppContextValue {
  state: AppState
  user: User | null
  users: UserProfile[]
  currentUser: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  messageThreads: MessageThread[]
  unreadNotificationCount: number
  suggestedMatches: Array<UserProfile & { match: MatchResult }>
  newTodayUsers: UserProfile[]
  topRatedUsers: UserProfile[]
  signUp: (payload: SignupPayload) => Promise<AuthActionResult>
  login: (payload: { email: string; password: string }) => Promise<AuthActionResult>
  loginWithGoogle: () => Promise<AuthActionResult>
  logout: () => Promise<void>
  updateProfile: (payload: ProfilePayload) => Promise<void>
  sendSwapRequest: (payload: SwapRequestPayload) => Promise<boolean>
  sendConnectionRequest: (payload: ConnectionRequestPayload) => boolean
  respondToSwapRequest: (
    requestId: string,
    status: Extract<SwapRequest['status'], 'Accepted' | 'Declined'>,
  ) => Promise<void>
  respondToConnectionRequest: (
    requestId: string,
    status: 'Accepted' | 'Declined',
  ) => void
  completeSwap: (requestId: string) => Promise<void>
  sendChatMessage: (
    threadId: string,
    message: string,
    type?: ChatMessage['type'],
  ) => Promise<void>
  addReview: (requestId: string, rating: number, comment: string) => Promise<boolean>
  createPost: (payload: Pick<LookingForPost, 'skillName' | 'category' | 'note' | 'mode'>) => void
  reportUser: (userId: string) => void
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  toggleTheme: () => void
  resetDemoData: () => void
  getUserById: (userId: string) => UserProfile | null
  getUserByUsername: (username: string) => UserProfile | null
  getSwapById: (swapId: string) => SwapRequest | null
  getThreadById: (threadId: string) => MessageThread | null
  getMessagesForThread: (threadId: string) => ChatMessage[]
  getMessagesForSwap: (swapId: string) => ChatMessage[]
  getReviewsForUser: (userId: string) => Review[]
  dbFetchAllUsers: () => Promise<UserProfile[]>
  dbFetchSwapRequests: (userId: string) => Promise<SwapRequest[]>
  dbFetchNotifications: (userId: string) => Promise<NotificationItem[]>
  dbFetchPosts: () => Promise<LookingForPost[]>
  dbCreatePost: (post: Omit<LookingForPost, 'id' | 'createdAt' | 'responses'>) => Promise<LookingForPost>
  dbFetchReviews: (userId: string) => Promise<Review[]>
}

const AppContext = createContext<AppContextValue | null>(null)

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function toTitleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function loadInitialState() {
  if (typeof window === 'undefined') {
    return getSeedState('light')
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const fallback = getSeedState(prefersDark ? 'dark' : 'light')

  if (!rawState) {
    return fallback
  }

  try {
    const parsed = JSON.parse(rawState) as AppState
    return hydrateState(parsed)
  } catch {
    return fallback
  }
}

function resolveAuthProvider(user: User | null): AppState['auth']['provider'] {
  const provider = user?.app_metadata?.provider
  if (provider === 'google') return 'google'
  if (provider === 'email') return 'email'
  return user ? 'email' : null
}

function getAuthMetadataValue(user: User, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function deriveNameFromAuthUser(user: User) {
  const explicitName =
    getAuthMetadataValue(user, 'full_name') || getAuthMetadataValue(user, 'name')
  if (explicitName) return explicitName
  const emailPrefix = normalizeEmail(user.email).split('@')[0]?.replace(/[._-]+/g, ' ') ?? ''
  return emailPrefix ? toTitleCase(emailPrefix) : 'SkillBridge Member'
}

function deriveAvatarFromAuthUser(user: User, username: string) {
  const avatarUrl =
    getAuthMetadataValue(user, 'avatar_url') || getAuthMetadataValue(user, 'picture')
  return avatarUrl || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(username)}`
}

function findUserProfileByAuthUser(users: UserProfile[], authUser: User) {
  const authEmail = normalizeEmail(authUser.email)
  return (
    users.find(
      (profile) =>
        profile.id === authUser.id ||
        (authEmail.length > 0 && normalizeEmail(profile.email) === authEmail),
    ) ?? null
  )
}

function createProfileFromAuthUser(authUser: User, users: UserProfile[]) {
  const name = deriveNameFromAuthUser(authUser)
  const usernameSeed =
    getAuthMetadataValue(authUser, 'user_name') ||
    getAuthMetadataValue(authUser, 'preferred_username') ||
    normalizeEmail(authUser.email).split('@')[0] ||
    name
  const usernameBase = slugify(usernameSeed) || `member-${authUser.id.slice(0, 8)}`
  let username = usernameBase
  let count = 1

  while (users.some((profile) => profile.username === username)) {
    count += 1
    username = `${usernameBase}-${count}`
  }

  return {
    id: authUser.id,
    username,
    name,
    email: authUser.email ?? '',
    city: getAuthMetadataValue(authUser, 'city') || 'Remote',
    bio: 'Tell the community what you love teaching and what you want to learn next.',
    headline: 'New member ready to trade skills',
    photo: deriveAvatarFromAuthUser(authUser, username),
    age: undefined,
    availability: ['Weekends'] as ['Weekends'],
    mode: 'Online' as const,
    joinedAt: authUser.created_at ?? new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    badges: ['New Today'],
    skillsOffered: [],
    skillsWanted: [],
    swapScore: 0,
    rating: 0,
    reviewCount: 0,
    completedSwaps: 0,
    taughtCount: 0,
    learnedCount: 0,
    reports: 0,
  } satisfies UserProfile
}

function syncStateWithAuthenticatedUser(current: AppState, authUser: User | null) {
  const mode = isSupabaseConfigured ? 'supabase' : current.auth.mode

  if (!authUser) {
    if (
      current.users.length > 0 ||
      current.messageThreads.length > 0 ||
      current.unreadNotificationCount > 0
    ) {
      return {
        ...current,
        auth: { mode, provider: 'email' as const, currentUserId: null },
      }
    }

    return {
      ...current,
      auth: { mode, provider: 'email' as const, currentUserId: null, user: authUser },
    }
  }

  const provider = resolveAuthProvider(authUser)
  const existingProfile = findUserProfileByAuthUser(current.users, authUser)

  if (existingProfile) {
    const nextName = existingProfile.name || deriveNameFromAuthUser(authUser)
    const nextEmail = authUser.email ?? existingProfile.email
    const nextPhoto = existingProfile.photo || deriveAvatarFromAuthUser(authUser, existingProfile.username)
    const profileChanged =
      nextName !== existingProfile.name ||
      nextEmail !== existingProfile.email ||
      nextPhoto !== existingProfile.photo
    const authChanged =
      current.auth.currentUserId !== existingProfile.id ||
      current.auth.provider !== provider ||
      current.auth.mode !== mode

    if (!profileChanged && !authChanged) return current

    return {
      ...current,
      users: profileChanged
        ? current.users.map((profile) =>
            profile.id === existingProfile.id
              ? { ...profile, name: nextName, email: nextEmail, photo: nextPhoto }
              : profile,
          )
        : current.users,
      auth: { currentUserId: existingProfile.id, provider, mode },
    }
  }

  const newProfile = createProfileFromAuthUser(authUser, current.users)

  return {
    ...current,
    users: [newProfile, ...current.users],
    auth: { currentUserId: newProfile.id, provider, mode },
    notifications: [
      createNotification(
        newProfile.id,
        'system',
        'Profile created',
        'Add the skills you offer and want to learn to unlock better matches.',
        '/settings',
      ),
      ...current.notifications,
    ],
  }
}

function createNotification(
  userId: string,
  type: NotificationItem['type'],
  title: string,
  description: string,
  link?: string,
) {
  return {
    id: createId('notification'),
    userId,
    type,
    title,
    description,
    link,
    createdAt: new Date().toISOString(),
    read: false,
  } satisfies NotificationItem
}

function touchUsers(users: UserProfile[], ...userIds: Array<string | null | undefined>) {
  const updatedAt = new Date().toISOString()
  const targetIds = new Set(userIds.filter(Boolean))
  if (!targetIds.size) return users
  return users.map((user) =>
    targetIds.has(user.id) ? { ...user, lastActiveAt: updatedAt } : user,
  )
}

function resolveThreadPartnerId(state: AppState, currentUserId: string, threadId: string) {
  const swap = state.swapRequests.find((item) => item.id === threadId)
  if (swap) return swap.senderId === currentUserId ? swap.receiverId : swap.senderId
  const connection = state.connectionRequests.find((item) => item.id === threadId)
  if (connection) return connection.senderId === currentUserId ? connection.receiverId : connection.senderId
  return null
}

// ─── Supabase DB helpers ──────────────────────────────────────────────────────

async function dbUpsertProfile(profile: UserProfile) {
  if (!supabase) return
  await supabase.from('users').upsert({
    id: profile.id,
    username: profile.username,
    name: profile.name,
    email: profile.email,
    photo: profile.photo,
    city: profile.city,
    bio: profile.bio,
    headline: profile.headline,
    age: profile.age ?? null,
    availability: profile.availability,
    mode: profile.mode,
    joined_at: profile.joinedAt,
    last_active_at: profile.lastActiveAt,
    swap_score: profile.swapScore,
    rating: profile.rating,
    review_count: profile.reviewCount,
    completed_swaps: profile.completedSwaps,
    taught_count: profile.taughtCount,
    learned_count: profile.learnedCount,
    badges: profile.badges,
    reports: profile.reports,
  }, { onConflict: 'id' })
}

async function dbUpsertSkills(userId: string, offered: UserProfile['skillsOffered'], wanted: UserProfile['skillsWanted']) {
  if (!supabase) return

  await supabase.from('skills_offered').delete().eq('user_id', userId)
  await supabase.from('skills_wanted').delete().eq('user_id', userId)

  if (offered.length > 0) {
    await supabase.from('skills_offered').insert(
      offered.map((s) => ({
        id: s.id,
        user_id: userId,
        skill_name: s.name,
        category: s.category,
        level: s.level ?? 'Beginner',
      }))
    )
  }

  if (wanted.length > 0) {
    await supabase.from('skills_wanted').insert(
      wanted.map((s) => ({
        id: s.id,
        user_id: userId,
        skill_name: s.name,
        category: s.category,
      }))
    )
  }
}

async function dbFetchAllUsers(): Promise<UserProfile[]> {
  if (!supabase) return []

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('joined_at', { ascending: false })

  if (error || !users) return []

  const { data: offered } = await supabase.from('skills_offered').select('*')
  const { data: wanted } = await supabase.from('skills_wanted').select('*')

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    photo: u.photo,
    city: u.city,
    bio: u.bio,
    headline: u.headline,
    age: u.age ?? undefined,
    availability: u.availability ?? [],
    mode: u.mode,
    joinedAt: u.joined_at,
    lastActiveAt: u.last_active_at,
    swapScore: u.swap_score ?? 0,
    rating: u.rating ?? 0,
    reviewCount: u.review_count ?? 0,
    completedSwaps: u.completed_swaps ?? 0,
    taughtCount: u.taught_count ?? 0,
    learnedCount: u.learned_count ?? 0,
    badges: u.badges ?? [],
    reports: u.reports ?? 0,
    skillsOffered: (offered ?? [])
      .filter((s) => s.user_id === u.id)
      .map((s) => ({ id: s.id, name: s.skill_name, category: s.category, level: s.level })),
    skillsWanted: (wanted ?? [])
      .filter((s) => s.user_id === u.id)
      .map((s) => ({ id: s.id, name: s.skill_name, category: s.category })),
  }))
}

async function dbFetchSwapRequests(userId: string): Promise<SwapRequest[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('swap_requests')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    offeredSkillId: r.offered_skill_id ?? '',
    wantedSkillId: r.wanted_skill_id ?? '',
    completedBy: r.completed_by ?? [],
  }))
}



async function dbFetchChatMessages(swapId: string): Promise<ChatMessage[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('swap_id', swapId)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((m) => ({
    id: m.id as string,
    threadId: m.swap_id as string,
    swapRequestId: m.swap_id as string,
    senderId: m.sender_id as string,
    receiverId: (m.receiver_id as string) ?? undefined,
    message: m.message as string,
    timestamp: m.created_at as string,
    type: (m.type as ChatMessage['type']) ?? 'text',
  }))
}

async function dbFetchNotifications(userId: string): Promise<NotificationItem[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((n) => ({
    id: n.id as string,
    userId: n.user_id as string,
    type: n.type as NotificationItem['type'],
    title: n.title as string,
    description: n.description as string,
    link: n.link as string | undefined,
    createdAt: n.created_at as string,
    read: n.read as boolean,
  }))
}

async function dbMarkNotificationRead(notificationId: string): Promise<void> {
  if (!supabase) return
  
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
}

async function dbMarkAllNotificationsRead(userId: string): Promise<void> {
  if (!supabase) return
  
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
}

async function dbFetchPosts(): Promise<LookingForPost[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((p) => ({
    id: p.id as string,
    userId: p.user_id as string,
    skillName: p.skill_name as string,
    category: p.category as SkillCategory,
    note: p.note as string,
    city: p.city as string,
    mode: p.mode as 'Online' | 'In-person' | 'Both',
    createdAt: p.created_at as string,
    responses: p.responses as number,
  }))
}

async function dbCreatePost(post: Omit<LookingForPost, 'id' | 'createdAt' | 'responses'>): Promise<LookingForPost> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: post.userId,
      skill_name: post.skillName,
      category: post.category,
      note: post.note,
      city: post.city,
      mode: post.mode,
    })
    .select()
    .single()

  if (error || !data) throw new Error('Failed to create post')

  return {
    id: data.id as string,
    userId: data.user_id as string,
    skillName: data.skill_name as string,
    category: data.category as SkillCategory,
    note: data.note as string,
    city: data.city as string,
    mode: data.mode as 'Online' | 'In-person' | 'Both',
    createdAt: data.created_at as string,
    responses: data.responses as number,
  }
}

async function dbFetchReviews(userId: string): Promise<Review[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((r) => ({
    id: r.id,
    reviewerId: r.reviewer_id,
    revieweeId: r.reviewee_id,
    swapRequestId: r.swap_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(loadInitialState)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const stateRef = useRef(state)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
    document.documentElement.classList.toggle('light', state.theme === 'light')
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(CHANNEL_KEY)
    channelRef.current = channel
    channel.onmessage = (event: MessageEvent<AppState>) => {
      const next = hydrateState(event.data)
      stateRef.current = next
      startTransition(() => setState(next))
    }
    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [])

  function applyState(next: AppState, broadcast = true) {
    const hydrated = hydrateState(next)
    stateRef.current = hydrated
    startTransition(() => setState(hydrated))
    if (broadcast) channelRef.current?.postMessage(hydrated)
  }

  const mutateState = useCallback((
    updater: (current: AppState) => AppState,
    options?: { broadcast?: boolean },
  ) => {
    applyState(updater(stateRef.current), options?.broadcast ?? true)
  }, [])

  // ── Load chat messages from Supabase ─────────────────────────────────────
  const loadChatMessages = useCallback(async (swapId: string) => {
    if (!isSupabaseConfigured) return
    
    try {
      const chatMessages = await dbFetchChatMessages(swapId)
      
      mutateState((current) => {
        // Merge with existing messages and deduplicate by id
        const existingMessageIds = new Set(current.messages.map(m => m.id))
        const newMessages = chatMessages.filter(m => !existingMessageIds.has(m.id))
        
        return {
          ...current,
          messages: [...current.messages, ...newMessages].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ),
        }
      })
    } catch (err) {
      console.error('Failed to load chat messages:', err)
    }
  }, [mutateState])

  // ── Realtime notifications subscription ───────────────────────────────────
  const setupNotificationsSubscription = useCallback((authUser: User) => {
    if (!isSupabaseConfigured || !supabase || !authUser) return

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = payload.new as Record<string, unknown>
        
        // Only process notifications for current user
        if (n.user_id === authUser.id) {
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
          
          mutateState((current) => ({
            ...current,
            notifications: [newNotification, ...current.notifications].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ),
          }))
        }
      })
      .subscribe()

    return () => {
      void supabase?.removeChannel(channel)
    }
  }, [mutateState])

  const syncSupabaseSession = useCallback(async (authUser: User | null) => {
  if (!authUser) {
    mutateState((current) => ({
      ...current,
      auth: {
        currentUserId: null,
        provider: null,
        mode: isSupabaseConfigured ? 'supabase' : current.auth.mode,
      },
    }))
    setLoading(false)
    return
  }

  try {
    const fetchedUsers = await dbFetchAllUsers()

    mutateState((current) => {
      const existingIds = new Set(fetchedUsers.map((u) => u.id))
      const seedUsers = current.users.filter((u) => !existingIds.has(u.id))
      const mergedUsers = [...fetchedUsers, ...seedUsers]
      return {
        ...current,
        users: mergedUsers,
        auth: {
          currentUserId: authUser.id,
          provider: resolveAuthProvider(authUser),
          mode: isSupabaseConfigured ? 'supabase' : current.auth.mode,
        },
      }
    })

    mutateState((current) => {
      const existingProfile = findUserProfileByAuthUser(current.users, authUser)
      if (existingProfile) return current
      const newProfile = createProfileFromAuthUser(authUser, current.users)
      return {
        ...current,
        users: [...current.users, newProfile],
        notifications: [
          createNotification(
            newProfile.id, 'system', 'Welcome to SkillBridge',
            'Add skills you offer and want to learn to unlock matches.', '/settings',
          ),
          ...current.notifications,
        ],
      }
    })
  } catch (err) {
    console.error('Failed to sync Supabase session:', err)
    toast.error('Failed to load your profile. Please refresh.')
  } finally {
    setLoading(false)
  }
}, [mutateState])

  // ── Sync Supabase session ───────────────────────────────────────
  const isActiveRef = useRef(true)
  
  useEffect(() => {
    async function initializeSession() {
      if (!supabase) { setLoading(false); return }
      setLoading(true)
      try {
        const response = await supabase.auth.getSession()
        if (!isActiveRef.current) return
        const authUser = response.data.session?.user ?? null
        setUser(authUser)
        await syncSupabaseSession(authUser)
      } catch {
        setLoading(false)
      }
    }

    void initializeSession()

    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActiveRef.current) return
      const authUser = session?.user ?? null
      setUser(authUser)
      void syncSupabaseSession(authUser)
      if (authUser) setupNotificationsSubscription(authUser)
    })

    return () => {
      isActiveRef.current = false
      subscription.unsubscribe()
    }
  }, [syncSupabaseSession, setupNotificationsSubscription])

  // ── Supabase Realtime chat subscription ─────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const channel = supabase
      .channel('chats-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
        const m = payload.new as Record<string, unknown>
        const newMessage: ChatMessage = {
          id: m.id as string,
          threadId: m.swap_id as string,
          swapRequestId: m.swap_id as string,
          senderId: m.sender_id as string,
          receiverId: (m.receiver_id as string) ?? undefined,
          message: m.message as string,
          timestamp: m.created_at as string,
          type: (m.type as ChatMessage['type']) ?? 'text',
        }

        mutateState((current) => {
          const exists = current.messages.some((msg) => msg.id === newMessage.id)
          if (exists) return current
          return { ...current, messages: [...current.messages, newMessage] }
        })
      })
      .subscribe()

    return () => {
      void supabase?.removeChannel(channel)
    }
  // mutateState is stable — defined inside the component but never recreated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const users = state.users
  const currentUser = user ? findUserProfileByAuthUser(state.users, user) : null
  const currentUserId = currentUser?.id ?? null
  const isAuthenticated = Boolean(currentUser)

  const messageThreads = buildMessageThreads(state, currentUserId)
  const unreadNotificationCount = currentUser
    ? state.notifications.filter((n) => n.userId === currentUser.id && !n.read).length
    : 0

  const suggestedMatches = currentUser
    ? state.users
        .filter((u) => u.id !== currentUser.id)
        .map((u) => ({ ...u, match: computeMatchResult(currentUser, u) }))
        .filter((u) => u.match.score >= 55)
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, 6)
    : []

  const newTodayUsers = state.users
    .filter((u) => formatShortDate(u.joinedAt) === formatShortDate(new Date().toISOString()))
    .slice(0, 4)

  const topRatedUsers = [...state.users]
    .sort((a, b) => b.rating - a.rating || b.swapScore - a.swapScore)
    .slice(0, 4)

  useEffect(() => {
    if (!currentUserId) return
    const activeUser = stateRef.current.users.find((u) => u.id === currentUserId)
    if (!activeUser) return
    const today = new Date().toISOString().slice(0, 10)
    if (stateRef.current.lastSuggestionDate === today) return

    const suggestions = stateRef.current.users
      .filter((u) => u.id !== currentUserId)
      .map((u) => ({ user: u, match: computeMatchResult(activeUser, u) }))
      .filter(({ match }) => match.score >= 55)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 3)

    const base = { ...stateRef.current, lastSuggestionDate: today }
    const next = suggestions.length
      ? {
          ...base,
          notifications: [
            createNotification(
              currentUserId,
              'match',
              'Daily matches ready',
              `${suggestions.map(({ user }) => user.name.split(' ')[0]).join(', ')} align with what you teach and want to learn today.`,
              '/explore',
            ),
            ...stateRef.current.notifications,
          ],
        }
      : base

    applyState(next)
  }, [currentUserId])

  // ── Auth ────────────────────────────────────────────────────────────────────

  async function signUp(payload: SignupPayload): Promise<AuthActionResult> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase is not configured.' }
    }

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
  }

  async function login(payload: { email: string; password: string }): Promise<AuthActionResult> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase is not configured.' }
    }

    const response = await supabase.auth.signInWithPassword({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    })

    if (response.error) return { success: false, message: response.error.message }

    const firstName = deriveNameFromAuthUser(response.data.user).split(' ')[0] || 'there'
    toast.success(`Welcome back, ${firstName}.`)
    return { success: true, shouldNavigate: true }
  }

  async function loginWithGoogle(): Promise<AuthActionResult> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase is not configured.' }
    }

    const response = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })

    if (response.error) return { success: false, message: response.error.message }
    return { success: true, shouldNavigate: false }
  }

  async function logout() {
    if (!isSupabaseConfigured || !supabase) {
      mutateState((current) => syncStateWithAuthenticatedUser(current, null))
      return
    }

    const response = await supabase.auth.signOut()
    if (response.error) {
      toast.error(response.error.message)
      return
    }
    toast.success('Logged out.')
  }

  // ── Profile ─────────────────────────────────────────────────────────────────

  async function updateProfile(payload: ProfilePayload) {
    if (!currentUser) throw new Error('No current user')

    const updated: UserProfile = {
      ...currentUser,
      ...payload,
      lastActiveAt: new Date().toISOString(),
    }

    // Optimistic local update
    mutateState((current) => ({
      ...current,
      users: current.users.map((u) => (u.id === currentUser.id ? updated : u)),
    }))

    // Persist to Supabase
    if (isSupabaseConfigured) {
      try {
        await dbUpsertProfile(updated)
        await dbUpsertSkills(updated.id, updated.skillsOffered, updated.skillsWanted)
      } catch (error) {
        // Revert optimistic update on error
        mutateState((current) => ({
          ...current,
          users: current.users.map((u) => (u.id === updated.id ? currentUser : u)),
        }))
        throw error
      }
    }
  }

  // ── Swap Requests ───────────────────────────────────────────────────────────

  async function sendSwapRequest(payload: SwapRequestPayload): Promise<boolean> {
    if (!currentUser) {
      toast.error('Log in to send a swap request.')
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

    // Optimistic local update
    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id),
      swapRequests: [newSwap, ...current.swapRequests],
      notifications: [
        createNotification(
          receiver.id,
          'request',
          `${currentUser.name} sent you a swap request`,
          payload.message.trim(),
          '/dashboard',
        ),
        ...current.notifications,
      ],
    }))

    // Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('swap_requests').insert({
        id: newSwap.id,
        sender_id: newSwap.senderId,
        receiver_id: newSwap.receiverId,
        message: newSwap.message,
        status: newSwap.status,
        offered_skill_id: newSwap.offeredSkillId || null,
        wanted_skill_id: newSwap.wantedSkillId || null,
        completed_by: [],
      })

      if (error) {
        toast.error('Failed to send request. Try again.')
        return false
      }
    }

    toast.success('Swap request sent.')
    return true
  }

  function sendConnectionRequest(payload: ConnectionRequestPayload): boolean {
    if (!currentUser) {
      toast.error('Log in to connect with members.')
      return false
    }

    const duplicate = stateRef.current.connectionRequests.some(
      (r) =>
        ((r.senderId === currentUser.id && r.receiverId === payload.receiverId) ||
          (r.senderId === payload.receiverId && r.receiverId === currentUser.id)) &&
        ['Pending', 'Accepted'].includes(r.status),
    )

    if (duplicate) {
      toast.error('You already have an active connection with this member.')
      return false
    }

    const receiver = stateRef.current.users.find((u) => u.id === payload.receiverId)
    if (!receiver) {
      toast.error('Could not find that member.')
      return false
    }

    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id),
      connectionRequests: [
        {
          id: createId('connection'),
          senderId: currentUser.id,
          receiverId: payload.receiverId,
          message: payload.message.trim(),
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...current.connectionRequests,
      ],
      notifications: [
        createNotification(
          receiver.id,
          'connection',
          `${currentUser.name} wants to connect`,
          payload.message.trim(),
          '/dashboard',
        ),
        ...current.notifications,
      ],
    }))

    toast.success('Connection request sent.')
    return true
  }

  async function respondToSwapRequest(
    requestId: string,
    status: Extract<SwapRequest['status'], 'Accepted' | 'Declined'>,
  ) {
    if (!currentUser) return

    const swap = stateRef.current.swapRequests.find((item) => item.id === requestId)
    if (!swap) return

    const sender = stateRef.current.users.find((u) => u.id === swap.senderId)
    if (!sender) return

    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id, sender.id),
      swapRequests: current.swapRequests.map((item) =>
        item.id === requestId
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item,
      ),
      messages:
        status === 'Accepted'
          ? [
              ...current.messages,
              {
                id: createId('message'),
                threadId: requestId,
                swapRequestId: requestId,
                senderId: currentUser.id,
                receiverId: sender.id,
                message: 'Swap request accepted. Chat is now open for planning.',
                timestamp: new Date().toISOString(),
                type: 'system' as const,
              },
            ]
          : current.messages,
      notifications: [
        createNotification(
          sender.id,
          'request',
          `${currentUser.name} ${status === 'Accepted' ? 'accepted' : 'declined'} your request`,
          status === 'Accepted'
            ? 'Your swap can now move into chat and session planning.'
            : 'No worries. Explore other strong matches nearby.',
          status === 'Accepted' ? `/messages/${requestId}` : '/explore',
        ),
        ...current.notifications,
      ],
    }))

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('swap_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId)
    }

    toast.success(status === 'Accepted' ? 'Request accepted.' : 'Request declined.')
  }

  function respondToConnectionRequest(requestId: string, status: 'Accepted' | 'Declined') {
    if (!currentUser) return

    const request = stateRef.current.connectionRequests.find((item) => item.id === requestId)
    if (!request) return

    const sender = stateRef.current.users.find((u) => u.id === request.senderId)
    if (!sender) return

    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id, sender.id),
      connectionRequests: current.connectionRequests.map((item) =>
        item.id === requestId
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item,
      ),
      messages:
        status === 'Accepted'
          ? [
              ...current.messages,
              {
                id: createId('message'),
                threadId: requestId,
                swapRequestId: requestId,
                connectionRequestId: requestId,
                senderId: currentUser.id,
                receiverId: sender.id,
                message: 'Connection accepted. You can now start chatting directly.',
                timestamp: new Date().toISOString(),
                type: 'system' as const,
              },
            ]
          : current.messages,
      notifications: [
        createNotification(
          sender.id,
          'connection',
          `${currentUser.name} ${status === 'Accepted' ? 'accepted' : 'declined'} your connection`,
          status === 'Accepted'
            ? 'Direct messaging is now unlocked.'
            : 'Try exploring other members with similar goals.',
          status === 'Accepted' ? `/messages/${requestId}` : '/explore',
        ),
        ...current.notifications,
      ],
    }))

    toast.success(status === 'Accepted' ? 'Connection accepted.' : 'Connection declined.')
  }

  async function completeSwap(requestId: string) {
    if (!currentUser) return

    const swap = stateRef.current.swapRequests.find((item) => item.id === requestId)
    if (!swap || swap.status === 'Completed') return

    const partner = resolveSwapPartner(swap, currentUser.id, stateRef.current.users)

    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id, partner?.id),
      swapRequests: current.swapRequests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: 'Completed',
              completedBy: Array.from(new Set([...item.completedBy, currentUser.id])),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
      messages: [
        ...current.messages,
        {
          id: createId('message'),
          threadId: requestId,
          swapRequestId: requestId,
          senderId: currentUser.id,
          receiverId: partner?.id,
          message: 'Swap marked complete. Leave a rating and review to wrap it up.',
          timestamp: new Date().toISOString(),
          type: 'system' as const,
        },
      ],
      notifications: partner
        ? [
            createNotification(
              partner.id,
              'review',
              `${currentUser.name} marked your swap as complete`,
              'Leave a review to boost both of your swap scores.',
              '/dashboard',
            ),
            ...current.notifications,
          ]
        : current.notifications,
    }))

    if (isSupabaseConfigured && supabase) {
      const completedBy = Array.from(
        new Set([...(swap.completedBy ?? []), currentUser.id]),
      )
      await supabase
        .from('swap_requests')
        .update({
          status: 'Completed',
          completed_by: completedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
    }

    toast.success('Swap marked complete.')
  }

  // ── Chat ────────────────────────────────────────────────────────────────────

  async function sendChatMessage(
    threadId: string,
    message: string,
    type: ChatMessage['type'] = 'text',
  ) {
    if (!currentUser || !message.trim()) return

    const partnerId = resolveThreadPartnerId(stateRef.current, currentUser.id, threadId)
    if (!partnerId) return

    const partner = stateRef.current.users.find((u) => u.id === partnerId) ?? null
    const newMessage: ChatMessage = {
      id: createId('message'),
      threadId,
      swapRequestId: threadId,
      senderId: currentUser.id,
      receiverId: partner?.id,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      type,
    }

    // Optimistic local update
    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id, partner?.id),
      messages: [...current.messages, newMessage],
      notifications: partner
        ? [
            createNotification(
              partner.id,
              'chat',
              `${currentUser.name} sent a message`,
              message.trim(),
              `/messages/${threadId}`,
            ),
            ...current.notifications,
          ]
        : current.notifications,
    }))

    // Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      await supabase.from('chats').insert({
        id: newMessage.id,
        swap_id: threadId,
        sender_id: currentUser.id,
        receiver_id: partner?.id ?? null,
        message: message.trim(),
        type,
      })
    }
  }

  // ── Reviews ─────────────────────────────────────────────────────────────────

  async function addReview(requestId: string, rating: number, comment: string): Promise<boolean> {
    if (!currentUser) return false

    const swap = stateRef.current.swapRequests.find((item) => item.id === requestId)
    if (!swap || swap.status !== 'Completed') {
      toast.error('Complete the swap before leaving a review.')
      return false
    }

    const revieweeId = swap.senderId === currentUser.id ? swap.receiverId : swap.senderId
    const exists = stateRef.current.reviews.some(
      (r) =>
        r.swapRequestId === requestId &&
        r.reviewerId === currentUser.id &&
        r.revieweeId === revieweeId,
    )

    if (exists) {
      toast.error('You already reviewed this swap.')
      return false
    }

    const newReview: Review = {
      id: createId('review'),
      reviewerId: currentUser.id,
      revieweeId,
      swapRequestId: requestId,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    }

    mutateState((current) => ({
      ...current,
      reviews: [newReview, ...current.reviews],
      notifications: [
        createNotification(
          revieweeId,
          'review',
          `${currentUser.name} left you a review`,
          `"${comment.trim()}"`,
          `/profile/${currentUser.username}`,
        ),
        ...current.notifications,
      ],
    }))

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('reviews').insert({
        id: newReview.id,
        reviewer_id: newReview.reviewerId,
        reviewee_id: newReview.revieweeId,
        swap_id: newReview.swapRequestId,
        rating: newReview.rating,
        comment: newReview.comment,
      })

      if (error) {
        toast.error('Failed to submit review.')
        return false
      }
    }

    toast.success('Review submitted.')
    return true
  }

  // ── Posts & misc ────────────────────────────────────────────────────────────

  function createPost(payload: Pick<LookingForPost, 'skillName' | 'category' | 'note' | 'mode'>) {
    if (!currentUser) {
      toast.error('Log in to create a post.')
      return
    }

    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id),
      posts: [
        {
          id: createId('post'),
          userId: currentUser.id,
          skillName: payload.skillName.trim(),
          category: payload.category,
          note: payload.note.trim(),
          mode: payload.mode,
          city: currentUser.city,
          createdAt: new Date().toISOString(),
          responses: 0,
        },
        ...current.posts,
      ],
      notifications: [
        createNotification(
          currentUser.id,
          'post',
          'Post published',
          `Your "${payload.skillName}" request is now visible on the community board.`,
          '/post',
        ),
        ...current.notifications,
      ],
    }))

    toast.success('Community post published.')
  }

  function reportUser(userId: string) {
    if (!currentUser || currentUser.id === userId) return

    mutateState((current) => ({
      ...current,
      users: touchUsers(
        current.users.map((u) =>
          u.id === userId ? { ...u, reports: u.reports + 1 } : u,
        ),
        currentUser.id,
      ),
    }))

    toast.success('User reported. Thanks for helping keep the community safe.')
  }

  function markNotificationRead(notificationId: string) {
    mutateState((current) => ({
      ...current,
      notifications: current.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n,
      ),
    }))
    
    // Persist to Supabase
    if (isSupabaseConfigured) {
      void dbMarkNotificationRead(notificationId)
    }
  }

  function markAllNotificationsRead() {
    if (!currentUser) return
    
    mutateState((current) => ({
      ...current,
      notifications: current.notifications.map((n) => ({ ...n, read: true })),
    }))
    
    // Persist to Supabase
    if (isSupabaseConfigured) {
      void dbMarkAllNotificationsRead(currentUser.id)
    }
  }

  function toggleTheme() {
    mutateState((current) => ({
      ...current,
      theme: current.theme === 'dark' ? 'light' : 'dark',
    }))
  }

  function resetDemoData() {
    const theme = stateRef.current.theme
    const next = getSeedState(theme)
    applyState(syncStateWithAuthenticatedUser(next, user))
    toast.success('Demo data reset.')
  }

  function getUserById(userId: string) {
    return stateRef.current.users.find((u) => u.id === userId) ?? null
  }

  function getUserByUsername(username: string) {
    return stateRef.current.users.find((u) => u.username === username) ?? null
  }

  function getSwapById(swapId: string) {
    return stateRef.current.swapRequests.find((s) => s.id === swapId) ?? null
  }

  function getThreadById(threadId: string) {
    return buildMessageThreads(stateRef.current, currentUserId).find((t) => t.id === threadId) ?? null
  }

  function getMessagesForSwap(swapId: string) {
    const messages = stateRef.current.messages.filter((m) => m.swapRequestId === swapId)
    // Load from Supabase if we don't have messages for this swap yet
    if (messages.length === 0 && swapId) {
      void loadChatMessages(swapId)
    }
    return messages
  }

  function getMessagesForThread(threadId: string) {
    return stateRef.current.messages.filter((m) => m.threadId === threadId)
  }

  function getReviewsForUser(userId: string) {
    return stateRef.current.reviews
      .filter((r) => r.revieweeId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return (
    <AppContext.Provider
      value={{
        state,
        user,
        users,
        currentUser,
        isAuthenticated,
        loading,
        messageThreads,
        unreadNotificationCount,
        suggestedMatches,
        newTodayUsers,
        topRatedUsers,
        signUp,
        login,
        loginWithGoogle,
        logout,
        updateProfile,
        sendSwapRequest,
        sendConnectionRequest,
        respondToSwapRequest,
        respondToConnectionRequest,
        completeSwap,
        sendChatMessage,
        addReview,
        createPost,
        reportUser,
        markNotificationRead,
        markAllNotificationsRead,
        toggleTheme,
        resetDemoData,
        getUserById,
        getUserByUsername,
        getSwapById,
        getThreadById,
        getMessagesForThread,
        getMessagesForSwap,
        getReviewsForUser,
        dbFetchAllUsers,
        dbFetchSwapRequests,
        dbFetchNotifications,
        dbFetchPosts,
        dbCreatePost,
        dbFetchReviews,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

export function useShareProfile(username: string) {
  async function shareProfile() {
    const url = buildShareUrl(username)
    if (navigator.share) {
      await navigator.share({ title: 'SkillBridge profile', text: 'Check out this SkillBridge member', url })
      return
    }
    await navigator.clipboard.writeText(url)
    toast.success('Profile link copied.')
  }
  return { shareProfile }
}
