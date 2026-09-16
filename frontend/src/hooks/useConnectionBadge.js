import { useEffect, useRef, useState } from 'react'

const DUREE_CONFIRMATION_MS = 10000

export default function useConnectionBadge({ isPaused, onPause, onResume }) {
  const [isRevealed, setIsRevealed] = useState(false)
  const timerRef = useRef(null)
  const estIpad = typeof navigator !== 'undefined' && /iPad/.test(navigator.userAgent)

  function armer() {
    clearTimeout(timerRef.current)
    setIsRevealed(true)
    timerRef.current = setTimeout(() => setIsRevealed(false), DUREE_CONFIRMATION_MS)
  }

  function reveler() {
    if (!estIpad || isPaused) return
    armer()
  }

  function gererTapBadge() {
    if (!estIpad) return
    if (isPaused) {
      onResume()
      armer()
      return
    }
    if (!isRevealed) {
      armer()
      return
    }
    clearTimeout(timerRef.current)
    setIsRevealed(false)
    onPause()
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return { estIpad, isRevealed, reveler, gererTapBadge }
}
