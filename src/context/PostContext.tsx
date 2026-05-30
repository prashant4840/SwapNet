/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type PropsWithChildren } from 'react'
import toast from 'react-hot-toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { LookingForPost, SkillCategory } from '@/types'

interface PostContextValue {
  posts: LookingForPost[]
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

  useEffect(() => {
    if (initialPosts.length > 0) {
      setPosts(initialPosts)
      return
    }

    if (!isSupabaseConfigured || !supabase) return

    const loadPosts = async () => {
      try {
        const { data, error } = await supabase!
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

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
        }
      } catch (error) {
        console.error('Failed to load posts from database:', error)
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
          city: data.city as string,
          mode: data.mode as 'Online' | 'In-person' | 'Both',
          createdAt: data.created_at as string,
          responses: data.responses as number,
        }

        const updatedPosts = [newPost, ...posts]
        setPosts(updatedPosts)
        onPostsUpdate?.(updatedPosts)

        toast.success('Community post published.')
        return true
      } catch (error) {
        console.error('Failed to create post:', error)
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
