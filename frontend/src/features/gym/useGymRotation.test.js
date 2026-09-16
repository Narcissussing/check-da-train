import { act, renderHook } from '@testing-library/react'
import useGymRotation from './useGymRotation'

function trajet(heure, sousCount) {
  return {
    expirationHeure: heure,
    sousCreneaux: Array.from({ length: sousCount }, (_, i) => ({ id: i })),
  }
}

describe('useGymRotation', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('advances through sous-créneaux before moving to the next window', () => {
    const trajets = [trajet('a', 2), trajet('b', 1)]
    const { result } = renderHook(({ t }) => useGymRotation(t), { initialProps: { t: trajets } })

    expect(result.current.indexFenetre).toBe(0)
    expect(result.current.indexSous).toBe(0)

    act(() => jest.advanceTimersByTime(7000))
    expect(result.current.indexFenetre).toBe(0)
    expect(result.current.indexSous).toBe(1)

    act(() => jest.advanceTimersByTime(7000))
    expect(result.current.indexFenetre).toBe(1)
    expect(result.current.indexSous).toBe(0)
  })

  test('resets to window 0 whenever a new data array arrives (simulated 60s refresh)', () => {
    const trajetsV1 = [trajet('a', 1), trajet('b', 1)]
    const { result, rerender } = renderHook(({ t }) => useGymRotation(t), { initialProps: { t: trajetsV1 } })

    act(() => jest.advanceTimersByTime(7000))
    expect(result.current.indexFenetre).toBe(1)

    // A fresh fetch always produces a new array reference, even with
    // identical-looking data — this is what should trigger the reset.
    const trajetsV2 = [trajet('a', 1), trajet('b', 1)]
    rerender({ t: trajetsV2 })
    expect(result.current.indexFenetre).toBe(0)
    expect(result.current.indexSous).toBe(0)
  })

  test('pausing (tap) holds the current window steady', () => {
    const trajets = [trajet('a', 1), trajet('b', 1)]
    const { result } = renderHook(({ t }) => useGymRotation(t), { initialProps: { t: trajets } })

    act(() => result.current.handleTapFenetres({ stopPropagation: () => {} }))
    act(() => jest.advanceTimersByTime(20000))
    expect(result.current.indexFenetre).toBe(0)
  })
})
