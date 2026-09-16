import { act, renderHook } from '@testing-library/react'
import useDisclosure from './useDisclosure'

describe('useDisclosure', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('auto-closes after 10s when left alone', () => {
    const { result } = renderHook(() => useDisclosure())
    act(() => result.current.show())
    expect(result.current.open).toBe(true)

    act(() => jest.advanceTimersByTime(9999))
    expect(result.current.open).toBe(true)

    act(() => jest.advanceTimersByTime(1))
    expect(result.current.open).toBe(false)
  })

  test('resetTimer extends the 10s window', () => {
    const { result } = renderHook(() => useDisclosure())
    act(() => result.current.show())

    act(() => jest.advanceTimersByTime(9000))
    act(() => result.current.resetTimer())
    act(() => jest.advanceTimersByTime(9000))
    expect(result.current.open).toBe(true)

    act(() => jest.advanceTimersByTime(1000))
    expect(result.current.open).toBe(false)
  })

  test('autoClose: false never closes on its own', () => {
    const { result } = renderHook(() => useDisclosure({ autoClose: false }))
    act(() => result.current.show())
    act(() => jest.advanceTimersByTime(60000))
    expect(result.current.open).toBe(true)
  })

  test('hide closes immediately regardless of the timer', () => {
    const { result } = renderHook(() => useDisclosure())
    act(() => result.current.show())
    act(() => result.current.hide())
    expect(result.current.open).toBe(false)
  })
})
