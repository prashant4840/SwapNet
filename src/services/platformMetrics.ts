import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface PlatformMetrics {
  averageRating: number
  completedSwaps: number
  trackedSkills: number
}

// Memory cache for metrics
let cachedMetrics: PlatformMetrics | null = null

export async function fetchPlatformMetrics(): Promise<PlatformMetrics> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured')
  }

  // Fetch only from the platform_metrics view as preferred
  const { data, error } = await supabase
    .from('platform_metrics')
    .select('average_rating, completed_swaps, tracked_skills')
    .single()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('No metrics data returned')
  }

  const metrics: PlatformMetrics = {
    averageRating: Number(data.average_rating) || 0.0,
    completedSwaps: Number(data.completed_swaps) || 0,
    trackedSkills: Number(data.tracked_skills) || 0,
  }

  cachedMetrics = metrics
  return metrics
}

export function getCachedMetrics(): PlatformMetrics | null {
  return cachedMetrics
}

export function subscribeToMetricsChanges(onUpdate: (metrics: PlatformMetrics) => void) {
  if (!isSupabaseConfigured || !supabase) return () => {}

  const client = supabase
  // Subscribe to changes in reviews, swap_requests, skills_offered, and skills_wanted
  const channel = client
    .channel('platform-metrics-realtime')
    // 1. Reviews inserts / updates / deletes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reviews' },
      async () => {
        try {
          const updated = await fetchPlatformMetrics()
          onUpdate(updated)
        } catch (e) {
          console.error('Failed to update realtime metrics for reviews:', e)
        }
      }
    )
    // 2. Swap requests updates (for status completed)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'swap_requests' },
      async () => {
        try {
          const updated = await fetchPlatformMetrics()
          onUpdate(updated)
        } catch (e) {
          console.error('Failed to update realtime metrics for swap_requests:', e)
        }
      }
    )
    // 3. Skills offered added / removed
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'skills_offered' },
      async () => {
        try {
          const updated = await fetchPlatformMetrics()
          onUpdate(updated)
        } catch (e) {
          console.error('Failed to update realtime metrics for skills_offered:', e)
        }
      }
    )
    // 4. Skills wanted added / removed
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'skills_wanted' },
      async () => {
        try {
          const updated = await fetchPlatformMetrics()
          onUpdate(updated)
        } catch (e) {
          console.error('Failed to update realtime metrics for skills_wanted:', e)
        }
      }
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}
