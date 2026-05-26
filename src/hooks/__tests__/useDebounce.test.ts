import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(() => useDebounce('initial', 500))

    expect(result.current).toBe('initial')

    rerender()
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('initial')
  })

  it('should delay updating debounced value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    )

    expect(result.current).toBe('first')

    rerender({ value: 'second', delay: 300 })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('second')
  })

  it('should cancel previous timeout on new value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    )

    rerender({ value: 'second', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: 'third', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('third')
  })

  it('should work with custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 1000 } }
    )

    rerender({ value: 'b', delay: 1000 })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('b')
  })

  it('should work with generic types', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: { name: 'test' }, delay: 200 } }
    )

    expect(result.current).toEqual({ name: 'test' })

    rerender({ value: { name: 'updated' }, delay: 200 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toEqual({ name: 'updated' })
  })
})
