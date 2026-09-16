import { useEffect, useRef, useState } from 'react'

const DUREE_REACTION_MS = 3000
const DUREE_AUTO_FERMETURE_MS = 10000

export default function useWeatherReactions(scene) {
  const [accelere, setAccelere] = useState(false)
  const accelTimer = useRef(null)

  const [secousse, setSecousse] = useState(false)
  const secousseTimer = useRef(null)

  const [flashOrage, setFlashOrage] = useState(null)
  const [flouBrouillard, setFlouBrouillard] = useState(null)
  const [flashCalme, setFlashCalme] = useState(null)

  const [pluieOuverte, setPluieOuverte] = useState(false)
  const pluieTimer = useRef(null)
  const [pluieAcceleree, setPluieAcceleree] = useState(false)
  const pluieAccelTimer = useRef(null)

  function accelererScene() {
    clearTimeout(accelTimer.current)
    setAccelere(true)
    accelTimer.current = setTimeout(() => setAccelere(false), DUREE_REACTION_MS)
  }

  function alterner(setter) {
    setter((precedente) => (precedente === 'a' ? 'b' : 'a'))
  }

  function handleCardClick() {
    accelererScene()

    if (scene === 'orage') {
      alterner(setFlashOrage)
      clearTimeout(secousseTimer.current)
      setSecousse(true)
      secousseTimer.current = setTimeout(() => setSecousse(false), 400)
      return
    }
    if (scene === 'brouillard') {
      alterner(setFlouBrouillard)
      return
    }
    if (scene === 'calme') {
      alterner(setFlashCalme)
    }
  }

  function handlePluieClick(pluieEnCours) {
    if (pluieEnCours) {
      accelererScene()
      clearTimeout(pluieAccelTimer.current)
      setPluieAcceleree(true)
      pluieAccelTimer.current = setTimeout(() => setPluieAcceleree(false), DUREE_REACTION_MS)
      return
    }

    setPluieOuverte((etaitOuverte) => {
      clearTimeout(pluieTimer.current)
      if (!etaitOuverte) {
        pluieTimer.current = setTimeout(() => setPluieOuverte(false), DUREE_AUTO_FERMETURE_MS)
      }
      return !etaitOuverte
    })
  }

  useEffect(
    () => () => {
      clearTimeout(accelTimer.current)
      clearTimeout(secousseTimer.current)
      clearTimeout(pluieTimer.current)
      clearTimeout(pluieAccelTimer.current)
    },
    [],
  )

  return {
    accelere,
    secousse,
    flashOrage,
    flouBrouillard,
    flashCalme,
    pluieOuverte,
    pluieAcceleree,
    handleCardClick,
    handlePluieClick,
  }
}
