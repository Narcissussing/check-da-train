import { useEffect, useState } from 'react'

const MAX_OUVERTS = 2
const CLE_STOCKAGE = 'cdt-bus-choisis'
const VIDE = { 'onair-meaux': [], 'meaux-onair': [] }

// Jour à Paris (AAAA-MM-JJ), les bus choisis repartent de zéro chaque matin.
function jourParis() {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })
}

function lireChoisis() {
  try {
    const sauve = JSON.parse(localStorage.getItem(CLE_STOCKAGE))
    if (sauve?.jour === jourParis() && sauve.ouverts) return { ...VIDE, ...sauve.ouverts }
  } catch {
    // Stockage indisponible ou illisible, on repart à vide.
  }
  return VIDE
}
const ETAT_FILTRE_DEFAUT = { arret: 'tous', tri: 'heure', visibles: false }

export default function useBusPopupState() {
  const [direction, setDirection] = useState('meaux-onair')
  // Bus choisis (lignes ouvertes) gardés par direction, pour qu'un aller-retour
  // entre les deux sens ne les oublie pas.
  const [ouvertsParDirection, setOuvertsParDirection] = useState(lireChoisis)
  const [jour, setJour] = useState(jourParis)
  const ouverts = ouvertsParDirection[direction]

  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify({ jour, ouverts: ouvertsParDirection }))
    } catch {
      // Navigation privée ou stockage plein, le choix reste en mémoire.
    }
  }, [jour, ouvertsParDirection])

  // Page restée ouverte au passage de minuit, on vide les choix de la veille.
  useEffect(() => {
    const id = setInterval(() => {
      const aujourdhui = jourParis()
      if (aujourdhui !== jour) {
        setJour(aujourdhui)
        setOuvertsParDirection(VIDE)
      }
    }, 60000)
    return () => clearInterval(id)
  }, [jour])
  const [filtres, setFiltres] = useState({
    'onair-meaux': { ...ETAT_FILTRE_DEFAUT },
    'meaux-onair': { ...ETAT_FILTRE_DEFAUT },
  })

  function basculerDirection() {
    setDirection((actuelle) => (actuelle === 'meaux-onair' ? 'onair-meaux' : 'meaux-onair'))
    setFiltres({
      'onair-meaux': { ...ETAT_FILTRE_DEFAUT },
      'meaux-onair': { ...ETAT_FILTRE_DEFAUT },
    })
  }

  function basculerOuverture(id) {
    setOuvertsParDirection((tous) => {
      const actuels = tous[direction]
      if (actuels.includes(id)) return { ...tous, [direction]: actuels.filter((x) => x !== id) }
      const suivant = [...actuels, id]
      return {
        ...tous,
        [direction]: suivant.length > MAX_OUVERTS ? suivant.slice(suivant.length - MAX_OUVERTS) : suivant,
      }
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
