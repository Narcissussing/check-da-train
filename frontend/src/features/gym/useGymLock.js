import { useEffect, useState } from 'react'

export default function useGymLock({ trajetsGymTous, gymVerrouilleActif }) {
  const [selectedTrajet, setSelectedTrajet] = useState(null)

  useEffect(() => {
    if (!gymVerrouilleActif) return
    const dejaAJour =
      selectedTrajet &&
      selectedTrajet.aller.heure === gymVerrouilleActif.allerHeure &&
      selectedTrajet.retour.heure === gymVerrouilleActif.retourHeure
    if (dejaAJour) return

    for (const groupe of trajetsGymTous ?? []) {
      const trouve = groupe.sousCreneaux.find(
        (s) => s.aller.heure === gymVerrouilleActif.allerHeure && s.retour.heure === gymVerrouilleActif.retourHeure,
      )
      if (trouve) {
        setSelectedTrajet(trouve)
        return
      }
    }
  }, [gymVerrouilleActif, trajetsGymTous, selectedTrajet])

  useEffect(() => {
    if (!selectedTrajet) return
    const delai = new Date(selectedTrajet.departSalleHeure).getTime() - Date.now()
    if (delai <= 0) {
      setSelectedTrajet(null)
      return
    }
    const t = setTimeout(() => setSelectedTrajet(null), delai)
    return () => clearTimeout(t)
  }, [selectedTrajet])

  async function selectionner(sousCreneau) {
    setSelectedTrajet(sousCreneau)
    try {
      await fetch(`/gym/verrouiller${location.search}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allerHeure: sousCreneau.aller.heure,
          retourHeure: sousCreneau.retour.heure,
          expireISO: sousCreneau.departSalleHeure,
        }),
      })
    } catch (error) {
      console.warn('Verrouillage gym non partagé :', error.message)
    }
  }

  return { selectedTrajet, selectionner }
}
