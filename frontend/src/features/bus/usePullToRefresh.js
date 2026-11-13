import { useEffect, useRef, useState } from 'react'

const SEUIL_PX = 64
const MAX_PX = 96
const DUREE_MIN_MS = 900

// Tirer vers le bas en haut de la liste relance le chargement ; événements
// tactiles (pas de Pointer Events sur Safari iOS 12), écouteur non passif pour
// bloquer le rebond natif pendant le tirage.
export default function usePullToRefresh(onRefresh, actif) {
  const zoneRef = useRef(null)
  const [tirage, setTirage] = useState(0)
  const [etat, setEtat] = useState('repos')
  const etatRef = useRef('repos')
  const departY = useRef(null)
  const tirageRef = useRef(0)

  function changerEtat(suivant) {
    etatRef.current = suivant
    setEtat(suivant)
  }

  useEffect(() => {
    const zone = zoneRef.current
    if (!actif || !zone) return undefined
    const defileur = zone.closest('.popup-boite') ?? zone

    function debut(event) {
      if (etatRef.current !== 'repos' || defileur.scrollTop > 0) return
      departY.current = event.touches[0].clientY
    }

    function mouvement(event) {
      if (departY.current == null) return
      const ecart = event.touches[0].clientY - departY.current
      if (ecart <= 0) {
        tirageRef.current = 0
        setTirage(0)
        return
      }
      event.preventDefault()
      const valeur = Math.min(MAX_PX, ecart * 0.5)
      tirageRef.current = valeur
      setTirage(valeur)
    }

    async function fin() {
      if (departY.current == null) return
      departY.current = null
      if (tirageRef.current < SEUIL_PX) {
        tirageRef.current = 0
        setTirage(0)
        return
      }
      changerEtat('chargement')
      setTirage(SEUIL_PX)
      const debutMs = Date.now()
      try {
        await onRefresh()
      } finally {
        const reste = DUREE_MIN_MS - (Date.now() - debutMs)
        if (reste > 0) await new Promise((r) => setTimeout(r, reste))
        changerEtat('fini')
        tirageRef.current = 0
        setTirage(0)
        setTimeout(() => changerEtat('repos'), 500)
      }
    }

    zone.addEventListener('touchstart', debut, { passive: true })
    zone.addEventListener('touchmove', mouvement, { passive: false })
    zone.addEventListener('touchend', fin)
    zone.addEventListener('touchcancel', fin)
    return () => {
      zone.removeEventListener('touchstart', debut)
      zone.removeEventListener('touchmove', mouvement)
      zone.removeEventListener('touchend', fin)
      zone.removeEventListener('touchcancel', fin)
    }
  }, [actif, onRefresh])

  return { zoneRef, tirage, etat, progression: Math.min(1, tirage / SEUIL_PX) }
}
