import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import BusSilhouette from './BusSilhouette'
import progressionBus from './progressionBus'

export default function BusProgressBar({ depart, arrivee, retardNiveau, maintenant }) {
  const parcoursRef = useRef(null)
  const busRef = useRef(null)
  const premiereMesure = useRef(true)
  const [etatVisuel, setEtatVisuel] = useState({ decalagePx: 0, sansTransition: true })

  const departMs = new Date(depart).getTime()
  const arriveeMs = new Date(arrivee).getTime()
  const progression = progressionBus(departMs, arriveeMs, maintenant)

  useEffect(() => {
    if (!parcoursRef.current || !busRef.current) return
    const largeur = Math.max(0, parcoursRef.current.clientWidth - busRef.current.offsetWidth)
    const sansTransition = premiereMesure.current
    premiereMesure.current = false
    setEtatVisuel({ decalagePx: largeur * progression, sansTransition })
  }, [progression])

  const etat = maintenant < departMs ? 'bus-approche' : maintenant < arriveeMs ? 'bus-en-route' : 'bus-arrive'
  const transition = etatVisuel.sansTransition ? 'none' : undefined

  return (
    <div
      ref={parcoursRef}
      className={`bus-parcours${retardNiveau ? ` bus-parcours-${retardNiveau}` : ''} ${etat}`}
      data-depart={depart}
      data-arrivee={arrivee}
    >
      <span className="bus-rail" />
      <span className="bus-progression" style={{ transform: `scaleX(${progression.toFixed(4)})`, transition }} />
      <span className="bus-arret bus-arret-hayette" />
      <span className="bus-arret bus-arret-meaux" />
      <span
        ref={busRef}
        className="bus-mobile"
        style={{ transform: `translate3d(${etatVisuel.decalagePx.toFixed(2)}px, 0, 0)`, transition }}
      >
        <BusSilhouette />
      </span>
    </div>
  )
}

BusProgressBar.propTypes = {
  depart: PropTypes.string.isRequired,
  arrivee: PropTypes.string.isRequired,
  retardNiveau: PropTypes.string,
  maintenant: PropTypes.number.isRequired,
}
