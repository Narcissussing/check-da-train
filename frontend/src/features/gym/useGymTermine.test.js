import { act, renderHook } from '@testing-library/react'
import useGymTermine from './useGymTermine'

describe('useGymTermine — Sunday joke truth table', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ termine: false }) }),
    )
  })

  test('taps 1 and 2 show a joke and never touch the network', async () => {
    const onToggled = jest.fn()
    const { result } = renderHook(() =>
      useGymTermine({ gymCacheAujourdhui: true, estDimancheAujourdhui: true, onToggled }),
    )

    await act(async () => result.current.handleClick())
    expect(result.current.texteRepos).toBeTruthy()
    expect(global.fetch).not.toHaveBeenCalled()

    const premiereBlague = result.current.texteRepos
    await act(async () => result.current.handleClick())
    expect(result.current.texteRepos).toBeTruthy()
    expect(result.current.texteRepos).not.toBe(premiereBlague)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('the 3rd tap fires the real toggle and clears the joke text', async () => {
    const onToggled = jest.fn()
    const { result } = renderHook(() =>
      useGymTermine({ gymCacheAujourdhui: true, estDimancheAujourdhui: true, onToggled }),
    )

    await act(async () => result.current.handleClick())
    await act(async () => result.current.handleClick())
    await act(async () => result.current.handleClick())

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/gym/terminer'), { method: 'POST' })
    expect(result.current.texteRepos).toBeNull()
    expect(onToggled).toHaveBeenCalledWith(false)
  })

  test('non-Sunday: a single tap always fires the real toggle', async () => {
    const onToggled = jest.fn()
    const { result } = renderHook(() =>
      useGymTermine({ gymCacheAujourdhui: false, estDimancheAujourdhui: false, onToggled }),
    )

    await act(async () => result.current.handleClick())
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('once revealed, a single tap hides it again (no more 3-tap requirement)', async () => {
    const onToggled = jest.fn()
    const { result, rerender } = renderHook(
      ({ cache }) => useGymTermine({ gymCacheAujourdhui: cache, estDimancheAujourdhui: true, onToggled }),
      { initialProps: { cache: false } },
    )

    await act(async () => result.current.handleClick())
    expect(global.fetch).toHaveBeenCalledTimes(1)
    rerender({ cache: false })
  })
})
