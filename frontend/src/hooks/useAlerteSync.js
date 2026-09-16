import { useLayoutEffect } from 'react'

const SELECTEUR_ANIMATIONS_ALERTE =
  '.carte-glow-chaude, .carte-glow-alerte, .carte-trafic-info, .carte-trafic-ailleurs, .carte-trafic-alerte, .carte-trafic-alerte .statut-dot, .alerte-clignotante, .alerte-anneau'

export default function useAlerteSync(deps) {
  useLayoutEffect(() => {
    const elements = [...document.querySelectorAll(SELECTEUR_ANIMATIONS_ALERTE)]
    const retardCommun = `-${Date.now() % 1400}ms`
    elements.forEach((element) => {
      element.style.setProperty('--alerte-delay', retardCommun)
    })

    if (typeof document.timeline === 'undefined') return

    const animations = []
    elements
      .filter((element) => typeof element.getAnimations === 'function')
      .forEach((element) => {
        element.getAnimations({ subtree: true }).forEach((animation) => {
          if (animation.effect && typeof animation.effect.getTiming === 'function') {
            animations.push(animation)
          }
        })
      })

    const parDuree = new Map()
    animations.forEach((animation) => {
      const duree = Math.round(animation.effect.getTiming().duration)
      if (!Number.isFinite(duree)) return
      if (!parDuree.has(duree)) parDuree.set(duree, [])
      parDuree.get(duree).push(animation)
    })

    const debutCommun = document.timeline.currentTime
    parDuree.forEach((groupe) => {
      if (groupe.length < 2) return
      groupe.forEach((animation) => {
        animation.startTime = debutCommun
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
