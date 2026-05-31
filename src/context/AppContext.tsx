/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type PropsWithChildren } from 'react'
import { ThemeProvider, useTheme } from './ThemeContext'
import { AuthProvider, useAuth } from './AuthContext'
import { NotificationProvider, useNotifications } from './NotificationContext'
import { UserDiscoveryProvider, useUserDiscovery } from './UserDiscoveryContext'
import { PostProvider, usePosts } from './PostContext'
import { ReviewProvider, useReviews } from './ReviewContext'
import { ChatProvider, useChat } from './ChatContext'
import { RequestProvider, useRequests } from './RequestContext'
import toast from 'react-hot-toast'
import type { UserProfile, Review, LookingForPost, ChatMessage, MessageThread, SwapRequest, ConnectionRequest, NotificationItem, ChatMessageKind, AuthActionResult, SignupPayload, ProfilePayload, SwapRequestPayload, ConnectionRequestPayload } from '@/types'

interface AppContextValue {
  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Auth
  isAuthenticated: boolean
  currentUser: UserProfile | null
  loading: boolean
  signUp: (payload: SignupPayload) => Promise<AuthActionResult>
  login: (payload: { email: string; password: string }) => Promise<AuthActionResult>
  loginWithGoogle: () => Promise<AuthActionResult>
  logout: () => Promise<void>
  updateProfile: (payload: ProfilePayload) => Promise<void>
  getUserById: (userId: string) => UserProfile | null
  getUserByUsername: (username: string) => UserProfile | null
  reportUser: (userId: string) => Promise<boolean>

  // Notifications
  notifications: NotificationItem[]
  unreadNotificationCount: number
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void

  // User Discovery
  users: UserProfile[]
  suggestedMatches: Array<UserProfile & { match: { score: number; matchType?: string; reasons?: string[] } }>
  newTodayUsers: UserProfile[]
  topRatedUsers: UserProfile[]
  ensureUsersLoaded: (userIds: string[]) => Promise<void>

  // Posts
  posts: LookingForPost[]
  createPost: (payload: Pick<LookingForPost, 'skillName' | 'category' | 'note' | 'mode'>) => Promise<boolean>

  // Reviews
  reviews: Review[]
  addReview: (requestId: string, rating: number, comment: string) => Promise<boolean>
  getReviewsForUser: (userId: string) => Review[]

  // Chat
  messages: ChatMessage[]
  messageThreads: MessageThread[]
  sendChatMessage: (threadId: string, message: string, messageType?: ChatMessageKind) => Promise<void>
  subscribeToThreadMessages: (threadId: string) => () => void
  getMessagesForThread: (threadId: string) => ChatMessage[]
  getMessagesForSwap: (swapId: string) => ChatMessage[]
  getThreadById: (threadId: string) => MessageThread | null

  // Requests
  swapRequests: SwapRequest[]
  connectionRequests: ConnectionRequest[]
  getSwapById: (swapId: string) => SwapRequest | null
  sendSwapRequest: (payload: SwapRequestPayload) => Promise<boolean>
  sendConnectionRequest: (payload: ConnectionRequestPayload) => Promise<boolean>
  respondToSwapRequest: (requestId: string, status: 'Accepted' | 'Declined') => Promise<boolean>
  respondToConnectionRequest: (requestId: string, status: 'Accepted' | 'Declined') => Promise<boolean>
  completeSwap: (requestId: string) => Promise<void>

  // Backward-compatible state object for existing code
  state: {
    theme: 'light' | 'dark'
    users: UserProfile[]
    messages: ChatMessage[]
    swapRequests: SwapRequest[]
    connectionRequests: ConnectionRequest[]
    reviews: Review[]
    posts: LookingForPost[]
    notifications: NotificationItem[]
    messageThreads: MessageThread[]
    unreadNotificationCount: number
  }
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

interface AppProviderProps extends PropsWithChildren {
  // Allow optional initial data for testing/SSR
  initialUsers?: UserProfile[]
  initialPosts?: LookingForPost[]
  initialReviews?: Review[]
  initialMessages?: ChatMessage[]
  initialSwapRequests?: SwapRequest[]
  initialConnectionRequests?: ConnectionRequest[]
  initialNotifications?: NotificationItem[]
}

export function AppProvider({
  children,
  initialUsers = [],
  initialPosts = [],
  initialReviews = [],
  initialMessages = [],
  initialSwapRequests = [],
  initialConnectionRequests = [],
}: AppProviderProps) {
  return (
    <AuthProvider allUsers={initialUsers}>
      <ThemeProvider>
        <AppProvidersInner
          initialUsers={initialUsers}
          initialPosts={initialPosts}
          initialReviews={initialReviews}
          initialMessages={initialMessages}
          initialSwapRequests={initialSwapRequests}
          initialConnectionRequests={initialConnectionRequests}
        >
          {children}
        </AppProvidersInner>
      </ThemeProvider>
    </AuthProvider>
  )
}

function AppProvidersInner({
  children,
  initialUsers = [],
  initialPosts = [],
  initialReviews = [],
  initialMessages = [],
  initialSwapRequests = [],
  initialConnectionRequests = [],
}: AppProviderProps) {
  const { currentUserId, currentUser } = useAuth()

  return (
    <NotificationProvider currentUserId={currentUserId}>
      <UserDiscoveryProvider users={initialUsers} currentUser={currentUser}>
        <PostProvider posts={initialPosts} currentUserId={currentUserId}>
          <ReviewProvider reviews={initialReviews} currentUserId={currentUserId} swapRequests={initialSwapRequests}>
            <ChatProvider
              messages={initialMessages}
              swapRequests={initialSwapRequests}
              connectionRequests={initialConnectionRequests}
              users={initialUsers}
              currentUserId={currentUserId}
            >
              <RequestProvider
                swapRequests={initialSwapRequests}
                connectionRequests={initialConnectionRequests}
                users={initialUsers}
                currentUserId={currentUserId}
                currentUser={currentUser}
              >
                <AppContextProvider>
                  {children}
                </AppContextProvider>
              </RequestProvider>
            </ChatProvider>
          </ReviewProvider>
        </PostProvider>
      </UserDiscoveryProvider>
    </NotificationProvider>
  )
}

function AppContextProvider({ children }: PropsWithChildren) {
  const theme = useTheme()
  const auth = useAuth()
  const notifications = useNotifications()
  const discovery = useUserDiscovery()
  const posts = usePosts()
  const reviews = useReviews()
  const chat = useChat()
  const requests = useRequests()

  const contextValue: AppContextValue = {
    // Theme
    theme: theme.theme,
    toggleTheme: theme.toggleTheme,

    // Auth
    isAuthenticated: auth.isAuthenticated,
    currentUser: auth.currentUser,
    loading: auth.loading,
    signUp: auth.signUp,
    login: auth.login,
    loginWithGoogle: auth.loginWithGoogle,
    logout: auth.logout,
    updateProfile: auth.updateProfile,
    getUserById: (userId: string) => {
      if (auth.currentUser?.id === userId) return auth.currentUser
      return discovery.users.find((u) => u.id === userId) ?? auth.getUserById(userId)
    },
    getUserByUsername: (username: string) => {
      if (auth.currentUser?.username === username) return auth.currentUser
      return discovery.users.find((u) => u.username === username) ?? auth.getUserByUsername(username)
    },
    reportUser: auth.reportUser,

    // Notifications
    notifications: notifications.notifications,
    unreadNotificationCount: notifications.unreadNotificationCount,
    markNotificationRead: notifications.markNotificationRead,
    markAllNotificationsRead: notifications.markAllNotificationsRead,

    // User Discovery
    users: discovery.users,
    suggestedMatches: discovery.suggestedMatches,
    newTodayUsers: discovery.newTodayUsers,
    topRatedUsers: discovery.topRatedUsers,
    ensureUsersLoaded: discovery.ensureUsersLoaded,

    // Posts
    posts: posts.posts,
    createPost: posts.createPost,

    // Reviews
    reviews: reviews.reviews,
    addReview: reviews.addReview,
    getReviewsForUser: reviews.getReviewsForUser,

    // Chat
    messages: chat.messages,
    messageThreads: chat.messageThreads,
    sendChatMessage: chat.sendChatMessage,
    subscribeToThreadMessages: chat.subscribeToThreadMessages,
    getMessagesForThread: chat.getMessagesForThread,
    getMessagesForSwap: chat.getMessagesForSwap,
    getThreadById: (threadId: string) => {
      return chat.messageThreads.find((t) => t.id === threadId) || null
    },

    // Requests
    swapRequests: requests.swapRequests,
    connectionRequests: requests.connectionRequests,
    getSwapById: requests.getSwapById,
    sendSwapRequest: requests.sendSwapRequest,
    sendConnectionRequest: requests.sendConnectionRequest,
    respondToSwapRequest: requests.respondToSwapRequest,
    respondToConnectionRequest: requests.respondToConnectionRequest,
    completeSwap: requests.completeSwap,

    // Backward-compatible state
    state: {
      theme: theme.theme,
      users: discovery.users,
      messages: chat.messages,
      swapRequests: requests.swapRequests,
      connectionRequests: requests.connectionRequests,
      reviews: reviews.reviews,
      posts: posts.posts,
      notifications: notifications.notifications,
      messageThreads: chat.messageThreads,
      unreadNotificationCount: notifications.unreadNotificationCount,
    },
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export function useShareProfile(username?: string) {
  const { getUserByUsername } = useApp()
  
  const getShareData = () => {
    if (!username) return null
    const url = `${window.location.origin}/profile/${username}`
    const user = getUserByUsername(username)
    return {
      url,
      title: user ? `${user.name} (@${user.username}) - Skill Share Profile` : 'SwapNet Member Profile',
      text: user?.headline ? `${user.name} - ${user.headline}. Connect and swap skills on SwapNet!` : `Check out this profile on SwapNet!`,
    }
  }

  const shareProfile = async () => {
    const data = getShareData()
    if (!data) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        })
        toast.success('Shared successfully!')
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err)
          try {
            await navigator.clipboard.writeText(data.url)
            toast.success('Profile link copied successfully')
          } catch {
            toast.error('Failed to copy link')
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(data.url)
        toast.success('Profile link copied successfully')
      } catch {
        toast.error('Failed to copy link')
      }
    }
  }

  const copyLink = async () => {
    const data = getShareData()
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.url)
      toast.success('Profile URL copied')
    } catch (err) {
      console.error('Error copying link:', err)
      toast.error('Failed to copy link')
    }
  }

  return { shareProfile, copyLink }
}
