import { act, renderHook } from '@testing-library/react'
import useBusPopupState from './useBusPopupState'

describe('useBusPopupState', () => {
  test('filters and open rows survive a re-render (simulated 60s data refresh)', () => {
    const { result, rerender } = renderHook(() => useBusPopupState())

    act(() => result.current.definirFiltre('meaux-onair', 'La Hayette'))
    act(() => result.current.basculerOuverture('bus-1'))

    // A parent re-render (new data arriving) doesn't touch this hook's own
    // state at all — that's the whole point: it lives independently of the
    // fetched data, so it isn't wiped by a refetch.
    rerender()

    expect(result.current.filtres['meaux-onair'].arret).toBe('La Hayette')
    expect(result.current.ouverts).toContain('bus-1')
  })

  test('FIFO eviction keeps at most 2 rows open', () => {
    const { result } = renderHook(() => useBusPopupState())
    act(() => result.current.basculerOuverture('a'))
    act(() => result.current.basculerOuverture('b'))
    act(() => result.current.basculerOuverture('c'))
    expect(result.current.ouverts).toEqual(['b', 'c'])
  })

  test('swapping direction resets filters/sort/open-rows on both sides', () => {
    const { result } = renderHook(() => useBusPopupState())
    act(() => result.current.definirFiltre('meaux-onair', 'La Hayette'))
    act(() => result.current.basculerTri('meaux-onair'))
    act(() => result.current.basculerOuverture('x'))

    act(() => result.current.basculerDirection())

    expect(result.current.filtres['meaux-onair']).toEqual({ arret: 'tous', tri: 'heure', visibles: false })
    expect(result.current.filtres['onair-meaux']).toEqual({ arret: 'tous', tri: 'heure', visibles: false })
    expect(result.current.ouverts).toEqual([])
  })
})
