import { useState } from 'react'
import { Save, Sparkles, Trash2 } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { SkillChip } from '@/components/common/SkillChip'
import { useApp } from '@/context/AppContext'
import { modeOptions } from '@/data/seed'
import { skillCategories } from '@/data/skills'
import type { AvailabilitySlot, LearningMode, SkillCategory, SkillEntry } from '@/types'
import { createId, profileCompletion } from '@/utils/app'

const availabilityOptions: AvailabilitySlot[] = ['Weekdays', 'Weekends', 'Evenings']

interface DraftSkill {
  category: SkillCategory
  name: string
}

interface ProfileFormState {
  name: string
  city: string
  bio: string
  age: string
  photo: string
  headline: string
  availability: AvailabilitySlot[]
  mode: LearningMode
  skillsOffered: SkillEntry[]
  skillsWanted: SkillEntry[]
}

function buildFormState(currentUser: ReturnType<typeof useApp>['currentUser']) {
  if (!currentUser) {
    return {
      name: '',
      city: '',
      bio: '',
      age: '',
      photo: '',
      headline: '',
      availability: [] as AvailabilitySlot[],
      mode: 'Online' as LearningMode,
      skillsOffered: [] as SkillEntry[],
      skillsWanted: [] as SkillEntry[],
    } satisfies ProfileFormState
  }

  return {
    name: currentUser.name,
    city: currentUser.city,
    bio: currentUser.bio,
    age: currentUser.age ? String(currentUser.age) : '',
    photo: currentUser.photo,
    headline: currentUser.headline,
    availability: currentUser.availability,
    mode: currentUser.mode,
    skillsOffered: currentUser.skillsOffered,
    skillsWanted: currentUser.skillsWanted,
  } satisfies ProfileFormState
}

export function SettingsPage() {
  const { currentUser, resetDemoData, updateProfile } = useApp()
  const [draftOffered, setDraftOffered] = useState<DraftSkill>({
    category: 'Tech',
    name: '',
  })
  const [draftWanted, setDraftWanted] = useState<DraftSkill>({
    category: 'Music',
    name: '',
  })
  const [form, setForm] = useState<ProfileFormState>(() => buildFormState(currentUser))

  if (!currentUser) {
    return null
  }

  const previewProfile = {
    ...currentUser,
    ...form,
    age: form.age ? Number(form.age) : undefined,
  }
  const completion = profileCompletion(previewProfile)

  function addSkill(kind: 'skillsOffered' | 'skillsWanted', draft: DraftSkill) {
    const name = draft.name.trim()
    if (!name) {
      return
    }

    setForm((current) => ({
      ...current,
      [kind]: [
        ...current[kind],
        {
          id: createId('skill'),
          name,
          category: draft.category,
          level: kind === 'skillsOffered' ? 'Intermediate' : 'Beginner',
        },
      ],
    }))

    if (kind === 'skillsOffered') {
      setDraftOffered((current) => ({ ...current, name: '' }))
      return
    }

    setDraftWanted((current) => ({ ...current, name: '' }))
  }

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="glass-panel p-6">
          <SectionTitle
            description="Fill in your basics, add tags for what you offer and want, and choose how you prefer to swap."
            eyebrow="Profile Editor"
          >
            Shape your public profile
          </SectionTitle>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Profile completion
                </p>
                <Badge tone={completion >= 80 ? 'teal' : 'brand'}>{completion}%</Badge>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-tealish-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Name
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  value={form.name}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                City
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                  value={form.city}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Photo URL
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, photo: event.target.value }))
                  }
                  value={form.photo}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Age
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, age: event.target.value }))
                  }
                  placeholder="Optional"
                  type="number"
                  value={form.age}
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Headline
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
                onChange={(event) =>
                  setForm((current) => ({ ...current, headline: event.target.value }))
                }
                value={form.headline}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Bio
              <textarea
                className="min-h-28 w-full rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80"
                onChange={(event) =>
                  setForm((current) => ({ ...current, bio: event.target.value }))
                }
                value={form.bio}
              />
            </label>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Availability</p>
              <div className="flex flex-wrap gap-3">
                {availabilityOptions.map((item) => (
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      form.availability.includes(item)
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                    key={item}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        availability: current.availability.includes(item)
                          ? current.availability.filter((entry) => entry !== item)
                          : [...current.availability, item],
                      }))
                    }
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Mode</p>
              <div className="flex flex-wrap gap-3">
                {modeOptions.map((mode) => (
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      form.mode === mode
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                    key={mode}
                    onClick={() => setForm((current) => ({ ...current, mode }))}
                    type="button"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-900/70">
                <div>
                  <p className="text-lg font-semibold text-slate-950 dark:text-white">
                    Skills I offer
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    Add any teachable skill, category first.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                  <select
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    onChange={(event) =>
                      setDraftOffered((current) => ({
                        ...current,
                        category: event.target.value as SkillCategory,
                      }))
                    }
                    value={draftOffered.category}
                  >
                    {skillCategories.map((item) => (
                      <option key={item.category} value={item.category}>
                        {item.category}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                      onChange={(event) =>
                        setDraftOffered((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Guitar"
                      value={draftOffered.name}
                    />
                    <Button onClick={() => addSkill('skillsOffered', draftOffered)} type="button">
                      Add
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.skillsOffered.map((skill) => (
                    <SkillChip
                      key={skill.id}
                      onRemove={() =>
                        setForm((current) => ({
                          ...current,
                          skillsOffered: current.skillsOffered.filter((entry) => entry.id !== skill.id),
                        }))
                      }
                      removable
                      skill={skill}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-900/70">
                <div>
                  <p className="text-lg font-semibold text-slate-950 dark:text-white">
                    Skills I want
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    Add the next things you want to learn.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                  <select
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    onChange={(event) =>
                      setDraftWanted((current) => ({
                        ...current,
                        category: event.target.value as SkillCategory,
                      }))
                    }
                    value={draftWanted.category}
                  >
                    {skillCategories.map((item) => (
                      <option key={item.category} value={item.category}>
                        {item.category}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                      onChange={(event) =>
                        setDraftWanted((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Python"
                      value={draftWanted.name}
                    />
                    <Button onClick={() => addSkill('skillsWanted', draftWanted)} type="button">
                      Add
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.skillsWanted.map((skill) => (
                    <SkillChip
                      key={skill.id}
                      onRemove={() =>
                        setForm((current) => ({
                          ...current,
                          skillsWanted: current.skillsWanted.filter((entry) => entry.id !== skill.id),
                        }))
                      }
                      removable
                      skill={skill}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                onClick={() =>
                  updateProfile({
                    name: form.name,
                    city: form.city,
                    bio: form.bio,
                    age: form.age ? Number(form.age) : undefined,
                    photo: form.photo,
                    headline: form.headline,
                    availability: form.availability,
                    mode: form.mode,
                    skillsOffered: form.skillsOffered,
                    skillsWanted: form.skillsWanted,
                  })
                }
                size="lg"
              >
                <Save className="size-4" />
                Save profile
              </Button>
              <Button onClick={resetDemoData} size="lg" variant="ghost">
                <Trash2 className="size-4" />
                Reset demo data
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="glass-panel p-6">
            <SectionTitle
              description="This is how your public profile card reads in the feed."
              eyebrow="Live Preview"
            >
              Profile preview
            </SectionTitle>

            <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-500 to-tealish-500 p-6 text-white">
              <div className="flex items-center gap-4">
                <img alt={form.name} className="size-20 rounded-[2rem] object-cover ring-4 ring-white/20" src={form.photo} />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{form.name}</h2>
                    <Badge className="bg-white/15 text-white">Ready to swap</Badge>
                  </div>
                  <p className="mt-1 text-white/80">{form.city}</p>
                  <p className="mt-2 max-w-sm text-sm text-white/90">{form.headline}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/90">{form.bio}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Teaching now
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.skillsOffered.length ? (
                    form.skillsOffered.map((skill) => <SkillChip key={skill.id} skill={skill} />)
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-300">Add your first offered skill.</p>
                  )}
                </div>
              </div>
              <div className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Learning next
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.skillsWanted.length ? (
                    form.skillsWanted.map((skill) => <SkillChip key={skill.id} skill={skill} />)
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-300">Add your first wanted skill.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-dashed border-brand-300 bg-brand-50/70 px-4 py-4 text-sm text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200">
              <Sparkles className="mr-2 inline-flex size-4" />
              Members with full profiles receive stronger match scores and better daily suggestions.
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
