import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'

describe('ThemeContext', () => {
  beforeEach(() => {
    // Create a real Map for localStorage
    const store = new Map<string, string>()
    const mockLocalStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      length: 0,
      key: () => null,
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
  })

  it('should provide initial theme from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('dark')
  })

  it('should default to light theme if localStorage is empty', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('light')
  })

  it('should toggle theme on toggleTheme call', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('light')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
  })

  it('should persist theme to localStorage on change', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    act(() => {
      result.current.toggleTheme()
    })

    expect(localStorage.getItem('theme')).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })

    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('should throw error when useTheme is used outside provider', () => {
    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme must be used within ThemeProvider')
  })
})
