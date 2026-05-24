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
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type {
  AppState,
  ChatMessage,
  ChatMessageKind,
  ConnectionRequest,
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
  buildConnectionThreadKey,
  buildSwapThreadKey,
  buildMessageThreads,
  computeMatchResult,
  createId,
  formatShortDate,
  hydrateState,
  parseThreadKey,
  resolveSwapPartner,
  slugify,
} from '@/utils/app'

const STORAGE_KEY = 'swapnet-state-v1'
const CHANNEL_KEY = 'swapnet-live-sync'
const DEFAULT_AUTH_MODE: AppState['auth']['mode'] = 'supabase'

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
  sendConnectionRequest: (payload: ConnectionRequestPayload) => Promise<boolean>
  respondToSwapRequest: (
    requestId: string,
    status: Extract<SwapRequest['status'], 'Accepted' | 'Declined'>,
  ) => Promise<void>
  respondToConnectionRequest: (
    requestId: string,
    status: 'Accepted' | 'Declined',
  ) => Promise<void>
  completeSwap: (requestId: string) => Promise<void>
  sendChatMessage: (
    threadId: string,
    message: string,
    messageType?: ChatMessageKind,
  ) => Promise<void>
  addReview: (requestId: string, rating: number, comment: string) => Promise<boolean>
  createPost: (
    payload: Pick<LookingForPost, 'skillName' | 'category' | 'note' | 'mode'>,
  ) => Promise<boolean>
  reportUser: (userId: string) => Promise<boolean>
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  toggleTheme: () => void
  getUserById: (userId: string) => UserProfile | null
  getUserByUsername: (username: string) => UserProfile | null
  getSwapById: (swapId: string) => SwapRequest | null
  getThreadById: (threadId: string) => MessageThread | null
  getMessagesForThread: (threadId: string) => ChatMessage[]
  subscribeToThreadMessages: (threadId: string) => () => void
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

function createEmptyState(theme: AppState['theme']): AppState {
  return hydrateState({
    users: [],
    swapRequests: [],
    connectionRequests: [],
    messages: [],
    reviews: [],
    notifications: [],
    posts: [],
    messageThreads: [],
    unreadNotificationCount: 0,
    auth: {
      currentUserId: null,
      provider: null,
      mode: DEFAULT_AUTH_MODE,
    },
    theme,
    lastSuggestionDate: null,
  })
}

function loadInitialState() {
  if (typeof window === 'undefined') {
    return createEmptyState('light')
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const fallbackTheme = prefersDark ? 'dark' : 'light'
  const rawState = window.localStorage.getItem(STORAGE_KEY)

  if (!rawState) {
    return createEmptyState(fallbackTheme)
  }

//   try {
//     const parsed = JSON.parse(rawState) as Partial<AppState>
//     const storedTheme = parsed.theme === 'dark' || parsed.theme === 'light'
//       ? parsed.theme
//       : fallbackTheme
//     return createEmptyState(storedTheme)
//   } catch {
//     return createEmptyState(fallbackTheme)
// }

try {
    const parsed = JSON.parse(rawState) as Partial<AppState>
    const storedTheme = parsed.theme === 'dark' || parsed.theme === 'light'
      ? parsed.theme
      : fallbackTheme
    return hydrateState({
      users: parsed.users ?? [],
      swapRequests: parsed.swapRequests ?? [],
      connectionRequests: parsed.connectionRequests ?? [],
      messages: parsed.messages ?? [],
      reviews: parsed.reviews ?? [],
      notifications: parsed.notifications ?? [],
      posts: parsed.posts ?? [],
      messageThreads: parsed.messageThreads ?? [],
      unreadNotificationCount: parsed.unreadNotificationCount ?? 0,
      auth: parsed.auth ?? {
        currentUserId: null,
        provider: null,
        mode: DEFAULT_AUTH_MODE,
      },
      theme: storedTheme,
      lastSuggestionDate: parsed.lastSuggestionDate ?? null,
    })
  } catch {
    return createEmptyState(fallbackTheme)
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
  return emailPrefix ? toTitleCase(emailPrefix) : 'SwapNet Member'
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

function resolveThreadContext(state: AppState, currentUserId: string, threadId: string) {
  const parsedThread = parseThreadKey(threadId)

  if (parsedThread?.kind === 'swap') {
    const swap = state.swapRequests.find((item) => item.id === parsedThread.sourceId)
    if (swap) {
      return {
        threadKey: buildSwapThreadKey(swap.id),
        partnerId: swap.senderId === currentUserId ? swap.receiverId : swap.senderId,
        swapId: swap.id,
        connectionRequestId: undefined,
      }
    }
  }

  if (parsedThread?.kind === 'connection') {
    const connection = state.connectionRequests.find((item) => item.id === parsedThread.sourceId)
    if (connection) {
      return {
        threadKey: buildConnectionThreadKey(connection.id),
        partnerId:
          connection.senderId === currentUserId ? connection.receiverId : connection.senderId,
        swapId: undefined,
        connectionRequestId: connection.id,
      }
    }
  }

  const swap = state.swapRequests.find((item) => item.id === threadId)
  if (swap) {
    return {
      threadKey: buildSwapThreadKey(swap.id),
      partnerId: swap.senderId === currentUserId ? swap.receiverId : swap.senderId,
      swapId: swap.id,
      connectionRequestId: undefined,
    }
  }

  const connection = state.connectionRequests.find((item) => item.id === threadId)
  if (connection) {
    return {
      threadKey: buildConnectionThreadKey(connection.id),
      partnerId: connection.senderId === currentUserId ? connection.receiverId : connection.senderId,
      swapId: undefined,
      connectionRequestId: connection.id,
    }
  }

  return null
}

function mapChatRecord(record: Record<string, unknown>): ChatMessage {
  const swapRequestId = record.swap_id as string | undefined
  const connectionRequestId = record.connection_request_id as string | undefined
  const threadId =
    (record.thread_key as string | undefined) ??
    (connectionRequestId ? buildConnectionThreadKey(connectionRequestId) : undefined) ??
    (swapRequestId ? buildSwapThreadKey(swapRequestId) : undefined) ??
    ''

  return {
    id: record.id as string,
    threadId,
    swapRequestId,
    connectionRequestId,
    senderId: record.sender_id as string,
    receiverId: (record.receiver_id as string | undefined) ?? undefined,
    message: record.message as string,
    timestamp: record.created_at as string,
    message_type:
      (record.message_type as ChatMessageKind | null | undefined) ??
      (record.type as ChatMessageKind | null | undefined) ??
      'text',
  }
}

// ─── Supabase DB helpers ──────────────────────────────────────────────────────

async function dbUpsertProfile(profile: UserProfile) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase
    .from('users')
    .upsert(
      {
        id: profile.id,
        auth_user_id: profile.id,
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
        created_at: profile.joinedAt,
        last_active_at: profile.lastActiveAt,
        swap_score: profile.swapScore,
        rating: profile.rating,
        review_count: profile.reviewCount,
        completed_swaps: profile.completedSwaps,
        taught_count: profile.taughtCount,
        learned_count: profile.learnedCount,
        badges: profile.badges,
        reports: profile.reports,
      },
      { onConflict: 'id' },
    )

  if (error) {
    throw error
  }
}

async function dbUpsertSkills(
  userId: string,
  offered: UserProfile['skillsOffered'],
  wanted: UserProfile['skillsWanted'],
) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error: deleteOfferedError } = await supabase
    .from('skills_offered')
    .delete()
    .eq('user_id', userId)
  if (deleteOfferedError) throw deleteOfferedError

  const { error: deleteWantedError } = await supabase
    .from('skills_wanted')
    .delete()
    .eq('user_id', userId)
  if (deleteWantedError) throw deleteWantedError

  if (offered.length > 0) {
    const { error } = await supabase.from('skills_offered').insert(
      offered.map((skill) => ({
        id: skill.id,
        user_id: userId,
        skill_name: skill.name,
        category: skill.category,
        level: skill.level ?? 'Beginner',
      })),
    )

    if (error) throw error
  }

  if (wanted.length > 0) {
    const { error } = await supabase.from('skills_wanted').insert(
      wanted.map((skill) => ({
        id: skill.id,
        user_id: userId,
        skill_name: skill.name,
        category: skill.category,
      })),
    )

    if (error) throw error
  }
}

async function dbFetchAllUsers(): Promise<UserProfile[]> {
  if (!supabase) return []

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !users) {
    console.error('Failed to fetch users:', error)
    return []
  }

  const [
    { data: offered, error: offeredError },
    { data: wanted, error: wantedError },
  ] = await Promise.all([
    supabase.from('skills_offered').select('*'),
    supabase.from('skills_wanted').select('*'),
  ])

  if (offeredError) {
    console.error('Failed to fetch offered skills:', offeredError)
  }

  if (wantedError) {
    console.error('Failed to fetch wanted skills:', wantedError)
  }

  const offeredSkills = offeredError ? [] : offered ?? []
  const wantedSkills = wantedError ? [] : wanted ?? []

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
    joinedAt: u.created_at,
    lastActiveAt: u.last_active_at,
    swapScore: u.swap_score ?? 0,
    rating: u.rating ?? 0,
    reviewCount: u.review_count ?? 0,
    completedSwaps: u.completed_swaps ?? 0,
    taughtCount: u.taught_count ?? 0,
    learnedCount: u.learned_count ?? 0,
    badges: u.badges ?? [],
    reports: u.reports ?? 0,
    skillsOffered: offeredSkills
      .filter((s) => s.user_id === u.id)
      .map((s) => ({ id: s.id, name: s.skill_name, category: s.category, level: s.level })),
    skillsWanted: wantedSkills
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

async function dbFetchConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((request) => ({
    id: request.id,
    senderId: request.sender_id,
    receiverId: request.receiver_id,
    message: request.message,
    status: request.status,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  }))
}

async function dbFetchMessagesForUser(userId: string): Promise<ChatMessage[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((message) => mapChatRecord(message as Record<string, unknown>))
}

async function dbFetchChatMessages(threadId: string): Promise<ChatMessage[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_key', threadId)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((message) => mapChatRecord(message as Record<string, unknown>))
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

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Failed to mark notification read:', error)
  }
}

async function dbMarkAllNotificationsRead(userId: string): Promise<void> {
  if (!supabase) return

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Failed to mark all notifications read:', error)
  }
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

async function dbFetchAllReviews(): Promise<Review[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((review) => ({
    id: review.id,
    reviewerId: review.reviewer_id,
    revieweeId: review.reviewee_id,
    swapRequestId: review.swap_id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at,
  }))
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

async function dbInsertChatMessage(input: {
  threadKey: string
  swapId?: string
  connectionRequestId?: string
  senderId: string
  receiverId: string
  message: string
  messageType: ChatMessageKind
}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }
    
  if (!input.swapId && !input.connectionRequestId) {
    throw new Error(
      'dbInsertChatMessage: message must belong to either a swap or a connection request. ' +
      `threadKey="${input.threadKey}"`,
    )
  }

  if (input.swapId && input.connectionRequestId) {
    throw new Error(
      'dbInsertChatMessage: message cannot belong to both a swap and a connection request.',
    )
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      thread_key: input.threadKey,
      swap_id: input.swapId ?? null,
      connection_request_id: input.connectionRequestId ?? null,
      sender_id: input.senderId,
      receiver_id: input.receiverId,
      message: input.message,
      message_type: input.messageType,
    })
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create chat message.')
  }

  return mapChatRecord(data as Record<string, unknown>)
}

// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(loadInitialState)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const stateRef = useRef(state)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const notificationSubscriptionCleanupRef = useRef<(() => void) | null>(null)

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

  const loadPublicData = useCallback(async () => {
    const [users, posts, reviews] = await Promise.all([
      dbFetchAllUsers(),
      dbFetchPosts(),
      dbFetchAllReviews(),
    ])

    return { users, posts, reviews }
  }, [])

  const ensureProfileRecord = useCallback(async (authUser: User) => {
    const existingUsers = await dbFetchAllUsers()
    const existingProfile = findUserProfileByAuthUser(existingUsers, authUser)
    if (existingProfile) return

    const profile = createProfileFromAuthUser(authUser, existingUsers)
    await dbUpsertProfile(profile)
  }, [])

  // ── Load chat messages from Supabase ─────────────────────────────────────
  const loadChatMessages = useCallback(async (threadId: string) => {
    if (!isSupabaseConfigured || !supabase) return

    try {
      const chatMessages = await dbFetchChatMessages(threadId)

      mutateState((current) => {
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

  const subscribeToThreadMessages = useCallback((threadId: string) => {
    if (!isSupabaseConfigured || !supabase || !threadId) {
      return () => {}
    }

    const supabaseClient = supabase
    const resolvedThreadKey =
      resolveThreadContext(
        stateRef.current,
        stateRef.current.auth.currentUserId ?? '',
        threadId,
      )?.threadKey ?? threadId

    void loadChatMessages(resolvedThreadKey)

    const channel = supabaseClient
      .channel(`messages-thread-${resolvedThreadKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_key=eq.${resolvedThreadKey}`,
        },
        (payload) => {
          const newMessage = mapChatRecord(payload.new as Record<string, unknown>)

          mutateState((current) => {
            const exists = current.messages.some((message) => message.id === newMessage.id)
            if (exists) return current

            return {
              ...current,
              messages: [...current.messages, newMessage].sort(
                (left, right) =>
                  new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
              ),
            }
          })
        },
      )
      .subscribe()

    return () => {
      void supabaseClient.removeChannel(channel)
    }
  }, [loadChatMessages, mutateState])

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
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      if (authUser) {
        await ensureProfileRecord(authUser)
      }

      const publicDataPromise = loadPublicData()
      const privateDataPromise = authUser
        ? Promise.all([
            dbFetchSwapRequests(authUser.id),
            dbFetchConnectionRequests(authUser.id),
            dbFetchNotifications(authUser.id),
            dbFetchMessagesForUser(authUser.id),
          ])
        : Promise.resolve<[SwapRequest[], ConnectionRequest[], NotificationItem[], ChatMessage[]]>([
            [],
            [],
            [],
            [],
          ])

      const [publicData, privateData] = await Promise.all([publicDataPromise, privateDataPromise])
      const [swapRequests, connectionRequests, notifications, messages] = privateData

      applyState({
        ...stateRef.current,
        users: publicData.users,
        posts: publicData.posts,
        reviews: publicData.reviews,
        swapRequests,
        connectionRequests,
        notifications,
        messages,
        auth: {
          currentUserId: authUser?.id ?? null,
          provider: authUser ? resolveAuthProvider(authUser) : null,
          mode: DEFAULT_AUTH_MODE,
        },
      })
    } catch (error) {
      console.error('Failed to sync Supabase session:', error)
      toast.error('Failed to load SwapNet data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [ensureProfileRecord, loadPublicData])

  // ── Sync Supabase session ───────────────────────────────────────
  const isActiveRef = useRef(true)
  
  useEffect(() => {
    async function initializeSession() {
      if (!supabase) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await supabase.auth.getSession()
        if (!isActiveRef.current) return
        const authUser = response.data.session?.user ?? null
        notificationSubscriptionCleanupRef.current?.()
        notificationSubscriptionCleanupRef.current = authUser
          ? setupNotificationsSubscription(authUser) ?? null
          : null
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
      notificationSubscriptionCleanupRef.current?.()
      notificationSubscriptionCleanupRef.current = authUser
        ? setupNotificationsSubscription(authUser) ?? null
        : null
      setUser(authUser)
      void syncSupabaseSession(authUser)
    })

    return () => {
      isActiveRef.current = false
      notificationSubscriptionCleanupRef.current?.()
      notificationSubscriptionCleanupRef.current = null
      subscription.unsubscribe()
    }
  }, [syncSupabaseSession, setupNotificationsSubscription])

  const users = state.users
  const currentUser = user
    ? findUserProfileByAuthUser(state.users, user)
    : state.users.find((profile) => profile.id === state.auth.currentUserId) ?? null
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
  }

  async function login(payload: { email: string; password: string }): Promise<AuthActionResult> {
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
  }

  async function loginWithGoogle(): Promise<AuthActionResult> {
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
  }

  async function logout() {
    if (!isSupabaseConfigured || !supabase) return

    try {
      const response = await supabase.auth.signOut()
      if (response.error) {
        toast.error(response.error.message)
        return
      }
      toast.success('Logged out.')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to log out.')
    }
  }

  // ── Profile ─────────────────────────────────────────────────────────────────

  async function updateProfile(payload: ProfilePayload) {
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
      await dbUpsertProfile(updated)
      await dbUpsertSkills(updated.id, updated.skillsOffered, updated.skillsWanted)

      mutateState((current) => ({
        ...current,
        users: current.users.map((entry) => (entry.id === currentUser.id ? updated : entry)),
      }))
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  // ── Swap Requests ───────────────────────────────────────────────────────────

  async function sendSwapRequest(payload: SwapRequestPayload): Promise<boolean> {
    if (!currentUser) {
      toast.error('Log in to send a swap request.')
      return false
    }

    if (!isSupabaseConfigured || !supabase) {
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

      mutateState((current) => ({
        ...current,
        swapRequests: [createdSwap, ...current.swapRequests],
      }))

      toast.success(`Swap request sent to ${receiver.name}.`)
      return true
    } catch (error) {
      console.error('Failed to send swap request:', error)
      toast.error('Failed to send request. Try again.')
      return false
    }
  }

  async function sendConnectionRequest(payload: ConnectionRequestPayload): Promise<boolean> {
    if (!currentUser) {
      toast.error('Log in to connect with members.')
      return false
    }

    if (!isSupabaseConfigured || !supabase) {
      toast.error('Supabase is not configured.')
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

    try {
      const createdAt = new Date().toISOString()
      const { data, error } = await supabase
        .from('connection_requests')
        .insert({
          id: createId('connection'),
          sender_id: currentUser.id,
          receiver_id: payload.receiverId,
          message: payload.message.trim(),
          status: 'Pending' as const,
          created_at: createdAt,
          updated_at: createdAt,
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to send connection request.')
        return false
      }

      const newConnection: ConnectionRequest = {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        message: data.message,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      mutateState((current) => ({
        ...current,
        connectionRequests: [newConnection, ...current.connectionRequests],
      }))

      toast.success(`Connection request sent to ${receiver.name}.`)
      return true
    } catch (error) {
      console.error('Failed to send connection request:', error)
      toast.error('Failed to send connection request.')
      return false
    }
  }

  async function respondToSwapRequest(
    requestId: string,
    status: Extract<SwapRequest['status'], 'Accepted' | 'Declined'>,
  ) {
    if (!currentUser || !supabase) return

    const swap = stateRef.current.swapRequests.find((item) => item.id === requestId)
    if (!swap) return

    const sender = stateRef.current.users.find((u) => u.id === swap.senderId)
    if (!sender) return

    try {
      const updatedAt = new Date().toISOString()
      const { data, error } = await supabase
        .from('swap_requests')
        .update({ status, updated_at: updatedAt })
        .eq('id', requestId)
        .select()
        .single()

      if (error || !data) {
        toast.error(`Failed to ${status.toLowerCase()} request.`)
        return
      }

      const updatedSwap: SwapRequest = {
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

      const systemMessage =
        status === 'Accepted'
          ? await dbInsertChatMessage({
              threadKey: buildSwapThreadKey(requestId),
              swapId: requestId,
              senderId: currentUser.id,
              receiverId: sender.id,
              message: 'Swap request accepted. Chat is now open for planning.',
              messageType: 'system',
            })
          : null

      mutateState((current) => ({
        ...current,
        swapRequests: current.swapRequests.map((item) =>
          item.id === requestId ? updatedSwap : item,
        ),
        messages: systemMessage ? [...current.messages, systemMessage] : current.messages,
      }))

      toast.success(status === 'Accepted' ? 'Request accepted.' : 'Request declined.')
    } catch (error) {
      console.error('Failed to respond to swap request:', error)
      toast.error(`Failed to ${status.toLowerCase()} request.`)
    }
  }

  async function respondToConnectionRequest(requestId: string, status: 'Accepted' | 'Declined') {
    if (!currentUser || !supabase) return

    const request = stateRef.current.connectionRequests.find((item) => item.id === requestId)
    if (!request) return

    const sender = stateRef.current.users.find((u) => u.id === request.senderId)
    if (!sender) return

    try {
      const updatedAt = new Date().toISOString()
      const { data, error } = await supabase
        .from('connection_requests')
        .update({ status, updated_at: updatedAt })
        .eq('id', requestId)
        .select()
        .single()

      if (error || !data) {
        toast.error(`Failed to ${status.toLowerCase()} connection.`)
        return
      }

      const updatedConnection: ConnectionRequest = {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        message: data.message,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      const systemMessage =
        status === 'Accepted'
          ? await dbInsertChatMessage({
              threadKey: buildConnectionThreadKey(requestId),
              connectionRequestId: requestId,
              senderId: currentUser.id,
              receiverId: sender.id,
              message: 'Connection accepted. You can now start chatting directly.',
              messageType: 'system',
            })
          : null

      mutateState((current) => ({
        ...current,
        connectionRequests: current.connectionRequests.map((item) =>
          item.id === requestId ? updatedConnection : item,
        ),
        messages: systemMessage ? [...current.messages, systemMessage] : current.messages,
      }))

      toast.success(status === 'Accepted' ? 'Connection accepted.' : 'Connection declined.')
    } catch (error) {
      console.error('Failed to respond to connection request:', error)
      toast.error(`Failed to ${status.toLowerCase()} connection.`)
    }
  }

  async function completeSwap(requestId: string) {
    if (!currentUser || !supabase) return

    const swap = stateRef.current.swapRequests.find((item) => item.id === requestId)
    if (!swap || swap.status === 'Completed') return

    const partner = resolveSwapPartner(swap, currentUser.id, stateRef.current.users)

    try {
      const completedBy = Array.from(
        new Set([...(swap.completedBy ?? []), currentUser.id]),
      )
      const updatedAt = new Date().toISOString()
      const { data, error } = await supabase
        .from('swap_requests')
        .update({
          status: 'Completed',
          completed_by: completedBy,
          updated_at: updatedAt,
        })
        .eq('id', requestId)
        .select()
        .single()

      if (error || !data) {
        toast.error('Failed to mark swap complete.')
        return
      }

      const updatedSwap: SwapRequest = {
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

      const systemMessage =
        partner
          ? await dbInsertChatMessage({
              threadKey: buildSwapThreadKey(requestId),
              swapId: requestId,
              senderId: currentUser.id,
              receiverId: partner.id,
              message: 'Swap marked complete. Leave a rating and review to wrap it up.',
              messageType: 'system',
            })
          : null

      mutateState((current) => ({
        ...current,
        swapRequests: current.swapRequests.map((item) =>
          item.id === requestId ? updatedSwap : item,
        ),
        messages: systemMessage ? [...current.messages, systemMessage] : current.messages,
      }))

      toast.success('Swap marked complete.')
    } catch (error) {
      console.error('Failed to complete swap:', error)
      toast.error('Failed to mark swap complete.')
    }
  }

  // ── Chat ────────────────────────────────────────────────────────────────────

  async function sendChatMessage(
    threadId: string,
    message: string,
    messageType: ChatMessageKind = 'text',
  ) {
    if (!currentUser || !message.trim() || !supabase) return

    const threadContext = resolveThreadContext(stateRef.current, currentUser.id, threadId)
    if (!threadContext) return

    const partner = stateRef.current.users.find((u) => u.id === threadContext.partnerId) ?? null
    if (!partner) return

    try {
      const savedMessage = await dbInsertChatMessage({
        threadKey: threadContext.threadKey,
        swapId: threadContext.swapId,
        connectionRequestId: threadContext.connectionRequestId,
        senderId: currentUser.id,
        receiverId: partner.id,
        message: message.trim(),
        messageType,
      })

      mutateState((current) => ({
        ...current,
        messages: [...current.messages, savedMessage],
      }))
    } catch (error) {
      console.error('Failed to send chat message:', error)
      toast.error('Failed to send message.')
    }
  }

  // ── Reviews ─────────────────────────────────────────────────────────────────

  async function addReview(requestId: string, rating: number, comment: string): Promise<boolean> {
    if (!currentUser || !supabase) return false

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

    try {
      const newReviewId = createId('review')
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          id: newReviewId,
          reviewer_id: currentUser.id,
          reviewee_id: revieweeId,
          swap_id: requestId,
          rating,
          comment: comment.trim(),
        })
        .select()
        .single()

      if (error || !data) {
        toast.error('Failed to submit review.')
        return false
      }

      const newReview: Review = {
        id: data.id,
        reviewerId: data.reviewer_id,
        revieweeId: data.reviewee_id,
        swapRequestId: data.swap_id,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.created_at,
      }

      mutateState((current) => ({
        ...current,
        reviews: [newReview, ...current.reviews],
      }))
    } catch (error) {
      console.error('Failed to submit review:', error)
      toast.error('Failed to submit review.')
      return false
    }

    toast.success('Review submitted.')
    return true
  }

  // ── Posts & misc ────────────────────────────────────────────────────────────

  async function createPost(
    payload: Pick<LookingForPost, 'skillName' | 'category' | 'note' | 'mode'>,
  ) {
    if (!currentUser) {
      toast.error('Log in to create a post.')
      return false
    }

    if (!isSupabaseConfigured || !supabase) {
      toast.error('Supabase is not configured.')
      return false
    }

    try {
      const post = await dbCreatePost({
        userId: currentUser.id,
        skillName: payload.skillName.trim(),
        category: payload.category,
        note: payload.note.trim(),
        city: currentUser.city,
        mode: payload.mode,
      })

      mutateState((current) => ({
        ...current,
        posts: [post, ...current.posts],
      }))

      toast.success('Community post published.')
      return true
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to publish post.')
      return false
    }
  }

  async function reportUser(userId: string) {
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
    const resolvedThreadKey =
      resolveThreadContext(stateRef.current, currentUserId ?? '', threadId)?.threadKey ?? threadId
    return (
      buildMessageThreads(stateRef.current, currentUserId).find((thread) => thread.id === resolvedThreadKey) ??
      null
    )
  }

  function getMessagesForSwap(swapId: string) {
    const threadKey = buildSwapThreadKey(swapId)
    const messages = stateRef.current.messages.filter(
      (message) => message.threadId === threadKey || message.swapRequestId === swapId,
    )
    if (messages.length === 0 && threadKey) {
      void loadChatMessages(threadKey)
    }
    return messages
  }

  function getMessagesForThread(threadId: string) {
    const resolvedThreadKey =
      resolveThreadContext(stateRef.current, currentUserId ?? '', threadId)?.threadKey ?? threadId
    const messages = stateRef.current.messages.filter((message) => message.threadId === resolvedThreadKey)
    if (messages.length === 0 && resolvedThreadKey) {
      void loadChatMessages(resolvedThreadKey)
    }
    return messages
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
        getUserById,
        getUserByUsername,
        getSwapById,
        getThreadById,
        getMessagesForThread,
        subscribeToThreadMessages,
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
      await navigator.share({ title: 'SwapNet profile', text: 'Check out this SwapNet member', url })
      return
    }
    await navigator.clipboard.writeText(url)
    toast.success('Profile link copied.')
  }
  return { shareProfile }
}
