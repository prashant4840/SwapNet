/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
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
  unreadNotificationCount: number
  messageThreads: MessageThread[]
  suggestedMatches: Array<UserProfile & { match: MatchResult }>
  newTodayUsers: UserProfile[]
  topRatedUsers: UserProfile[]
  signUp: (payload: SignupPayload) => Promise<AuthActionResult>
  login: (payload: { email: string; password: string }) => Promise<AuthActionResult>
  loginWithGoogle: () => Promise<AuthActionResult>
  logout: () => Promise<void>
  updateProfile: (payload: ProfilePayload) => void
  sendSwapRequest: (payload: SwapRequestPayload) => boolean
  sendConnectionRequest: (payload: ConnectionRequestPayload) => boolean
  respondToSwapRequest: (
    requestId: string,
    status: Extract<SwapRequest['status'], 'Accepted' | 'Declined'>,
  ) => void
  respondToConnectionRequest: (
    requestId: string,
    status: 'Accepted' | 'Declined',
  ) => void
  completeSwap: (requestId: string) => void
  sendChatMessage: (
    threadId: string,
    message: string,
    type?: ChatMessage['type'],
  ) => void
  addReview: (requestId: string, rating: number, comment: string) => boolean
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

  if (provider === 'google') {
    return 'google'
  }

  if (provider === 'email') {
    return 'email'
  }

  return user ? 'email' : null
}

function getAuthMetadataValue(user: User, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function deriveNameFromAuthUser(user: User) {
  const explicitName =
    getAuthMetadataValue(user, 'full_name') || getAuthMetadataValue(user, 'name')

  if (explicitName) {
    return explicitName
  }

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
    availability: ['Weekends'],
    mode: 'Online',
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
      current.auth.currentUserId === null &&
      current.auth.provider === null &&
      current.auth.mode === mode
    ) {
      return current
    }

    return {
      ...current,
      auth: {
        currentUserId: null,
        provider: null,
        mode,
      },
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

    if (!profileChanged && !authChanged) {
      return current
    }

    return {
      ...current,
      users: profileChanged
        ? current.users.map((profile) =>
            profile.id === existingProfile.id
              ? {
                  ...profile,
                  name: nextName,
                  email: nextEmail,
                  photo: nextPhoto,
                }
              : profile,
          )
        : current.users,
      auth: {
        currentUserId: existingProfile.id,
        provider,
        mode,
      },
    }
  }

  const newProfile = createProfileFromAuthUser(authUser, current.users)

  return {
    ...current,
    users: [newProfile, ...current.users],
    auth: {
      currentUserId: newProfile.id,
      provider,
      mode,
    },
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

  if (!targetIds.size) {
    return users
  }

  return users.map((user) =>
    targetIds.has(user.id)
      ? {
          ...user,
          lastActiveAt: updatedAt,
        }
      : user,
  )
}

function resolveThreadPartnerId(state: AppState, currentUserId: string, threadId: string) {
  const swap = state.swapRequests.find((item) => item.id === threadId)
  if (swap) {
    return swap.senderId === currentUserId ? swap.receiverId : swap.senderId
  }

  const connection = state.connectionRequests.find((item) => item.id === threadId)
  if (connection) {
    return connection.senderId === currentUserId ? connection.receiverId : connection.senderId
  }

  return null
}

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
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
    document.documentElement.classList.toggle('light', state.theme === 'light')
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return
    }

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

    if (broadcast) {
      channelRef.current?.postMessage(hydrated)
    }
  }

  function mutateState(
    updater: (current: AppState) => AppState,
    options?: { broadcast?: boolean },
  ) {
    applyState(updater(stateRef.current), options?.broadcast ?? true)
  }

  const syncSupabaseSession = useEffectEvent((nextUser: User | null) => {
    setUser(nextUser)
    mutateState((current) => syncStateWithAuthenticatedUser(current, nextUser))
    setLoading(false)
  })

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    const authClient = supabase
    let isActive = true

    async function initializeSession() {
      const response = await authClient.auth.getSession()
      console.log('Supabase getSession response', response)

      if (!isActive) {
        return
      }

      syncSupabaseSession(response.data.session?.user ?? null)
    }

    void initializeSession()

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((event, session) => {
      console.log('Supabase auth state change', { event, session })

      if (!isActive) {
        return
      }

      syncSupabaseSession(session?.user ?? null)
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  const users = state.users
  const currentUser = user ? findUserProfileByAuthUser(state.users, user) : null
  const currentUserId = currentUser?.id ?? null
  const isAuthenticated = Boolean(user)
  const unreadNotificationCount = currentUser
    ? state.notifications.filter(
        (notification) => notification.userId === currentUser.id && !notification.read,
      ).length
    : 0
  const messageThreads = buildMessageThreads(state, currentUserId)

  const suggestedMatches = currentUser
    ? state.users
        .filter((user) => user.id !== currentUser.id)
        .map((user) => ({
          ...user,
          match: computeMatchResult(currentUser, user),
        }))
        .filter((user) => user.match.score >= 55)
        .sort((left, right) => right.match.score - left.match.score)
        .slice(0, 6)
    : []

  const newTodayUsers = state.users
    .filter((user) => formatShortDate(user.joinedAt) === formatShortDate(new Date().toISOString()))
    .slice(0, 4)

  const topRatedUsers = [...state.users]
    .sort((left, right) => right.rating - left.rating || right.swapScore - left.swapScore)
    .slice(0, 4)

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    const activeUser = stateRef.current.users.find((user) => user.id === currentUserId)
    if (!activeUser) {
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    if (stateRef.current.lastSuggestionDate === today) {
      return
    }

    const suggestions = stateRef.current.users
      .filter((user) => user.id !== currentUserId)
      .map((user) => ({ user, match: computeMatchResult(activeUser, user) }))
      .filter(({ match }) => match.score >= 55)
      .sort((left, right) => right.match.score - left.match.score)
      .slice(0, 3)

    const base = {
      ...stateRef.current,
      lastSuggestionDate: today,
    }

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

  async function signUp(payload: SignupPayload) {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      }
    }

    const name = payload.name.trim()
    const email = payload.email.trim().toLowerCase()
    const response = await supabase.auth.signUp({
      email,
      password: payload.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          city: payload.city.trim(),
          full_name: name,
          name,
        },
      },
    })

    console.log('Supabase signUp response', response)

    if (response.error) {
      return { success: false, message: response.error.message }
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
  }

  async function login(payload: { email: string; password: string }) {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      }
    }

    const response = await supabase.auth.signInWithPassword({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    })

    console.log('Supabase signInWithPassword response', response)

    if (response.error) {
      return { success: false, message: response.error.message }
    }

    const firstName =
      deriveNameFromAuthUser(response.data.user).split(' ')[0] || 'there'
    toast.success(`Welcome back, ${firstName}.`)
    return { success: true, shouldNavigate: true }
  }

  async function loginWithGoogle() {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      }
    }

    const response = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    console.log('Supabase Google OAuth response', response)

    if (response.error) {
      return { success: false, message: response.error.message }
    }

    return { success: true, shouldNavigate: false }
  }

  async function logout() {
    if (!isSupabaseConfigured || !supabase) {
      mutateState((current) => syncStateWithAuthenticatedUser(current, null))
      return
    }

    const response = await supabase.auth.signOut()
    console.log('Supabase signOut response', response)

    if (response.error) {
      toast.error(response.error.message)
      return
    }

    toast.success('Logged out.')
  }

  function updateProfile(payload: ProfilePayload) {
    if (!currentUser) {
      return
    }

    mutateState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              ...payload,
              lastActiveAt: new Date().toISOString(),
            }
          : user,
      ),
    }))

    toast.success('Profile updated.')
  }

  function sendSwapRequest(payload: SwapRequestPayload) {
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

    const receiver = stateRef.current.users.find((user) => user.id === payload.receiverId)
    if (!receiver) {
      toast.error('Could not find that member.')
      return false
    }

    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id),
      swapRequests: [
        {
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
        },
        ...current.swapRequests,
      ],
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

    toast.success('Swap request sent.')
    return true
  }

  function sendConnectionRequest(payload: ConnectionRequestPayload) {
    if (!currentUser) {
      toast.error('Log in to connect with members.')
      return false
    }

    const duplicate = stateRef.current.connectionRequests.some(
      (request) =>
        ((request.senderId === currentUser.id && request.receiverId === payload.receiverId) ||
          (request.senderId === payload.receiverId && request.receiverId === currentUser.id)) &&
        ['Pending', 'Accepted'].includes(request.status),
    )

    if (duplicate) {
      toast.error('You already have an active connection with this member.')
      return false
    }

    const receiver = stateRef.current.users.find((user) => user.id === payload.receiverId)
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

  function respondToSwapRequest(
    requestId: string,
    status: Extract<SwapRequest['status'], 'Accepted' | 'Declined'>,
  ) {
    if (!currentUser) {
      return
    }

    const swap = stateRef.current.swapRequests.find((item) => item.id === requestId)
    if (!swap) {
      return
    }

    const sender = stateRef.current.users.find((user) => user.id === swap.senderId)
    if (!sender) {
      return
    }

    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id, sender.id),
      swapRequests: current.swapRequests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status,
              updatedAt: new Date().toISOString(),
            }
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
                type: 'system',
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

    toast.success(status === 'Accepted' ? 'Request accepted.' : 'Request declined.')
  }

  function respondToConnectionRequest(
    requestId: string,
    status: 'Accepted' | 'Declined',
  ) {
    if (!currentUser) {
      return
    }

    const request = stateRef.current.connectionRequests.find((item) => item.id === requestId)
    if (!request) {
      return
    }

    const sender = stateRef.current.users.find((user) => user.id === request.senderId)
    if (!sender) {
      return
    }

    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id, sender.id),
      connectionRequests: current.connectionRequests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status,
              updatedAt: new Date().toISOString(),
            }
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
                type: 'system',
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

  function completeSwap(requestId: string) {
    if (!currentUser) {
      return
    }

    const swap = stateRef.current.swapRequests.find((item) => item.id === requestId)
    if (!swap || swap.status === 'Completed') {
      return
    }

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
          type: 'system',
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

    toast.success('Swap marked complete.')
  }

  function sendChatMessage(
    threadId: string,
    message: string,
    type: ChatMessage['type'] = 'text',
  ) {
    if (!currentUser || !message.trim()) {
      return
    }

    const partnerId = resolveThreadPartnerId(stateRef.current, currentUser.id, threadId)
    if (!partnerId) {
      return
    }

    const partner = stateRef.current.users.find((user) => user.id === partnerId) ?? null
    mutateState((current) => ({
      ...current,
      users: touchUsers(current.users, currentUser.id, partner?.id),
      messages: [
        ...current.messages,
        {
          id: createId('message'),
          threadId,
          swapRequestId: threadId,
          senderId: currentUser.id,
          receiverId: partner?.id,
          message: message.trim(),
          timestamp: new Date().toISOString(),
          type,
        },
      ],
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
  }

  function addReview(requestId: string, rating: number, comment: string) {
    if (!currentUser) {
      return false
    }

    const swap = stateRef.current.swapRequests.find((item) => item.id === requestId)
    if (!swap || swap.status !== 'Completed') {
      toast.error('Complete the swap before leaving a review.')
      return false
    }

    const revieweeId =
      swap.senderId === currentUser.id ? swap.receiverId : swap.senderId
    const exists = stateRef.current.reviews.some(
      (review) =>
        review.swapRequestId === requestId &&
        review.reviewerId === currentUser.id &&
        review.revieweeId === revieweeId,
    )

    if (exists) {
      toast.error('You already reviewed this swap.')
      return false
    }

    mutateState((current) => ({
      ...current,
      reviews: [
        {
          id: createId('review'),
          reviewerId: currentUser.id,
          revieweeId,
          swapRequestId: requestId,
          rating,
          comment: comment.trim(),
          createdAt: new Date().toISOString(),
        },
        ...current.reviews,
      ],
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

    toast.success('Review submitted.')
    return true
  }

  function createPost(
    payload: Pick<LookingForPost, 'skillName' | 'category' | 'note' | 'mode'>,
  ) {
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
    if (!currentUser || currentUser.id === userId) {
      return
    }

    mutateState((current) => ({
      ...current,
      users: touchUsers(
        current.users.map((user) =>
          user.id === userId
            ? {
                ...user,
                reports: user.reports + 1,
              }
            : user,
        ),
        currentUser.id,
      ),
    }))

    toast.success('User reported. Thanks for helping keep the community safe.')
  }

  function markNotificationRead(notificationId: string) {
    if (!currentUser) {
      return
    }

    mutateState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    }))
  }

  function markAllNotificationsRead() {
    if (!currentUser) {
      return
    }

    mutateState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.userId === currentUser.id
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    }))
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
    return stateRef.current.users.find((user) => user.id === userId) ?? null
  }

  function getUserByUsername(username: string) {
    return stateRef.current.users.find((user) => user.username === username) ?? null
  }

  function getSwapById(swapId: string) {
    return stateRef.current.swapRequests.find((swap) => swap.id === swapId) ?? null
  }

  function getThreadById(threadId: string) {
    return buildMessageThreads(stateRef.current, currentUserId).find((thread) => thread.id === threadId) ?? null
  }

  function getMessagesForThread(threadId: string) {
    return stateRef.current.messages
      .filter((message) => (message.threadId || message.swapRequestId) === threadId)
      .sort(
        (left, right) =>
          new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
      )
  }

  function getMessagesForSwap(swapId: string) {
    return getMessagesForThread(swapId)
  }

  function getReviewsForUser(userId: string) {
    return stateRef.current.reviews
      .filter((review) => review.revieweeId === userId)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
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
        unreadNotificationCount,
        messageThreads,
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
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }

  return context
}

export function useShareProfile(username: string) {
  async function shareProfile() {
    const url = buildShareUrl(username)

    if (navigator.share) {
      await navigator.share({
        title: 'SkillBridge profile',
        text: 'Check out this SkillBridge member',
        url,
      })
      return
    }

    await navigator.clipboard.writeText(url)
    toast.success('Profile link copied.')
  }

  return { shareProfile }
}
