import { describe, it, expect } from 'vitest'
import {
  createId,
  buildSwapThreadKey,
  buildConnectionThreadKey,
  parseThreadKey,
  slugify,
  formatRelativeTime,
  formatShortDate,
  normalizeSkillName,
  profileCompletion,
  skillNameList,
  isRecentlyActive,
  computeMatchResult,
  isNewToday,
  buildShareUrl,
  uniqueCities,
  categoriesFromSkills,
} from '../app'
import type { UserProfile, SkillEntry } from '@/types'

describe('Utility Functions', () => {
  describe('createId', () => {
    it('should create ID with prefix', () => {
      const id = createId('user')
      expect(id).toMatch(/^user-/)
      expect(id.length).toBeGreaterThan(5)
    })

    it('should create different IDs on each call', () => {
      const id1 = createId('review')
      const id2 = createId('review')
      expect(id1).not.toBe(id2)
    })
  })

  describe('buildSwapThreadKey', () => {
    it('should format swap thread key with underscore prefix', () => {
      const key = buildSwapThreadKey('swap-123')
      expect(key).toBe('swap_swap-123')
    })
  })

  describe('buildConnectionThreadKey', () => {
    it('should format connection thread key with underscore prefix', () => {
      const key = buildConnectionThreadKey('conn-456')
      expect(key).toBe('connection_conn-456')
    })
  })

  describe('parseThreadKey', () => {
    it('should parse swap thread key', () => {
      const result = parseThreadKey('swap_swap-123')
      expect(result).toEqual({ kind: 'swap', sourceId: 'swap-123' })
    })

    it('should parse connection thread key', () => {
      const result = parseThreadKey('connection_conn-456')
      expect(result).toEqual({ kind: 'connection', sourceId: 'conn-456' })
    })

    it('should return null for invalid key', () => {
      const result = parseThreadKey('invalid-key')
      expect(result).toBeNull()
    })

    it('should return null for empty key', () => {
      const result = parseThreadKey('')
      expect(result).toBeNull()
    })
  })

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      const slug = slugify('Hello World')
      expect(slug).toBe('hello-world')
    })

    it('should remove special characters', () => {
      const slug = slugify('John Doe!')
      expect(slug).toBe('john-doe')
    })

    it('should handle multiple spaces', () => {
      const slug = slugify('React   Developer')
      expect(slug).toBe('react-developer')
    })
  })

  describe('formatRelativeTime', () => {
    it('should format past times with suffix', () => {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
      const result = formatRelativeTime(oneHourAgo)
      expect(result).toMatch(/ago/)
    })
  })

  describe('formatShortDate', () => {
    it('should format date correctly', () => {
      const result = formatShortDate('2024-01-15T10:30:00Z')
      expect(result).toMatch(/Jan|15/)
    })
  })

  describe('normalizeSkillName', () => {
    it('should normalize skill names to lowercase', () => {
      const result = normalizeSkillName('  JavaScript  ')
      expect(result).toBe('javascript')
    })

    it('should handle empty string', () => {
      const result = normalizeSkillName('')
      expect(result).toBe('')
    })
  })

  describe('profileCompletion', () => {
    it('should calculate profile completion percentage', () => {
      const profile: UserProfile = {
        id: 'user-1',
        username: 'john',
        name: 'John Doe',
        email: 'john@example.com',
        photo: 'photo.jpg',
        bio: 'Developer',
        city: 'San Francisco',
        age: 28,
        headline: 'Full Stack',
        mode: 'Online',
        skillsOffered: [{ id: '1', name: 'React', category: 'Tech' }],
        skillsWanted: [{ id: '2', name: 'Python', category: 'Tech' }],
        rating: 4.5,
        swapScore: 80,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        availability: [{ day: 'Monday', start: '09:00', end: '17:00' }],
      }
      const completion = profileCompletion(profile)
      expect(completion).toBeGreaterThan(0)
      expect(completion).toBeLessThanOrEqual(100)
    })
  })

  describe('skillNameList', () => {
    it('should return normalized skill names array', () => {
      const skills: SkillEntry[] = [
        { id: '1', name: 'React', category: 'Tech' },
        { id: '2', name: 'Node.js', category: 'Tech' },
      ]
      const result = skillNameList(skills)
      expect(result).toEqual(['react', 'node.js'])
    })

    it('should handle empty array', () => {
      const result = skillNameList([])
      expect(result).toEqual([])
    })
  })

  describe('isRecentlyActive', () => {
    it('should return true for recent activity', () => {
      const now = new Date().toISOString()
      const result = isRecentlyActive(now)
      expect(result).toBe(true)
    })

    it('should return false for old activity', () => {
      const oldDate = new Date(Date.now() - 90 * 3600000).toISOString()
      const result = isRecentlyActive(oldDate, 36)
      expect(result).toBe(false)
    })
  })

  describe('computeMatchResult', () => {
    const user1: UserProfile = {
      id: 'user-1',
      username: 'alice',
      name: 'Alice',
      email: 'alice@example.com',
      photo: '',
      bio: 'Python developer',
      city: 'San Francisco',
      age: 28,
      headline: 'Learning React',
      mode: 'Online',
      skillsOffered: [{ id: '1', name: 'Python', category: 'Tech' }],
      skillsWanted: [{ id: '2', name: 'React', category: 'Tech' }],
      rating: 4.8,
      swapScore: 95,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      availability: [],
    }

    const user2: UserProfile = {
      id: 'user-2',
      username: 'bob',
      name: 'Bob',
      email: 'bob@example.com',
      photo: '',
      bio: 'React expert',
      city: 'New York',
      age: 32,
      headline: 'Teaching React',
      mode: 'Online',
      skillsOffered: [{ id: '3', name: 'React', category: 'Tech' }],
      skillsWanted: [{ id: '4', name: 'Python', category: 'Tech' }],
      rating: 4.5,
      swapScore: 80,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      availability: [],
    }

    it('should compute match score', () => {
      const result = computeMatchResult(user1, user2)
      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should include reasons in match result', () => {
      const result = computeMatchResult(user1, user2)
      expect(Array.isArray(result.reasons)).toBe(true)
    })

    it('should return high score for perfect skill match', () => {
      const result = computeMatchResult(user1, user2)
      expect(result.score).toBeGreaterThan(70)
    })

    it('should consider mode compatibility', () => {
      const onlineUser = { ...user1, mode: 'Online' as const }
      const inPersonUser = { ...user2, mode: 'In-person' as const }
      const mismatchScore = computeMatchResult(onlineUser, inPersonUser).score
      const matchScore = computeMatchResult(onlineUser, { ...user2, mode: 'Online' as const }).score
      expect(matchScore).toBeGreaterThanOrEqual(mismatchScore)
    })
  })

  describe('isNewToday', () => {
    it('should return true for today', () => {
      const today = new Date().toISOString()
      const result = isNewToday(today)
      expect(result).toBe(true)
    })

    it('should return false for yesterday', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString()
      const result = isNewToday(yesterday)
      expect(result).toBe(false)
    })
  })

  describe('buildShareUrl', () => {
    it('should build profile share URL', () => {
      const url = buildShareUrl('alice')
      expect(url).toContain('alice')
      expect(url).toMatch(/http/)
    })
  })

  describe('uniqueCities', () => {
    it('should extract unique cities', () => {
      const users: Partial<UserProfile>[] = [
        { city: 'San Francisco' },
        { city: 'New York' },
        { city: 'San Francisco' },
      ]
      const cities = uniqueCities(users as UserProfile[])
      expect(cities).toContain('San Francisco')
      expect(cities).toContain('New York')
      expect(cities.length).toBe(2)
    })

    it('should handle empty users array', () => {
      const cities = uniqueCities([])
      expect(cities).toEqual([])
    })
  })

  describe('categoriesFromSkills', () => {
    it('should extract unique categories', () => {
      const skills: SkillEntry[] = [
        { id: '1', name: 'React', category: 'Tech' },
        { id: '2', name: 'Python', category: 'Tech' },
        { id: '3', name: 'Design', category: 'Creative' },
      ]
      const categories = categoriesFromSkills(skills)
      expect(categories).toContain('Tech')
      expect(categories).toContain('Creative')
      expect(categories.length).toBe(2)
    })
  })
})
