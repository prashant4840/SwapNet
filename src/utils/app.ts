import { format, formatDistanceToNowStrict, isToday } from 'date-fns'
import type {
  AppState,
  AvailabilitySlot,
  MatchResult,
  MessageThread,
  Review,
  SkillCategory,
  SkillEntry,
  SwapRequest,
  UserProfile,
} from '@/types'

const SWAP_THREAD_PREFIX = 'swap_'
const CONNECTION_THREAD_PREFIX = 'connection_'

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function cleanId(id: string): string {
  const stripped = id.replace(/^(swap|connection|review|message)-/, '')
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(stripped)) {
    return stripped
  }
  return id
}

export function buildSwapThreadKey(swapId: string) {
  return `${SWAP_THREAD_PREFIX}${swapId}`
}

export function buildConnectionThreadKey(connectionRequestId: string) {
  return `${CONNECTION_THREAD_PREFIX}${connectionRequestId}`
}

export function parseThreadKey(threadKey: string) {
  if (threadKey.startsWith(SWAP_THREAD_PREFIX)) {
    return {
      kind: 'swap' as const,
      sourceId: threadKey.slice(SWAP_THREAD_PREFIX.length),
    }
  }

  if (threadKey.startsWith(CONNECTION_THREAD_PREFIX)) {
    return {
      kind: 'connection' as const,
      sourceId: threadKey.slice(CONNECTION_THREAD_PREFIX.length),
    }
  }

  return null
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatRelativeTime(value: string | undefined | null) {
  if (!value) return 'some time ago'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'some time ago'
  return formatDistanceToNowStrict(date, { addSuffix: true })
}

export function formatShortDate(value: string | undefined | null) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'N/A'
  return format(date, 'MMM d')
}

export function normalizeSkillName(name: string) {
  return name.trim().toLowerCase()
}

export function profileCompletion(profile: UserProfile) {
  const checks = [
    Boolean(profile.name),
    Boolean(profile.photo),
    Boolean(profile.city),
    Boolean(profile.bio),
    Boolean(profile.headline),
    profile.skillsOffered.length > 0,
    profile.skillsWanted.length > 0,
    profile.availability.length > 0,
    Boolean(profile.mode),
  ]

  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function skillNameList(skills: SkillEntry[]) {
  return skills.map((skill) => normalizeSkillName(skill.name))
}

export function isRecentlyActive(lastActiveAt: string, withinHours = 36) {
  return Date.now() - new Date(lastActiveAt).getTime() <= withinHours * 60 * 60 * 1000
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}

function sharedSkillNames(primary: SkillEntry[], secondary: SkillEntry[]) {
  const secondaryNames = new Set(skillNameList(secondary))
  return uniqueStrings(
    primary
      .filter((skill) => secondaryNames.has(normalizeSkillName(skill.name)))
      .map((skill) => skill.name),
  )
}

function sharedCategories(primary: SkillEntry[], secondary: SkillEntry[]) {
  const secondaryCategories = new Set(secondary.map((skill) => skill.category))
  return uniqueStrings(
    primary
      .filter((skill) => secondaryCategories.has(skill.category))
      .map((skill) => skill.category),
  ) as SkillCategory[]
}

function availabilityOverlap(primary: AvailabilitySlot[], secondary: AvailabilitySlot[]) {
  const secondarySlots = new Set(secondary)
  return primary.filter((slot) => secondarySlots.has(slot))
}

export function computeMatchResult(
  currentUser: UserProfile | null | undefined,
  otherUser: UserProfile,
) {
  if (!currentUser || currentUser.id === otherUser.id) {
    const baseline = Math.min(
      94,
      Math.round(
        profileCompletion(otherUser) * 0.44 +
          otherUser.rating * 11 +
          (isRecentlyActive(otherUser.lastActiveAt) ? 6 : 0),
      ),
    )

    return {
      score: Math.max(baseline, 28),
      matchType: baseline >= 78 ? 'good' : 'partial',
      isPerfect: false,
      matchesOffering: [],
      matchesLearning: [],
      reasons: otherUser.rating >= 4.5 ? ['Highly rated mentor'] : ['Well-completed public profile'],
      sharedAvailability: [],
      locationBonus: false,
      ratingBoost: otherUser.rating >= 4.5,
    } satisfies MatchResult
  }

  const directTeachMatches = sharedSkillNames(currentUser.skillsWanted, otherUser.skillsOffered)
  const directLearnMatches = sharedSkillNames(currentUser.skillsOffered, otherUser.skillsWanted)
  const partialTeachMatches = sharedCategories(currentUser.skillsWanted, otherUser.skillsOffered)
  const partialLearnMatches = sharedCategories(currentUser.skillsOffered, otherUser.skillsWanted)
  const sharedAvailability = availabilityOverlap(currentUser.availability, otherUser.availability)
  const sameCity = currentUser.city === otherUser.city
  const ratingBoost = otherUser.rating >= 4.5
  const activeBoost = isRecentlyActive(otherUser.lastActiveAt)
  const modeBonus =
    currentUser.mode === otherUser.mode ||
    currentUser.mode === 'Both' ||
    otherUser.mode === 'Both'
      ? 8
      : 3

  const score = Math.min(
    100,
    directTeachMatches.length * 28 +
      directLearnMatches.length * 28 +
      Math.max(partialTeachMatches.length - directTeachMatches.length, 0) * 10 +
      Math.max(partialLearnMatches.length - directLearnMatches.length, 0) * 10 +
      (sharedAvailability.length ? 8 : 0) +
      (sameCity ? 8 : 0) +
      modeBonus +
      Math.round(otherUser.rating * 2) +
      (activeBoost ? 4 : 0),
  )

  const reasons = uniqueStrings(
    [
      ...directTeachMatches.map((skill) => `You want ${skill}, they teach ${skill}`),
      ...directLearnMatches.map((skill) => `You teach ${skill}, they want ${skill}`),
      ...partialTeachMatches
        .filter((category) => !directTeachMatches.some((skill) => skill === category))
        .map((category) => `They offer ${category.toLowerCase()} skills related to what you want`),
      ...partialLearnMatches
        .filter((category) => !directLearnMatches.some((skill) => skill === category))
        .map((category) => `They want ${category.toLowerCase()} skills you already teach`),
      ...(sharedAvailability.length
        ? [`Both available ${sharedAvailability.join(', ').toLowerCase()}`]
        : []),
      ...(sameCity ? [`Both based in ${otherUser.city}`] : []),
      ...(ratingBoost ? ['Highly rated user'] : []),
      ...(activeBoost ? ['Active recently'] : []),
    ],
  ).slice(0, 4)

  const isPerfect = directTeachMatches.length > 0 && directLearnMatches.length > 0
  const matchType = isPerfect ? 'perfect' : score >= 74 ? 'good' : 'partial'

  return {
    score: Math.max(score, 18),
    matchType,
    isPerfect,
    matchesOffering: directTeachMatches,
    matchesLearning: directLearnMatches,
    reasons,
    sharedAvailability,
    locationBonus: sameCity,
    ratingBoost,
  } satisfies MatchResult
}

export function deriveProfileMetrics(
  users: UserProfile[],
  swapRequests: SwapRequest[],
  reviews: Review[],
) {
  return users.map((user) => {
    const userReviews = reviews.filter((review) => review.revieweeId === user.id)
    const completed = swapRequests.filter(
      (swap) =>
        swap.status === 'Completed' &&
        (swap.senderId === user.id || swap.receiverId === user.id),
    )
    const rating = userReviews.length
      ? Number(
          (
            userReviews.reduce((sum, review) => sum + review.rating, 0) /
            userReviews.length
          ).toFixed(1),
        )
      : 0

    const taughtCount = completed.length + Math.max(0, Math.round(userReviews.length / 2))
    const learnedCount = completed.length
    const defaultBadges = [
      ...(rating >= 4.8 ? ['Top Rated'] : []),
      ...(isRecentlyActive(user.lastActiveAt) ? ['Active User'] : []),
    ]

    return {
      ...user,
      rating,
      reviewCount: userReviews.length,
      completedSwaps: completed.length,
      taughtCount,
      learnedCount,
      badges: uniqueStrings([...defaultBadges, ...user.badges]),
      swapScore: Math.min(
        100,
        Math.round(
          rating * 18 +
            completed.length * 9 +
            profileCompletion(user) * 0.22 +
            (isRecentlyActive(user.lastActiveAt) ? 4 : 0) -
            user.reports * 6,
        ),
      ),
    }
  })
}

export function buildMessageThreads(state: AppState, currentUserId: string | null) {
  if (!currentUserId) {
    return [] as MessageThread[]
  }

  const messagesByThread = new Map<string, AppState['messages']>()
  for (const message of state.messages) {
    const threadId = message.threadId
    if (!threadId) continue
    const existing = messagesByThread.get(threadId) ?? []
    existing.push({
      ...message,
      threadId,
    })
    messagesByThread.set(threadId, existing)
  }

  const chatNotificationCount = new Map<string, number>()
  for (const notification of state.notifications) {
    if (
      notification.userId === currentUserId &&
      notification.type === 'chat' &&
      notification.link
    ) {
      const threadId = notification.link.split('/').pop() ?? ''
      chatNotificationCount.set(threadId, (chatNotificationCount.get(threadId) ?? 0) + 1)
    }
  }

  const swapThreads: MessageThread[] = state.swapRequests
    .filter(
      (swap) =>
        (swap.senderId === currentUserId || swap.receiverId === currentUserId) &&
        ['Accepted', 'Completed'].includes(swap.status),
    )
    .map((swap) => {
      const threadKey = buildSwapThreadKey(swap.id)
      const partnerId = swap.senderId === currentUserId ? swap.receiverId : swap.senderId
      const threadMessages = (
        messagesByThread.get(threadKey) ??
        messagesByThread.get(swap.id) ??
        []
      ).sort(
        (left, right) =>
          new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
      )
      const lastMessage = threadMessages.at(-1)

      return {
        id: threadKey,
        kind: 'swap' as const,
        partnerId,
        createdAt: swap.createdAt,
        updatedAt: lastMessage?.timestamp ?? swap.updatedAt,
        preview: lastMessage?.message ?? swap.message,
        contextLabel: swap.status === 'Completed' ? 'Swap completed' : 'Swap active',
        status: swap.status === 'Completed' ? ('completed' as const) : ('active' as const),
        unreadCount: chatNotificationCount.get(threadKey) ?? chatNotificationCount.get(swap.id) ?? 0,
      }
    })

  const connectionThreads: MessageThread[] = state.connectionRequests
    .filter(
      (request) =>
        (request.senderId === currentUserId || request.receiverId === currentUserId) &&
        request.status === 'Accepted',
    )
    .map((request) => {
      const threadKey = buildConnectionThreadKey(request.id)
      const partnerId = request.senderId === currentUserId ? request.receiverId : request.senderId
      const threadMessages = (
        messagesByThread.get(threadKey) ??
        messagesByThread.get(request.id) ??
        []
      ).sort(
        (left, right) =>
          new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
      )
      const lastMessage = threadMessages.at(-1)

      return {
        id: threadKey,
        kind: 'connection' as const,
        partnerId,
        createdAt: request.createdAt,
        updatedAt: lastMessage?.timestamp ?? request.updatedAt,
        preview: lastMessage?.message ?? request.message,
        contextLabel: 'Peer connection',
        status: 'active' as const,
        unreadCount:
          chatNotificationCount.get(threadKey) ?? chatNotificationCount.get(request.id) ?? 0,
      }
    })

  return [...swapThreads, ...connectionThreads].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}

export function hydrateState(state: AppState) {
  const connectionRequests = state.connectionRequests ?? []

  return {
    ...state,
    connectionRequests,
    users: deriveProfileMetrics(
      (state.users ?? []).map((user) => ({
        ...user,
        lastActiveAt: user.lastActiveAt ?? user.joinedAt,
        badges: user.badges ?? [],
      })),
      state.swapRequests ?? [],
      state.reviews ?? [],
    ),
    messages: (state.messages ?? []).map((message) => ({
      ...message,
      threadId: message.connectionRequestId
        ? buildConnectionThreadKey(message.connectionRequestId)
        : message.swapRequestId
          ? buildSwapThreadKey(message.swapRequestId)
          : message.threadId ?? '',
    })),
  }
}

export function isNewToday(isoDate: string) {
  return isToday(new Date(isoDate))
}

export function buildShareUrl(username: string) {
  if (typeof window === 'undefined') {
    return `https://skillswap.app/profile/${username}`
  }

  return `${window.location.origin}/profile/${username}`
}

export function uniqueCities(users: UserProfile[]) {
  return Array.from(new Set(users.map((user) => user.city))).sort()
}

export function categoriesFromSkills(skills: SkillEntry[]) {
  return Array.from(new Set(skills.map((skill) => skill.category))) as SkillCategory[]
}

export function resolveSwapPartner(
  swap: SwapRequest,
  currentUserId: string | null,
  users: UserProfile[],
) {
  const partnerId = swap.senderId === currentUserId ? swap.receiverId : swap.senderId
  return users.find((user) => user.id === partnerId) ?? null
}

export interface ProfileCompletionItem {
  label: string
  field: keyof UserProfile | 'skills'
  prompt: string
  link?: string
}

export function getProfileCompletionItems(profile: UserProfile): ProfileCompletionItem[] {
  const items: ProfileCompletionItem[] = [
    {
      label: 'Profile photo',
      field: 'photo',
      prompt: 'Upload a profile photo to build trust',
      link: '/settings',
    },
    {
      label: 'Full name',
      field: 'name',
      prompt: 'Add your full name',
      link: '/settings',
    },
    {
      label: 'City',
      field: 'city',
      prompt: 'Tell us where you are',
      link: '/settings',
    },
    {
      label: 'Bio',
      field: 'bio',
      prompt: 'Write a short bio about yourself',
      link: '/settings',
    },
    {
      label: 'Headline',
      field: 'headline',
      prompt: 'Add a headline (e.g., "Full Stack Developer")',
      link: '/settings',
    },
    {
      label: 'Skills offered',
      field: 'skills',
      prompt: 'Add skills you can teach',
      link: '/settings',
    },
    {
      label: 'Skills wanted',
      field: 'skills',
      prompt: 'Add skills you want to learn',
      link: '/settings',
    },
    {
      label: 'Availability',
      field: 'availability',
      prompt: 'Set your availability schedule',
      link: '/settings',
    },
    {
      label: 'Preferred mode',
      field: 'mode',
      prompt: 'Choose online, in-person, or both',
      link: '/settings',
    },
  ]

  return items.filter((item) => {
    if (item.field === 'skills') {
      const isSkillsOffered = item.prompt.includes('teach')
      return isSkillsOffered ? profile.skillsOffered.length === 0 : profile.skillsWanted.length === 0
    }
    const value = profile[item.field as keyof UserProfile]
    if (Array.isArray(value)) return value.length === 0
    return !value
  })
}
