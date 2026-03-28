export type ThemeMode = 'light' | 'dark'
export type AuthMode = 'demo' | 'supabase'
export type AvailabilitySlot = 'Weekdays' | 'Weekends' | 'Evenings'
export type LearningMode = 'Online' | 'In-person' | 'Both'
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type RequestStatus = 'Pending' | 'Accepted' | 'Declined' | 'Completed'
export type NotificationType =
  | 'match'
  | 'request'
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
  swapRequestId: string
  senderId: string
  message: string
  timestamp: string
  type: 'text' | 'template' | 'system'
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
}

export interface AppState {
  users: UserProfile[]
  swapRequests: SwapRequest[]
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
  isPerfect: boolean
  matchesOffering: string[]
  matchesLearning: string[]
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
