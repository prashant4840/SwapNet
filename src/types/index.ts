export type ThemeMode = 'light' | 'dark'
export type AuthMode = 'demo' | 'supabase'
export type AvailabilitySlot = 'Weekdays' | 'Weekends' | 'Evenings'
export type LearningMode = 'Online' | 'In-person' | 'Both'
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type RequestStatus = 'Pending' | 'Accepted' | 'Declined' | 'Completed'
export type ConnectionRequestStatus = 'Pending' | 'Accepted' | 'Declined'
export type MatchType = 'perfect' | 'good' | 'partial'
export type NotificationType =
  | 'match'
  | 'request'
  | 'connection'
  | 'chat'
  | 'review'
  | 'system'
  | 'post'
export type SkillCategory =
  | 'Music'
  | 'Tech'
  | 'Creative'
  | 'Wellness'
  | 'Lifestyle'
  | 'Academic'
  | 'Business'
  | 'Languages'

export interface SkillEntry {
  id: string
  name: string
  category: SkillCategory
  level?: SkillLevel
}

export interface UserProfile {
  id: string
  username: string
  name: string
  email: string
  photo: string
  city: string
  bio: string
  age?: number
  headline: string
  availability: AvailabilitySlot[]
  mode: LearningMode
  joinedAt: string
  lastActiveAt: string
  swapScore: number
  rating: number
  reviewCount: number
  completedSwaps: number
  taughtCount: number
  learnedCount: number
  badges: string[]
  skillsOffered: SkillEntry[]
  skillsWanted: SkillEntry[]
  reports: number
}

export interface SwapRequest {
  id: string
  senderId: string
  receiverId: string
  message: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
  offeredSkillId: string
  wantedSkillId: string
  completedBy: string[]
}

export interface ChatMessage {
  id: string
  threadId: string
  swapRequestId: string
  connectionRequestId?: string
  senderId: string
  receiverId?: string
  message: string
  timestamp: string
  type: 'text' | 'template' | 'system'
}

export interface ConnectionRequest {
  id: string
  senderId: string
  receiverId: string
  message: string
  status: ConnectionRequestStatus
  createdAt: string
  updatedAt: string
}

export interface MessageThread {
  id: string
  kind: 'swap' | 'connection'
  partnerId: string
  createdAt: string
  updatedAt: string
  preview: string
  contextLabel: string
  status: 'active' | 'completed' | 'pending'
  unreadCount: number
}

export interface Review {
  id: string
  reviewerId: string
  revieweeId: string
  swapRequestId: string
  rating: number
  comment: string
  createdAt: string
}

export interface LookingForPost {
  id: string
  userId: string
  skillName: string
  category: SkillCategory
  note: string
  city: string
  mode: LearningMode
  createdAt: string
  responses: number
}

export interface NotificationItem {
  id: string
  userId: string
  type: NotificationType
  title: string
  description: string
  link?: string
  createdAt: string
  read: boolean
}

export interface AuthSession {
  currentUserId: string | null
  provider: 'email' | 'google' | null
  mode: AuthMode
}

export interface FeedFilters {
  query: string
  category: 'All' | SkillCategory
  city: 'All' | string
  mode: 'All' | LearningMode
  rating: 'All' | '3+' | '4+' | '4.5+'
  sort: 'match' | 'rating' | 'recent'
  perfectOnly: boolean
  nearbyOnly: boolean
  topRatedOnly: boolean
}

export interface AppState {
  users: UserProfile[]
  swapRequests: SwapRequest[]
  connectionRequests: ConnectionRequest[]
  messages: ChatMessage[]
  reviews: Review[]
  notifications: NotificationItem[]
  posts: LookingForPost[]
  auth: AuthSession
  theme: ThemeMode
  lastSuggestionDate: string | null
}

export interface MatchResult {
  score: number
  matchType: MatchType
  isPerfect: boolean
  matchesOffering: string[]
  matchesLearning: string[]
  reasons: string[]
  sharedAvailability: AvailabilitySlot[]
  locationBonus: boolean
  ratingBoost: boolean
}

export interface SignupPayload {
  name: string
  email: string
  city: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ProfilePayload {
  name: string
  city: string
  bio: string
  age?: number
  photo: string
  headline: string
  availability: AvailabilitySlot[]
  mode: LearningMode
  skillsOffered: SkillEntry[]
  skillsWanted: SkillEntry[]
}

export interface SwapRequestPayload {
  receiverId: string
  message: string
  offeredSkillId: string
  wantedSkillId: string
}

export interface ConnectionRequestPayload {
  receiverId: string
  message: string
}
