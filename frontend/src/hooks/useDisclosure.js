import { useCallback, useEffect, useRef, useState } from 'react'

const DUREE_AUTO_FERMETURE_MS = 10000

export default function useDisclosure({ autoClose = true } = {}) {
  const [open, setOpen] = useState(false)
  const minuterieRef = useRef(null)

  const effacerMinuterie = useCallback(() => {
    clearTimeout(minuterieRef.current)
    minuterieRef.current = null
  }, [])

  const resetTimer = useCallback(() => {
    effacerMinuterie()
    if (!autoClose) return
    minuterieRef.current = setTimeout(() => setOpen(false), DUREE_AUTO_FERMETURE_MS)
  }, [autoClose, effacerMinuterie])

  const show = useCallback(() => {
    setOpen(true)
    resetTimer()
  }, [resetTimer])

  const hide = useCallback(() => {
    setOpen(false)
    effacerMinuterie()
  }, [effacerMinuterie])

  const toggle = useCallback(() => {
    setOpen((etaitOuvert) => {
      if (etaitOuvert) {
        effacerMinuterie()
        return false
      }
      resetTimer()
      return true
    })
  }, [resetTimer, effacerMinuterie])

  useEffect(() => () => effacerMinuterie(), [effacerMinuterie])

  return { open, show, hide, toggle, resetTimer }
}
