/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type PropsWithChildren } from 'react'
import toast from 'react-hot-toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { LookingForPost, SkillCategory } from '@/types'

interface PostContextValue {
  posts: LookingForPost[]
  hasMore: boolean
  loadingMore: boolean
  loadMorePosts: () => Promise<void>
  createPost: (
    payload: Pick<LookingForPost, 'skillName' | 'category' | 'note' | 'mode'>
  ) => Promise<boolean>
}

const PostContext = createContext<PostContextValue | undefined>(undefined)

import { getSeedState } from '@/data/seed'
import { useEffect } from 'react'

interface PostProviderProps extends PropsWithChildren {
  posts?: LookingForPost[]
  onPostsUpdate?: (posts: LookingForPost[]) => void
  currentUserId?: string | null
}

export function PostProvider({
  children,
  posts: initialPosts = [],
  onPostsUpdate,
  currentUserId,
}: PostProviderProps) {
  const [posts, setPosts] = useState<LookingForPost[]>(() => {
    if (initialPosts.length > 0) return initialPosts
    if (!isSupabaseConfigured) {
      return getSeedState().posts
    }
    return []
  })
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMorePosts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const start = posts.length
      const end = start + 9 // Load 10 posts per load
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = data.map((p) => ({
          id: p.id,
          userId: p.user_id,
          skillName: p.skill_name,
          category: p.category as SkillCategory,
          note: p.note,
          city: p.city || '',
          mode: p.mode as 'Online' | 'In-person' | 'Both',
          createdAt: p.created_at,
          responses: p.responses || 0,
        }))

        setPosts((current) => {
          const existingIds = new Set(current.map((item) => item.id))
          const filtered = mapped.filter((item) => !existingIds.has(item.id))
          const updated = [...current, ...filtered]
          onPostsUpdate?.(updated)
          return updated
        })

        if (data.length < 10) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more posts:', err)
      void import('@/services/errorTracking').then((m) =>
        m.captureException(err, { context: 'loadMorePosts' })
      )
    } finally {
      setLoadingMore(false)
    }
  }, [posts.length, hasMore, loadingMore, onPostsUpdate])

  useEffect(() => {
    if (initialPosts.length > 0) {
      setPosts(initialPosts)
      setHasMore(false)
      return
    }

    if (!isSupabaseConfigured || !supabase) return

    const loadPosts = async () => {
      try {
        const { data, error } = await supabase!
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .range(0, 9) // Load initial 10 posts

        if (error) throw error

        if (data) {
          const mapped = data.map(
            (p: {
              id: string
              user_id: string
              skill_name: string
              category: SkillCategory
              note: string
              city: string | null
              mode: 'Online' | 'In-person' | 'Both'
              created_at: string
              responses: number | null
            }) => ({
              id: p.id,
              userId: p.user_id,
              skillName: p.skill_name,
              category: p.category,
              note: p.note,
              city: p.city || '',
              mode: p.mode,
              createdAt: p.created_at,
              responses: p.responses || 0,
            })
          )
          setPosts(mapped)
          onPostsUpdate?.(mapped)
          if (data.length < 10) {
            setHasMore(false)
          }
        }
      } catch (error) {
        console.error('Failed to load posts from database:', error)
        void import('@/services/errorTracking').then((m) =>
          m.captureException(error, { context: 'loadPostsFirstPage' })
        )
      }
    }

    loadPosts()
  }, [initialPosts, onPostsUpdate])

  const createPost = useCallback(
    async (payload: Pick<LookingForPost, 'skillName' | 'category' | 'note' | 'mode'>) => {
      if (!currentUserId) {
        toast.error('Log in to create a post.')
        return false
      }

      if (!isSupabaseConfigured || !supabase) {
        toast.error('Supabase is not configured.')
        return false
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .insert({
            user_id: currentUserId,
            skill_name: payload.skillName.trim(),
            category: payload.category,
            note: payload.note.trim(),
            mode: payload.mode,
          })
          .select()
          .single()

        if (error || !data) throw new Error('Failed to create post')

        const newPost: LookingForPost = {
          id: data.id as string,
          userId: data.user_id as string,
          skillName: data.skill_name as string,
          category: data.category as SkillCategory,
          note: data.note as string,
          city: (data.city || '') as string,
          mode: data.mode as 'Online' | 'In-person' | 'Both',
          createdAt: data.created_at as string,
          responses: (data.responses || 0) as number,
        }

        const updatedPosts = [newPost, ...posts]
        setPosts(updatedPosts)
        onPostsUpdate?.(updatedPosts)

        toast.success('Community post published.')
        return true
      } catch (error) {
        console.error('Failed to create post:', error)
        void import('@/services/errorTracking').then((m) =>
          m.captureException(error, { context: 'createPost' })
        )
        toast.error('Failed to publish post.')
        return false
      }
    },
    [currentUserId, posts, onPostsUpdate]
  )

  return (
    <PostContext.Provider
      value={{
        posts,
        hasMore,
        loadingMore,
        loadMorePosts,
        createPost,
      }}
    >
      {children}
    </PostContext.Provider>
  )
}

export function usePosts() {
  const context = useContext(PostContext)
  if (!context) {
    throw new Error('usePosts must be used within PostProvider')
  }
  return context
}
