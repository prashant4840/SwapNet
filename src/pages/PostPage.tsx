import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ButtonLink } from '@/components/common/ButtonLink'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { useApp } from '@/context/AppContext'
import { skillCategories } from '@/data/skills'
import type { LearningMode, SkillCategory, LookingForPost, UserProfile } from '@/types'
import { formatRelativeTime } from '@/utils/app'
import { useDocumentMetadata } from '@/hooks/useDocumentMetadata'

interface PostFormState {
  skillName: string
  category: SkillCategory
  note: string
  mode: LearningMode
}

export function PostPage() {
  useDocumentMetadata({
    title: 'Community Board',
    description: 'Post skills you want to learn or offers to teach on SwapNet. Connect with local and online community members.',
  })
  // FIX 7: added `loading` from useApp so the posts panel uses
  // the context's loading flag, not the form's isSubmitting flag.
  const { createPost, currentUser, state, loading } = useApp()

  const [form, setForm] = useState<PostFormState>({
    skillName: '',
    category: 'Tech',
    note: '',
    mode: 'Online',
  })

  // FIX 7: renamed from isLoading → isSubmitting so it only
  // controls the form submit button, not the posts list.
  const [isSubmitting, setIsSubmitting] = useState(false)

  const posts = state.posts

  const getPostAuthor = (post: LookingForPost) => {
    return (
      state.users.find((user: UserProfile) => user.id === post.userId) || {
        name: 'Anonymous',
        photo: '',
        username: '',
      }
    )
  }

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        {/* ── Left: post creation form ── */}
        <section className="glass-panel p-6">
          <SectionTitle
            description="Post a request when you need help with a specific skill."
            eyebrow="Community Board"
          >
            New post
          </SectionTitle>

          {currentUser ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!currentUser) return

                try {
                  // FIX 7: use isSubmitting, not isLoading
                  setIsSubmitting(true)
                  const didCreate = await createPost({
                    skillName: form.skillName,
                    category: form.category,
                    note: form.note,
                    mode: form.mode,
                  })

                  if (didCreate) {
                    setForm({
                      skillName: '',
                      category: form.category,
                      note: '',
                      mode: form.mode,
                    })
                  }
                } catch (error) {
                  console.error('Failed to create post:', error)
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Skill
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, skillName: event.target.value }))
                  }
                  placeholder="Example: Public Speaking"
                  required
                  value={form.skillName}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Category
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/80"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value as SkillCategory,
                      }))
                    }
                    value={form.category}
                  >
                    {skillCategories.map((category) => (
                      <option key={category.category} value={category.category}>
                        {category.category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Preferred mode
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/80"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        mode: event.target.value as 'Online' | 'In-person' | 'Both',
                      }))
                    }
                    value={form.mode}
                  >
                    <option value="Online">Online</option>
                    <option value="In-person">In-person</option>
                    <option value="Both">Both</option>
                  </select>
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                What are you looking for?
                <textarea
                  className="min-h-32 w-full rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, note: event.target.value }))
                  }
                  placeholder="Explain what kind of help would make this swap valuable."
                  required
                  value={form.note}
                />
              </label>

              {/* FIX 7 + FIX 8: use isSubmitting; fixed spinner (CSS border, not broken SVG) */}
              <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
                {isSubmitting ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Publishing...
                  </>
                ) : (
                  'Publish post'
                )}
              </Button>
            </form>
          ) : (
            <div className="mt-6">
              <EmptyState
                title="Sign in to publish a post"
                description="The board is public, but creating a request requires a profile."
                action={<ButtonLink to="/auth">Join SwapNet</ButtonLink>}
              />
            </div>
          )}
        </section>

        {/* ── Right: live posts list ── */}
        <section className="space-y-4">
          <SectionTitle
            description="Members looking for focused skill help right now."
            eyebrow="Live Board"
          >
            Recent requests
          </SectionTitle>

          {/* FIX 7: use `loading` (from useApp) here, NOT isSubmitting */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                Loading posts...
              </span>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post: LookingForPost) => {
              const author = getPostAuthor(post)
              return (
                <div className="glass-panel p-5" key={post.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        alt={author.name}
                        className="size-12 rounded-3xl object-cover"
                        src={author.photo}
                      />
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {author.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                          {post.city} • {formatRelativeTime(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="teal">{post.skillName}</Badge>
                      <Badge tone="slate">{post.mode}</Badge>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {post.note}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
                    <span>{post.responses} interested replies</span>
                    {author.username ? (
                      <Link
                        className="font-semibold text-brand-600 dark:text-brand-300"
                        to={`/profile/${author.username}`}
                      >
                        View profile
                      </Link>
                    ) : null}
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyState
              title="No posts yet — be the first to ask"
              description="Create the first looking-for post to kick off the community board."
            />
          )}
        </section>
      </div>
    </PageTransition>
  )
}
