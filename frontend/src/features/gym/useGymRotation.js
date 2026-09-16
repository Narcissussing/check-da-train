import { useEffect, useRef, useState } from 'react'

const DUREE_SOUS_CRENEAU_MS = 7000
const DUREE_PAUSE_MS = 10000

export default function useGymRotation(trajetsGym) {
  const [indexFenetre, setIndexFenetre] = useState(0)
  const [indexSous, setIndexSous] = useState(0)
  const [enPause, setEnPause] = useState(false)
  const rotationTimer = useRef(null)
  const pauseTimer = useRef(null)

  const comptesSousParFenetre = trajetsGym.map((t) => t.sousCreneaux?.length || 1)
  const totalEtapes = comptesSousParFenetre.reduce((a, b) => a + b, 0)

  useEffect(() => {
    setIndexFenetre(0)
    setIndexSous(0)
  }, [trajetsGym])

  useEffect(() => {
    clearTimeout(rotationTimer.current)
    if (enPause || totalEtapes <= 1 || trajetsGym.length === 0) return

    rotationTimer.current = setTimeout(() => {
      const totalSous = comptesSousParFenetre[indexFenetre] ?? 1
      if (indexSous < totalSous - 1) {
        setIndexSous((n) => n + 1)
      } else {
        setIndexFenetre((n) => (n + 1) % trajetsGym.length)
        setIndexSous(0)
      }
    }, DUREE_SOUS_CRENEAU_MS)

    return () => clearTimeout(rotationTimer.current)
  }, [indexFenetre, indexSous, enPause, trajetsGym, totalEtapes])

  function reprendre() {
    setEnPause(false)
    clearTimeout(pauseTimer.current)
  }

  function handleTapFenetres(event) {
    event.stopPropagation()
    if (enPause) {
      reprendre()
      return
    }
    setEnPause(true)
    clearTimeout(pauseTimer.current)
    pauseTimer.current = setTimeout(reprendre, DUREE_PAUSE_MS)
  }

  useEffect(() => {
    if (!enPause) return
    document.addEventListener('click', reprendre)
    return () => document.removeEventListener('click', reprendre)
  }, [enPause])

  useEffect(
    () => () => {
      clearTimeout(rotationTimer.current)
      clearTimeout(pauseTimer.current)
    },
    [],
  )

  return { indexFenetre, indexSous, handleTapFenetres }
}
