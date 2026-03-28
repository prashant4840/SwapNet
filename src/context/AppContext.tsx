/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import toast from 'react-hot-toast'
import { demoCredentials, getSeedState } from '@/data/seed'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type {
  AppState,
  ChatMessage,
  LookingForPost,
  MatchResult,
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
  computeMatchResult,
  createId,
  formatShortDate,
  hydrateState,
  resolveSwapPartner,
  slugify,
} from '@/utils/app'

const STORAGE_KEY = 'skillbridge-state-v1'
const PASSWORDS_KEY = 'skillbridge-passwords-v1'
const CHANNEL_KEY = 'skillbridge-live-sync'

interface AppContextValue {
  state: AppState
  users: UserProfile[]
  currentUser: UserProfile | null
  isAuthenticated: boolean
  unreadNotificationCount: number
  suggestedMatches: Array<UserProfile & { match: MatchResult }>
  newTodayUsers: UserProfile[]
  topRatedUsers: UserProfile[]
  signUp: (payload: SignupPayload) => Promise<{ success: boolean; message?: string }>
  login: (payload: { email: string; password: string }) => Promise<{
    success: boolean
    message?: string
  }>
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>
  logout: () => void
  updateProfile: (payload: ProfilePayload) => void
  sendSwapRequest: (payload: SwapRequestPayload) => boolean
  respondToSwapRequest: (
    requestId: string,
    status: Extract<SwapRequest['status'], 'Accepted' | 'Declined'>,
  ) => void
  completeSwap: (requestId: string) => void
  sendChatMessage: (
    requestId: string,
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
  getMessagesForSwap: (swapId: string) => ChatMessage[]
  getReviewsForUser: (userId: string) => Review[]
}

const AppContext = createContext<AppContextValue | null>(null)

function getPasswords() {
  if (typeof window === 'undefined') {
    return {} as Record<string, string>
  }

  const raw = window.localStorage.getItem(PASSWORDS_KEY)
  if (!raw) {
    return { [demoCredentials.email]: demoCredentials.password }
  }

  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return { [demoCredentials.email]: demoCredentials.password }
  }
}

function savePasswords(passwords: Record<string, string>) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords))
}

function loadInitialState() {
  if (typeof window === 'undefined') {
    return getSeedState('light')
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const fallback = getSeedState(prefersDark ? 'dark' : 'light')

  if (!rawState) {
    savePasswords({ [demoCredentials.email]: demoCredentials.password })
    return fallback
  }

  try {
    const parsed = JSON.parse(rawState) as AppState
    return hydrateState(parsed)
  } catch {
    return fallback
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

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(loadInitialState)
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

  const users = state.users
  const currentUser =
    state.users.find((user) => user.id === state.auth.currentUserId) ?? null
  const currentUserId = currentUser?.id ?? null
  const isAuthenticated = Boolean(currentUser)
  const unreadNotificationCount = currentUser
    ? state.notifications.filter(
        (notification) => notification.userId === currentUser.id && !notification.read,
      ).length
    : 0

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
    const name = payload.name.trim()
    const email = payload.email.trim().toLowerCase()

    if (stateRef.current.users.some((user) => user.email.toLowerCase() === email)) {
      return { success: false, message: 'An account with that email already exists.' }
    }

    const usernameBase = slugify(name) || 'member'
    let username = usernameBase
    let count = 1

    while (stateRef.current.users.some((user) => user.username === username)) {
      count += 1
      username = `${usernameBase}-${count}`
    }

    const newUser: UserProfile = {
      id: createId('user'),
      username,
      name,
      email,
      city: payload.city.trim(),
      bio: 'Tell the community what you love teaching and what you want to learn next.',
      headline: 'New member ready to trade skills',
      photo: `https://api.dicebear.com/9.x/shapes/svg?seed=${username}`,
      age: undefined,
      availability: ['Weekends'],
      mode: 'Online',
      joinedAt: new Date().toISOString(),
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
    }

    const passwords = getPasswords()
    passwords[email] = payload.password
    savePasswords(passwords)

    mutateState((current) => ({
      ...current,
      users: [newUser, ...current.users],
      auth: {
        currentUserId: newUser.id,
        provider: 'email',
        mode: isSupabaseConfigured ? 'supabase' : 'demo',
      },
      notifications: [
        createNotification(
          newUser.id,
          'system',
          'Profile created',
          'Add the skills you offer and want to learn to unlock better matches.',
          '/settings',
        ),
        ...current.notifications,
      ],
    }))

    toast.success('Account created. Finish your profile to start matching.')
    return { success: true }
  }

  async function login(payload: { email: string; password: string }) {
    const email = payload.email.trim().toLowerCase()
    const user = stateRef.current.users.find((entry) => entry.email.toLowerCase() === email)

    if (!user) {
      return { success: false, message: 'No account found for that email.' }
    }

    const passwords = getPasswords()
    if ((passwords[email] ?? demoCredentials.password) !== payload.password) {
      return { success: false, message: 'Incorrect password.' }
    }

    mutateState((current) => ({
      ...current,
      auth: {
        currentUserId: user.id,
        provider: 'email',
        mode: isSupabaseConfigured ? 'supabase' : 'demo',
      },
    }))

    toast.success(`Welcome back, ${user.name.split(' ')[0]}.`)
    return { success: true }
  }

  async function loginWithGoogle() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      return { success: true }
    }

    const demoUser =
      stateRef.current.users.find((user) => user.email === demoCredentials.email) ??
      stateRef.current.users[0]

    mutateState((current) => ({
      ...current,
      auth: {
        currentUserId: demoUser?.id ?? null,
        provider: 'google',
        mode: 'demo',
      },
    }))

    toast.success('Demo Google sign-in active. Connect Supabase env vars for real OAuth.')
    return { success: true }
  }

  function logout() {
    mutateState((current) => ({
      ...current,
      auth: {
        currentUserId: null,
        provider: null,
        mode: current.auth.mode,
      },
    }))

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
                swapRequestId: requestId,
                senderId: currentUser.id,
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
          status === 'Accepted' ? `/chat/${requestId}` : '/explore',
        ),
        ...current.notifications,
      ],
    }))

    toast.success(status === 'Accepted' ? 'Request accepted.' : 'Request declined.')
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
          swapRequestId: requestId,
          senderId: currentUser.id,
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
    requestId: string,
    message: string,
    type: ChatMessage['type'] = 'text',
  ) {
    if (!currentUser || !message.trim()) {
      return
    }

    const swap = stateRef.current.swapRequests.find((item) => item.id === requestId)
    if (!swap) {
      return
    }

    const partner = resolveSwapPartner(swap, currentUser.id, stateRef.current.users)
    mutateState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        {
          id: createId('message'),
          swapRequestId: requestId,
          senderId: currentUser.id,
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
              `/chat/${requestId}`,
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
      users: current.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              reports: user.reports + 1,
            }
          : user,
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
    const passwords = { [demoCredentials.email]: demoCredentials.password }
    savePasswords(passwords)
    applyState(next)
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

  function getMessagesForSwap(swapId: string) {
    return stateRef.current.messages
      .filter((message) => message.swapRequestId === swapId)
      .sort(
        (left, right) =>
          new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
      )
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
        users,
        currentUser,
        isAuthenticated,
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
        respondToSwapRequest,
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
