import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface EndorsementCount {
  skillName: string
  count: number
}

export function useEndorsements(userId: string | undefined) {
  const [endorsements, setEndorsements] = useState<EndorsementCount[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId || !supabase) return

    setLoading(true)

    supabase
      .from('skill_endorsements')
      .select('skill_name')
      .eq('endorsed_user_id', userId)
      .then(({ data, error }) => {
        if (error || !data) {
          setLoading(false)
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
        setLoading(false)
      })
  }, [userId])

  function getCount(skillName: string) {
    return endorsements.find((e) => e.skillName === skillName)?.count ?? 0
  }

  function isVerified(skillName: string) {
    return getCount(skillName) >= 1
  }

  return { endorsements, loading, getCount, isVerified }
}
