import { format, formatDistanceToNowStrict, isToday } from 'date-fns'
import type {
  AppState,
  MatchResult,
  Review,
  SkillCategory,
  SkillEntry,
  SwapRequest,
  UserProfile,
} from '@/types'

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatRelativeTime(value: string) {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true })
}

export function formatShortDate(value: string) {
  return format(new Date(value), 'MMM d')
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

export function computeMatchResult(
  currentUser: UserProfile | null | undefined,
  otherUser: UserProfile,
) {
  if (!currentUser || currentUser.id === otherUser.id) {
    const baseline = Math.min(
      96,
      Math.round(profileCompletion(otherUser) * 0.5 + otherUser.rating * 10 + 10),
    )

    return {
      score: baseline,
      isPerfect: false,
      matchesOffering: [],
      matchesLearning: [],
    } satisfies MatchResult
  }

  const currentOffers = skillNameList(currentUser.skillsOffered)
  const currentWants = skillNameList(currentUser.skillsWanted)
  const matchesOffering = otherUser.skillsOffered
    .filter((skill) => currentWants.includes(normalizeSkillName(skill.name)))
    .map((skill) => skill.name)
  const matchesLearning = otherUser.skillsWanted
    .filter((skill) => currentOffers.includes(normalizeSkillName(skill.name)))
    .map((skill) => skill.name)

  const sameCity = currentUser.city === otherUser.city ? 10 : 0
  const modeBonus =
    currentUser.mode === otherUser.mode ||
    currentUser.mode === 'Both' ||
    otherUser.mode === 'Both'
      ? 10
      : 4
  const availabilityBonus = currentUser.availability.some((slot) =>
    otherUser.availability.includes(slot),
  )
    ? 10
    : 0

  const score = Math.min(
    100,
    matchesOffering.length * 32 +
      matchesLearning.length * 32 +
      sameCity +
      modeBonus +
      availabilityBonus,
  )

  return {
    score: Math.max(score, 18),
    isPerfect: matchesOffering.length > 0 && matchesLearning.length > 0,
    matchesOffering,
    matchesLearning,
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

    return {
      ...user,
      rating,
      reviewCount: userReviews.length,
      completedSwaps: completed.length,
      taughtCount: completed.length,
      learnedCount: completed.length,
      swapScore: Math.min(
        100,
        Math.round(
          rating * 18 +
            completed.length * 9 +
            profileCompletion(user) * 0.22 -
            user.reports * 6,
        ),
      ),
    }
  })
}

export function hydrateState(state: AppState) {
  return {
    ...state,
    users: deriveProfileMetrics(state.users, state.swapRequests, state.reviews),
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
