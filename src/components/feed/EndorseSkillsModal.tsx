import { useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/common/Button'
import { SkillChip } from '@/components/common/SkillChip'
import { Avatar } from '@/components/common/Avatar'
import { supabase } from '@/lib/supabase'
import type { SkillEntry, SwapRequest, UserProfile } from '@/types'

interface EndorseSkillsModalProps {
  isOpen: boolean
  onClose: () => void
  swap: SwapRequest
  partner: UserProfile  
  currentUserId: string
  onEndorsed: () => void
}

export function EndorseSkillsModal({
  isOpen,
  onClose,
  swap,
  partner,
  currentUserId,
  onEndorsed,
}: EndorseSkillsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const endorsableSkills: SkillEntry[] = partner.skillsOffered

  function toggle(skillName: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(skillName)) {
        next.delete(skillName)
      } else {
        next.add(skillName)
      }
      return next
    })
  }

  async function handleSubmit() {
    if (selected.size === 0) {
      toast.error('Select at least one skill to endorse.')
      return
    }

    if (!supabase) {
      toast.error('Supabase is not configured.')
      return
    }

    setSaving(true)
    try {
      const rows = Array.from(selected).map((skillName) => ({
        endorser_id: currentUserId,
        endorsed_user_id: partner.id,
        swap_request_id: swap.id,
        skill_name: skillName,
      }))

      const { error } = await supabase
        .from('skill_endorsements')
        .upsert(rows, { onConflict: 'endorser_id,endorsed_user_id,skill_name' })

      if (error) {
        toast.error('Failed to save endorsements.')
        return
      }

      toast.success(`Endorsed ${selected.size} skill${selected.size > 1 ? 's' : ''} for ${partner.name}!`)
      onEndorsed()
      onClose()
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
        
       <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Avatar
                fullName={partner.name}
                avatarUrl={partner.photo}
                size="md"
              />
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Endorse {partner.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Which skills did they demonstrate?
                </p>
              </div>
            </div>
          </div>
          <button
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {endorsableSkills.length > 0 ? (
            endorsableSkills.map((skill) => {
              const isSelected = selected.has(skill.name)
              return (
                <button
                  className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-brand-400 bg-brand-50 dark:border-brand-400/40 dark:bg-brand-500/10'
                      : 'border-slate-200 bg-white hover:border-brand-200 dark:border-slate-700 dark:bg-slate-900/80'
                  }`}
                  key={skill.id}
                  onClick={() => toggle(skill.name)}
                  type="button"
                >
                  <SkillChip skill={skill} />
                  <div className={`ml-3 shrink-0 transition-all ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                    <CheckCircle2 className="size-5 text-brand-600 dark:text-brand-300" />
                  </div>
                </button>
              )
            })
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No skills to endorse for this swap.
            </p>
          )}
        </div>

        {selected.size > 0 ? (
          <p className="mt-3 text-xs text-brand-600 dark:text-brand-300">
            {selected.size} skill{selected.size > 1 ? 's' : ''} selected
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button
            className="flex-1"
            disabled={saving || selected.size === 0}
            onClick={handleSubmit}
          >
            {saving ? 'Saving...' : `Endorse ${selected.size > 0 ? `(${selected.size})` : ''}`}
          </Button>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
