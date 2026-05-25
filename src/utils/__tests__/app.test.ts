import { describe, it, expect } from 'vitest'
import { buildSwapThreadKey, buildConnectionThreadKey, formatRelativeTime } from '@/utils/app'

describe('Thread Key Utilities', () => {
  it('should build swap thread key correctly', () => {
    const swapId = 'swap-123'
    const result = buildSwapThreadKey(swapId)
    expect(result).toBe(`swap_${swapId}`)
  })

  it('should build connection thread key correctly', () => {
    const connectionId = 'conn-456'
    const result = buildConnectionThreadKey(connectionId)
    expect(result).toBe(`connection_${connectionId}`)
  })

  it('should handle empty IDs', () => {
    expect(buildSwapThreadKey('')).toBe('swap_')
    expect(buildConnectionThreadKey('')).toBe('connection_')
  })

  it('should have correct prefixes', () => {
    expect(buildSwapThreadKey('test').startsWith('swap_')).toBe(true)
    expect(buildConnectionThreadKey('test').startsWith('connection_')).toBe(true)
  })
})

describe('Time Formatting', () => {
  it('should format recent time with suffix', () => {
    const now = new Date().toISOString()
    const result = formatRelativeTime(now)
    expect(result).toMatch(/ago|now/i)
  })

  it('should handle past timestamps', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
    const result = formatRelativeTime(pastDate)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result).toContain('ago')
  })

  it('should return a non-empty string', () => {
    const timestamp = new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
    const result = formatRelativeTime(timestamp)
    expect(result.length).toBeGreaterThan(0)
  })
})

