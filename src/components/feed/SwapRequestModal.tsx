import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SkillChip } from '@/components/common/SkillChip'
import { useApp } from '@/context/AppContext'
import type { UserProfile } from '@/types'

interface SwapRequestModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null
}

function getInitialSwapRequestState(
  currentUser: ReturnType<typeof useApp>['currentUser'],
  user: UserProfile | null,
) {
  if (!currentUser || !user) {
    return {
      offeredSkillId: '',
      wantedSkillId: '',
      message: '',
    }
  }

  const defaultOffered =
    currentUser.skillsOffered.find((skill) =>
      user.skillsWanted.some((wanted) => wanted.name === skill.name),
    ) ?? currentUser.skillsOffered[0]
  const defaultWanted =
    currentUser.skillsWanted.find((skill) =>
      user.skillsOffered.some((offered) => offered.name === skill.name),
    ) ?? currentUser.skillsWanted[0]

  return {
    offeredSkillId: defaultOffered?.id ?? '',
    wantedSkillId: defaultWanted?.id ?? '',
    message: `Hi ${user.name.split(' ')[0]}, I can teach ${defaultOffered?.name ?? 'a skill'} and would love to learn ${defaultWanted?.name ?? 'from you'}.`,
  }
}

export function SwapRequestModal({
  isOpen,
  onClose,
  user,
}: SwapRequestModalProps) {
  const { currentUser, sendSwapRequest } = useApp()
  const initialState = getInitialSwapRequestState(currentUser, user)
  const [message, setMessage] = useState(initialState.message)
  const [offeredSkillId, setOfferedSkillId] = useState(initialState.offeredSkillId)
  const [wantedSkillId, setWantedSkillId] = useState(initialState.wantedSkillId)
  const [sending, setSending] = useState(false)

  if (!isOpen || !user) {
    return null
  }

  if (!currentUser || !currentUser.skillsOffered.length || !currentUser.skillsWanted.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
        <div className="glass-panel max-w-lg space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                Complete your profile first
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Add at least one offered skill and one wanted skill before sending requests.
              </p>
            </div>
            <button className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} type="button">
              <X className="size-4" />
            </button>
          </div>
          <Button fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    )
  }

  const selectedOffered = currentUser.skillsOffered.find((skill) => skill.id === offeredSkillId)
  const selectedWanted = currentUser.skillsWanted.find((skill) => skill.id === wantedSkillId)

  async function handleSend() {
    setSending(true)
    const didSend = await sendSwapRequest({
      receiverId: user!.id,
      message,
      offeredSkillId,
      wantedSkillId,
    })
    setSending(false)
    if (didSend) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-xl space-y-6 p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">
              New Swap Request
            </p>
            <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
              Trade skills with {user.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Choose the skill you can teach and what you want to learn in return.
            </p>
          </div>
          <button className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} type="button">
            <X className="size-4" />
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex flex-wrap gap-2">
            {user.skillsOffered.map((skill) => (
              <SkillChip key={skill.id} skill={skill} />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            I can teach
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              onChange={(event) => setOfferedSkillId(event.target.value)}
              value={offeredSkillId}
            >
              {currentUser.skillsOffered.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            I want to learn
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              onChange={(event) => setWantedSkillId(event.target.value)}
              value={wantedSkillId}
            >
              {currentUser.skillsWanted.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedOffered && selectedWanted ? (
          <div className="rounded-3xl bg-slate-100/80 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
            You teach <strong>{selectedOffered.name}</strong> and want to learn{' '}
            <strong>{selectedWanted.name}</strong>.
          </div>
        ) : null}

        <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          Intro message
          <textarea
            className="min-h-32 w-full rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tell them how you'd like to exchange skills."
            value={message}
          />
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={sending} onClick={handleSend}>
            {sending ? 'Sending...' : 'Send request'}
          </Button>
        </div>
      </div>
    </div>
  )
}
