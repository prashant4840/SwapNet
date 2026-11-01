import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cleanId } from '@/utils/app'

export interface EndorsementCount {
  skillName: string
  count: number
}

export function useEndorsements(userId: string | undefined) {
  const [endorsements, setEndorsements] = useState<EndorsementCount[]>([])

  useEffect(() => {
    if (!userId || !supabase) return

    async function loadEndorsements() {
      const client = supabase

      if (!client || !userId) return

      const { data, error } = await client
        .from('skill_endorsements')
        .select('skill_name')
        .eq('endorsed_user_id', cleanId(userId))

      if (error || !data) {
        return
      }

      // Count endorsements per skill
      const counts = data.reduce<Record<string, number>>((acc, row) => {
        acc[row.skill_name] = (acc[row.skill_name] ?? 0) + 1
        return acc
      }, {})

      setEndorsements(
        Object.entries(counts).map(([skillName, count]) => ({ skillName, count })),
      )
    }

    loadEndorsements()
  }, [userId])

  function getCount(skillName: string) {
    return endorsements.find((e) => e.skillName === skillName)?.count ?? 0
  }

  function isVerified(skillName: string) {
    return getCount(skillName) >= 1
  }

  return { endorsements, getCount, isVerified }
}

