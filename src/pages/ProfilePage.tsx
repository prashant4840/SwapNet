import { useEndorsements } from '@/hooks/useEndorsements'
import { BadgeCheck } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { useDocumentMetadata } from '@/hooks/useDocumentMetadata'
import { Flag, MapPin, Share2, UserRoundPen, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ButtonLink } from '@/components/common/ButtonLink'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { RatingStars } from '@/components/common/RatingStars'
import { SectionTitle } from '@/components/common/SectionTitle'
import { SkillChip } from '@/components/common/SkillChip'
import { SwapRequestModal } from '@/components/feed/SwapRequestModal'
import { useApp, useShareProfile } from '@/context/AppContext'
import { buildShareUrl, computeMatchResult, formatRelativeTime } from '@/utils/app'
import type { Review } from '@/types'

function SkeletonProfileHeader() {
  return (
    <section className="glass-panel overflow-hidden">
      <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-tealish-500 px-6 py-10 text-white sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="size-28 rounded-[2rem] bg-white/20 animate-pulse" />
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
                <div className="h-6 w-24 bg-white/20 rounded-full animate-pulse" />
              </div>
              <div className="h-5 w-3/4 bg-white/20 rounded animate-pulse" />
              <div className="flex gap-4">
                <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-16 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProfilePage() {
  const { username = '' } = useParams()
  const {
    currentUser,
    getReviewsForUser,
    getUserByUsername,
    loading,
    reportUser,
    state,
  } = useApp()
  const { shareProfile } = useShareProfile(username)
  const [isModalOpen, setModalOpen] = useState(false)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [reviewsWithAuthors, setReviewsWithAuthors] = useState<(Review & { reviewer: { name: string; photo: string } })[]>([])
  const user = getUserByUsername(username)
  
  useDocumentMetadata({
    title: user ? `${user.name} (@${user.username}) - Skill Share Profile` : 'Member Profile',
    description: user ? `${user.name} offers skill swaps in ${user.skillsOffered.map((s) => s.name).join(', ') || 'various areas'}. Learn and share skills on SwapNet.` : 'View member skills and completed swaps on SwapNet.',
    ogType: 'profile',
  })

  const { isVerified, getCount } = useEndorsements(user?.id)
  const posts = state.posts.filter((post) => post.userId === user?.id)
  const match = useMemo(
    () => (user && currentUser ? computeMatchResult(currentUser, user) : null),
    [user, currentUser],
  )
  const shareUrl = buildShareUrl(username)
  useEffect(() => {
    if (user && !loading) {
      const fetchReviewsWithAuthors = async () => {
        setIsLoadingReviews(true)
        try {
          const { supabase } = await import('@/lib/supabase')
          if (!supabase) return
          
          const reviews = getReviewsForUser(user.id)
          
          if (reviews.length > 0) {
            // Fetch reviewer details from public.users
            const reviewerIds = [...new Set(reviews.map(r => r.reviewerId))]
            const { data: reviewers, error: reviewersError } = await supabase
              .from('users')
              .select('id, name, photo')
              .in('id', reviewerIds)

            if (reviewersError) {
              throw reviewersError
            }

            const reviewsWithData = reviews.map(review => ({
              ...review,
              reviewer: reviewers?.find(r => r.id === review.reviewerId) || { name: 'Anonymous', photo: '' }
            }))
            
            setReviewsWithAuthors(reviewsWithData)
          } else {
            setReviewsWithAuthors([])
          }
        } catch (error) {
          console.error('Failed to fetch reviews:', error)
          toast.error('Failed to load profile reviews.')
          setReviewsWithAuthors([])
        } finally {
          setIsLoadingReviews(false)
        }
      }
      
      fetchReviewsWithAuthors()
    }
  }, [user, loading, getReviewsForUser])
  
  // Calculate real average rating
  const averageRating = reviewsWithAuthors.length > 0 
    ? reviewsWithAuthors.reduce((sum, review) => sum + review.rating, 0) / reviewsWithAuthors.length
    : 0

  if (loading) {
    return (
      <PageTransition>
        <SkeletonProfileHeader />
      </PageTransition>
    )
  }

  if (!user) {
    return (
      <PageTransition>
        <EmptyState
          title="Profile not found"
          description="That SwapNet profile does not exist or may have been renamed."
          action={
            <ButtonLink to="/explore" variant="outline">
              Back to explore
            </ButtonLink>
          }
        />
      </PageTransition>
    )
  }

  const isOwnProfile = currentUser?.id === user.id
  const socialLinks = [
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Check out ${user.name}'s SwapNet profile`,
      )}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(
        `Check out ${user.name}'s SwapNet profile: ${shareUrl}`,
      )}`,
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-8">
        <section className="glass-panel overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-tealish-500 px-6 py-10 text-white sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <img alt={user.name} className="size-28 rounded-[2rem] object-cover ring-4 ring-white/30" src={user.photo} />
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight">{user.name}</h1>
                    {match?.isPerfect ? <Badge tone="teal">Perfect Match 🎯</Badge> : null}
                    {user.badges.map((badge) => (
                      <Badge className="bg-white/15 text-white" key={badge}>
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <p className="max-w-2xl text-base text-white/85">{user.headline}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-4" />
                      {user.city}
                    </span>
                    <span>{user.mode}</span>
                    <span>Joined {formatRelativeTime(user.joinedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {isOwnProfile ? (
                  <ButtonLink className="bg-white text-slate-950 hover:bg-slate-100" size="lg" to="/settings">
                    <UserRoundPen className="size-4" />
                    Edit profile
                  </ButtonLink>
                ) : currentUser ? (
                  <Button className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => setModalOpen(true)} size="lg">
                    Request swap
                  </Button>
                ) : (
                  <ButtonLink className="bg-white text-slate-950 hover:bg-slate-100" size="lg" to="/auth">
                    Join to connect
                  </ButtonLink>
                )}

                <Button className="border-white/35 text-white hover:bg-white/10" onClick={shareProfile} size="lg" variant="outline">
                  <Share2 className="size-4" />
                  Share profile
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Overall rating', value: averageRating.toFixed(1), sublabel: `${reviewsWithAuthors.length} reviews` },
              { label: 'Swap score', value: `${user.swapScore}`, sublabel: 'Reputation metric' },
              { label: 'Completed swaps', value: `${user.completedSwaps}`, sublabel: 'Finished exchanges' },
              { label: 'Availability', value: user.availability.join(', '), sublabel: user.mode },
            ].map((stat) => (
              <div className="rounded-3xl bg-slate-100/80 p-5 dark:bg-slate-800/80" key={stat.label}>
                <p className="text-sm text-slate-500 dark:text-slate-300">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <SectionTitle
                description="What this member can offer the community and what they want to learn next."
                eyebrow="Skill Map"
              >
                Offers ↔ Wants
              </SectionTitle>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Skills offered
                  </p>
                  <div className="flex flex-wrap gap-2">


                  {user.skillsOffered.map((skill) => (
  <div key={skill.id} className="inline-flex items-center gap-1">
    <SkillChip skill={skill} />

    {isVerified(skill.name) ? (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        title={`Verified by ${getCount(skill.name)} swap partner${getCount(skill.name) > 1 ? 's' : ''}`}
      >
        <BadgeCheck className="size-3" />
        {getCount(skill.name)}
      </span>
    ) : null}
  </div>
))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Skills wanted
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.skillsWanted.map((skill) => (
                      <SkillChip key={skill.id} skill={skill} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6">
              <SectionTitle
                description="Public reviews left after completed swaps."
                eyebrow="Ratings & Reviews"
              >
                {isLoadingReviews ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading reviews...</span>
                  </div>
                ) : reviewsWithAuthors.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {reviewsWithAuthors.map((review) => (
                      <div
                        className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80"
                        key={review.id}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              alt={review.reviewer.name}
                              className="size-10 rounded-2xl object-cover"
                              src={review.reviewer.photo}
                            />
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-white">
                                {review.reviewer.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-300">
                                {formatRelativeTime(review.createdAt)}
                              </p>
                            </div>
                          </div>
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6">
                    <EmptyState
                      title="No reviews yet"
                      description="Complete a swap with this member to leave the first review."
                    />
                  </div>
                )}
              </SectionTitle>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6">
              <SectionTitle
                description="Why this member might be worth reaching out to."
                eyebrow="At a glance"
              >
                Match overview
              </SectionTitle>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-slate-100/80 p-5 dark:bg-slate-800/80">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Compatibility score
                    </p>
                    <Badge tone={match && match.score >= 80 ? 'teal' : 'brand'}>
                      {match?.score ?? 0}%
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {match?.isPerfect
                      ? 'Your teach/learn preferences overlap in both directions.'
                      : 'A strong profile based on current skills, rating, and availability.'}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-100/80 p-5 dark:bg-slate-800/80">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Bio</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {user.bio}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6">
              <SectionTitle
                description="Share this member publicly or flag abuse if needed."
                eyebrow="Community Actions"
              >
                Share and safety
              </SectionTitle>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={shareProfile} variant="outline">
                  <Share2 className="size-4" />
                  Copy link
                </Button>
                {!isOwnProfile ? (
                  <Button
                    onClick={() => {
                      void reportUser(user.id)
                    }}
                    variant="ghost"
                  >
                    <Flag className="size-4" />
                    Report user
                  </Button>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <a className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200" href={link.href} key={link.label} rel="noreferrer" target="_blank">
                    Share on {link.label}
                  </a>
                ))}
              </div>
            </div>

            {posts.length ? (
              <div className="glass-panel p-6">
                <SectionTitle
                  description="What this member is actively looking for on the community board."
                  eyebrow="Notice Board"
                >
                  Looking for posts
                </SectionTitle>
                <div className="mt-6 space-y-4">
                  {posts.map((post) => (
                    <div className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80" key={post.id}>
                      <div className="flex items-center justify-between gap-3">
                        <Badge tone="teal">{post.skillName}</Badge>
                        <p className="text-sm text-slate-500 dark:text-slate-300">{post.city}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {post.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <SwapRequestModal
        isOpen={isModalOpen}
        key={user.id}
        onClose={() => setModalOpen(false)}
        user={user}
      />
    </PageTransition>
  )
}
