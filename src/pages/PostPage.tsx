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
import type { LearningMode, SkillCategory } from '@/types'
import { formatRelativeTime } from '@/utils/app'

interface PostFormState {
  skillName: string
  category: SkillCategory
  note: string
  mode: LearningMode
}

export function PostPage() {
  const { createPost, currentUser, state } = useApp()
  const [form, setForm] = useState<PostFormState>({
    skillName: '',
    category: 'Tech',
    note: '',
    mode: 'Online',
  })

  const posts = [...state.posts].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-panel p-6">
          <SectionTitle
            description="Create a lightweight post when you want help with one specific skill outside a direct reciprocal match."
            eyebrow="Community Board"
          >
            Looking for post
          </SectionTitle>
          {currentUser ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                createPost(form)
                setForm({
                  skillName: '',
                  category: form.category,
                  note: '',
                  mode: form.mode,
                })
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
              <Button fullWidth size="lg" type="submit">
                Publish post
              </Button>
            </form>
          ) : (
            <div className="mt-6">
              <EmptyState
                title="Sign in to publish a post"
                description="The board is public, but creating a request requires a profile."
                action={
                  <ButtonLink to="/auth">Join SkillBridge</ButtonLink>
                }
              />
            </div>
          )}
        </section>

        <section className="space-y-4">
          <SectionTitle
            description="A running notice board of members looking for focused help."
            eyebrow="Live Board"
          >
            Current requests
          </SectionTitle>
          {posts.length ? (
            posts.map((post) => {
              const author = state.users.find((user) => user.id === post.userId)
              return (
                <div className="glass-panel p-5" key={post.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <img alt={author?.name} className="size-12 rounded-3xl object-cover" src={author?.photo} />
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">{author?.name}</p>
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
                    {author ? (
                      <Link className="font-semibold text-brand-600 dark:text-brand-300" to={`/profile/${author.username}`}>
                        View profile
                      </Link>
                    ) : null}
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyState
              title="No board posts yet"
              description="Create the first looking-for post to kick off the notice board."
            />
          )}
        </section>
      </div>
    </PageTransition>
  )
}
