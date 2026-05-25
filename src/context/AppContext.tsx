import { createContext, useContext, type PropsWithChildren } from 'react'
import { ThemeProvider, useTheme } from './ThemeContext'
import { AuthProvider, useAuth } from './AuthContext'
import { NotificationProvider, useNotifications } from './NotificationContext'
import { UserDiscoveryProvider, useUserDiscovery } from './UserDiscoveryContext'
import { PostProvider, usePosts } from './PostContext'
import { ReviewProvider, useReviews } from './ReviewContext'
import { ChatProvider, useChat } from './ChatContext'
import { RequestProvider, useRequests } from './RequestContext'
import type { UserProfile, Review, LookingForPost, ChatMessage, MessageThread, SwapRequest, ConnectionRequest, NotificationItem } from '@/types'

interface AppContextValue {
  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Auth
  isAuthenticated: boolean
  currentUser: UserProfile | null
  loading: boolean
  signUp: (payload: any) => Promise<any>
  login: (payload: any) => Promise<any>
  loginWithGoogle: () => Promise<any>
  logout: () => Promise<void>
  updateProfile: (payload: any) => Promise<void>
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
  sendChatMessage: (threadId: string, message: string) => Promise<void>
  subscribeToThreadMessages: (threadId: string) => () => void
  getMessagesForThread: (threadId: string) => ChatMessage[]
  getMessagesForSwap: (swapId: string) => ChatMessage[]
  getThreadById: (threadId: string) => MessageThread | null

  // Requests
  swapRequests: SwapRequest[]
  connectionRequests: ConnectionRequest[]
  getSwapById: (swapId: string) => SwapRequest | null
  sendSwapRequest: (payload: any) => Promise<boolean>
  sendConnectionRequest: (payload: any) => Promise<boolean>
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

const AppContext = createContext<AppContextValue | null>(null)

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
        <NotificationProvider currentUserId="">
          <UserDiscoveryProvider users={initialUsers}>
            <PostProvider posts={initialPosts}>
              <ReviewProvider reviews={initialReviews}>
                <ChatProvider
                  messages={initialMessages}
                  swapRequests={initialSwapRequests}
                  connectionRequests={initialConnectionRequests}
                  users={initialUsers}
                >
                  <RequestProvider
                    swapRequests={initialSwapRequests}
                    connectionRequests={initialConnectionRequests}
                    users={initialUsers}
                  >
                    <AppContextValue>
                      {children}
                    </AppContextValue>
                  </RequestProvider>
                </ChatProvider>
              </ReviewProvider>
            </PostProvider>
          </UserDiscoveryProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

function AppContextValue({ children }: PropsWithChildren) {
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
    getUserById: auth.getUserById,
    getUserByUsername: auth.getUserByUsername,
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

export { useTheme, useAuth, useNotifications, useUserDiscovery, usePosts, useReviews, useChat, useRequests }

export function useShareProfile() {
  return {
    shareProfile: () => {},
  }
}
