import { useState } from 'react'

const MAX_OUVERTS = 2
const ETAT_FILTRE_DEFAUT = { arret: 'tous', tri: 'heure', visibles: false }

export default function useBusPopupState() {
  const [direction, setDirection] = useState('meaux-onair')
  const [ouverts, setOuverts] = useState([])
  const [filtres, setFiltres] = useState({
    'onair-meaux': { ...ETAT_FILTRE_DEFAUT },
    'meaux-onair': { ...ETAT_FILTRE_DEFAUT },
  })

  function basculerDirection() {
    setDirection((actuelle) => (actuelle === 'meaux-onair' ? 'onair-meaux' : 'meaux-onair'))
    setOuverts([])
    setFiltres({
      'onair-meaux': { ...ETAT_FILTRE_DEFAUT },
      'meaux-onair': { ...ETAT_FILTRE_DEFAUT },
    })
  }

  function basculerOuverture(id) {
    setOuverts((actuels) => {
      if (actuels.includes(id)) return actuels.filter((x) => x !== id)
      const suivant = [...actuels, id]
      return suivant.length > MAX_OUVERTS ? suivant.slice(suivant.length - MAX_OUVERTS) : suivant
    })
  }

  function definirFiltre(cote, arret) {
    setFiltres((actuels) => ({ ...actuels, [cote]: { ...actuels[cote], arret } }))
  }

  function basculerTri(cote) {
    setFiltres((actuels) => ({
      ...actuels,
      [cote]: { ...actuels[cote], tri: actuels[cote].tri === 'marche' ? 'heure' : 'marche' },
    }))
  }

  function basculerVisibiliteFiltres() {
    setFiltres((actuels) => ({
      ...actuels,
      [direction]: { ...actuels[direction], visibles: !actuels[direction].visibles },
    }))
  }

  return {
    direction,
    ouverts,
    filtres,
    basculerDirection,
    basculerOuverture,
    definirFiltre,
    basculerTri,
    basculerVisibiliteFiltres,
  }
}
