import { useState } from 'react'
import { Flag, MapPin, Share2, UserRoundPen } from 'lucide-react'
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

export function ProfilePage() {
  const { username = '' } = useParams()
  const {
    currentUser,
    getReviewsForUser,
    getUserByUsername,
    reportUser,
    state,
  } = useApp()
  const { shareProfile } = useShareProfile(username)
  const [isModalOpen, setModalOpen] = useState(false)
  const user = getUserByUsername(username)
  const reviews = getReviewsForUser(user?.id ?? '')
  const posts = state.posts.filter((post) => post.userId === user?.id)
  const match = user ? computeMatchResult(currentUser, user) : null
  const shareUrl = buildShareUrl(username)

  if (!user) {
    return (
      <PageTransition>
        <EmptyState
          title="Profile not found"
          description="That SkillBridge profile does not exist or may have been renamed."
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
        `Check out ${user.name}'s SkillBridge profile`,
      )}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(
        `Check out ${user.name}'s SkillBridge profile: ${shareUrl}`,
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
              { label: 'Overall rating', value: user.rating.toFixed(1), sublabel: `${user.reviewCount} reviews` },
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
                      <SkillChip key={skill.id} skill={skill} />
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
                Community feedback
              </SectionTitle>
              {reviews.length ? (
                <div className="mt-6 space-y-4">
                  {reviews.map((review) => {
                    const author = state.users.find((entry) => entry.id === review.reviewerId)
                    return (
                      <div
                        className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80"
                        key={review.id}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              alt={author?.name ?? 'Reviewer'}
                              className="size-10 rounded-2xl object-cover"
                              src={author?.photo}
                            />
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-white">
                                {author?.name}
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
                    )
                  })}
                </div>
              ) : (
                <div className="mt-6">
                  <EmptyState
                    title="No public reviews yet"
                    description="Complete a swap with this member to leave the first review."
                  />
                </div>
              )}
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
                  <Button onClick={() => reportUser(user.id)} variant="ghost">
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
