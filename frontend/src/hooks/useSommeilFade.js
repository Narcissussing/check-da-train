import { useEffect, useRef, useState } from 'react'

export default function useSommeilFade(estHorsLigne) {
  const [enFondu, setEnFondu] = useState(false)
  const precedent = useRef(estHorsLigne)

  useEffect(() => {
    if (precedent.current === estHorsLigne) return
    precedent.current = estHorsLigne
    setEnFondu(true)
    const t = setTimeout(() => setEnFondu(false), 600)
    return () => clearTimeout(t)
  }, [estHorsLigne])

  return enFondu ? 'transition-sommeil' : ''
}
