import { useRef, useState } from 'react'

const BLAGUES_DIMANCHE = [
  "Demande rejetée. Motif invoqué : dimanche.",
  "Request denied under Sunday Statute, article 1.",
  "Dossier en cours d'examen. Résultat : non.",
  "Per company policy, Sundays are rest-mandatory.",
  "I'm just a button, but even I think this is a bad idea.",
  'There\'s no if-statement in this app for "yes" today.',
  'Ce bouton a des convictions religieuses le dimanche.',
  'This joke exists specifically to stall you.',
  'Wrong answer! Try again after a nap.',
  'Achievement unlocked: Stubborn.',
  'And another attempt from the challenger... still no.',
  'Un hibou vient de voter contre.',
  'Random fact: les manchots ne vont pas non plus à la salle.',
  'Somewhere, a cat is also skipping leg day.',
  'Fait divers : un panda a refusé à ta place.',
  'By decree of the Sunday Council, rest shall prevail.',
  'Les esprits du dimanche ont tranché. C\'est non.',
  "Le règlement intérieur du dimanche l'interdit formellement.",
  'Chance de gym aujourd\'hui : 12%. Chance de regret : 87%.',
  'Ce train ne dessert pas la motivation aujourd\'hui.',
  'Même le RER se met en grève le dimanche, techniquement.',
  'Correct. Incorrect. Try again never.',
  'Statistiquement, personne ne regrette une sieste du dimanche.',
  'Ok mais sincèrement, la dernière fois que t\'as juste... rien fait ?',
  "Bet you can't resist tapping again though.",
  'Vas-y, insiste. Ça ne changera rien, mais insiste.',
  'Plot twist : le lundi existe pour une bonne raison.',
  'Somewhere a calendar just sighed audibly.',
]
const TAILLE_HISTORIQUE_BLAGUES = 3

export default function useGymTermine({ gymCacheAujourdhui, estDimancheAujourdhui, onToggled }) {
  const [secousseClasse, setSecousseClasse] = useState(null)
  const [texteRepos, setTexteRepos] = useState(null)
  const tapsRestants = useRef(3)
  const historique = useRef([])

  function choisirBlague() {
    const disponibles = BLAGUES_DIMANCHE.filter((b) => !historique.current.includes(b))
    const bassin = disponibles.length > 0 ? disponibles : BLAGUES_DIMANCHE
    const choix = bassin[Math.floor(Math.random() * bassin.length)]
    historique.current = [...historique.current, choix].slice(-TAILLE_HISTORIQUE_BLAGUES)
    return choix
  }

  async function handleClick() {
    setSecousseClasse((prev) => (prev === 'a' ? 'b' : 'a'))

    if (estDimancheAujourdhui && gymCacheAujourdhui && tapsRestants.current > 1) {
      tapsRestants.current -= 1
      setTexteRepos(choisirBlague())
      return
    }

    tapsRestants.current = 3
    try {
      const reponse = await fetch(`/gym/terminer${location.search}`, { method: 'POST' })
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
      const data = await reponse.json()
      setTexteRepos(null)
      onToggled(data.termine)
    } catch (error) {
      console.warn('Bascule gym impossible :', error.message)
    }
  }

  return { secousseClasse, texteRepos, handleClick }
}
