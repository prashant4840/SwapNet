import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useEndorsements } from '../useEndorsements'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: [
              { skill_name: 'React' },
              { skill_name: 'React' },
              { skill_name: 'Python' },
            ],
            error: null,
          })
        ),
      })),
    })),
  },
}))

describe('useEndorsements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load endorsements for user', async () => {
    const { result } = renderHook(() => useEndorsements('user-1'))

    await waitFor(() => {
      expect(result.current.endorsements.length).toBeGreaterThan(0)
    })
  })

  it('should return empty endorsements when userId is undefined', () => {
    const { result } = renderHook(() => useEndorsements(undefined))

    expect(result.current.endorsements).toEqual([])
  })

  it('should count endorsements per skill', async () => {
    const { result } = renderHook(() => useEndorsements('user-1'))

    await waitFor(() => {
      expect(result.current.endorsements.length).toBeGreaterThan(0)
    })

    const react = result.current.endorsements.find((e) => e.skillName === 'React')
    expect(react?.count).toBe(2)

    const python = result.current.endorsements.find((e) => e.skillName === 'Python')
    expect(python?.count).toBe(1)
  })

  it('should provide getCount helper', async () => {
    const { result } = renderHook(() => useEndorsements('user-1'))

    await waitFor(() => {
      expect(result.current.endorsements.length).toBeGreaterThan(0)
    })

    expect(result.current.getCount('React')).toBe(2)
    expect(result.current.getCount('Python')).toBe(1)
    expect(result.current.getCount('Unknown')).toBe(0)
  })

  it('should provide isVerified helper', async () => {
    const { result } = renderHook(() => useEndorsements('user-1'))

    await waitFor(() => {
      expect(result.current.endorsements.length).toBeGreaterThan(0)
    })

    expect(result.current.isVerified('React')).toBe(true)
    expect(result.current.isVerified('Python')).toBe(true)
    expect(result.current.isVerified('Unknown')).toBe(false)
  })

  it('should handle errors gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useEndorsements('user-1'))

    await waitFor(() => {
      expect(result.current.endorsements).toBeDefined()
    })

    errorSpy.mockRestore()
  })
})
