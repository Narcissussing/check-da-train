import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from './components/Header/Header'
import WeatherCard from './features/weather/WeatherCard'
import TrafficCard from './features/traffic/TrafficCard'
import TrainCard from './features/trains/TrainCard'
import GymCard from './features/gym/GymCard'
import BusPopup from './features/bus/BusPopup'
import DemoBar from './features/DemoBar'
import useDisclosure from './hooks/useDisclosure'
import useAlerteSync from './hooks/useAlerteSync'
import { SleepModeProvider } from './context/SleepModeContext'

const REFRESH_MS = 60 * 1000
const EST_IPAD = typeof navigator !== 'undefined' && /iPad/.test(navigator.userAgent)

export default function App() {
  const [searchParams] = useSearchParams()
  const searchString = searchParams.toString()
  const [donnees, setDonnees] = useState(null)
  const [horsLigne, setHorsLigne] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const busPopup = useDisclosure({ autoClose: false })
  const controleurActuel = useRef(null)
  const isPausedRef = useRef(false)
  const chargerRef = useRef(async () => {})

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    let demonte = false

    async function chargerSansGarde() {
      controleurActuel.current?.abort()
      const controleur = new AbortController()
      controleurActuel.current = controleur

      try {
        const reponse = await fetch(`/api/dashboard${searchString ? `?${searchString}` : ''}`, {
          cache: 'no-store',
          signal: controleur.signal,
        })
        if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
        const json = await reponse.json()
        if (demonte) return
        setDonnees(json)
        setHorsLigne(false)
      } catch (error) {
        if (error.name === 'AbortError') return
        console.warn('Chargement du tableau de bord impossible :', error.message)
        if (!demonte) setHorsLigne(true)
      }
    }

    function charger() {
      if (isPausedRef.current) return
      return chargerSansGarde()
    }

    // Manual resume (Phase 8) always bypasses the pause guard — mirrors
    // vanilla calling rafraichirTableauDeBord() directly right after
    // pauseManuelle is set to false as a plain variable. isPausedRef here
    // only updates after a render, so a guarded call made in the same
    // tick as setIsPaused(false) would read the stale value and bail.
    chargerRef.current = chargerSansGarde
    charger()
    const minuterie = setInterval(charger, REFRESH_MS)
    return () => {
      demonte = true
      controleurActuel.current?.abort()
      clearInterval(minuterie)
    }
  }, [searchString])

  useAlerteSync([donnees])

  if (!donnees && !horsLigne) {
    return <main className="etat-chargement">Chargement…</main>
  }

  if (!donnees && horsLigne) {
    return (
      <main className="etat-erreur">
        <p>Impossible de contacter le serveur pour le moment.</p>
        <p>Nouvelle tentative automatique dans moins d'une minute.</p>
      </main>
    )
  }

  const estHorsLigne = EST_IPAD && (isPaused || horsLigne)

  return (
    <SleepModeProvider value={estHorsLigne}>
      <Header
        dateAffichee={donnees.dateAffichee}
        modeDemo={donnees.modeDemo}
        demoDisponible={donnees.demoDisponible}
        isPaused={isPaused}
        horsLigne={horsLigne}
        onPause={() => setIsPaused(true)}
        onResume={() => {
          setIsPaused(false)
          chargerRef.current()
        }}
      />
      <main id="dashboard-content" className="page">
        {donnees.modeDemo && (
          <DemoBar
            boutonsMeteo={donnees.boutonsMeteo}
            boutonsTrafic={donnees.boutonsTrafic}
            boutonsService={donnees.boutonsService}
            boutonsRetard={donnees.boutonsRetard}
            boutonsPluie={donnees.boutonsPluie}
            boutonsGym={donnees.boutonsGym}
            boutonsRetourMeaux={donnees.boutonsRetourMeaux}
            reinitialiserHref="/?demo=1"
            afficherReinitialiser={Boolean(
              donnees.meteoDemoActif ||
                donnees.traficDemoActif ||
                donnees.serviceDemoActif ||
                donnees.retardDemoActif ||
                donnees.pluieDemoActif ||
                donnees.gymDemoActif ||
                donnees.retourMeauxDemoActif,
            )}
          />
        )}
        {donnees.meteos?.length === 2 && (
          <section className="grille-principale">
            <WeatherCard
              meteo={donnees.meteos[0]}
              meteoActuelleTexte={donnees.meteoActuelleTexte}
              meteoDemainTexte={donnees.meteoDemainTexte}
              prochainePluieTrilport={donnees.prochainePluieTrilport}
            />
            <TrainCard
              variant="depart"
              trains={donnees.departsTrilportDepart}
              niveauTrafic={donnees.niveauTrafic}
              statut={donnees.statutDeparts}
            />
            <TrainCard
              variant="arrivee"
              trains={donnees.arrivesTrilport}
              niveauTrafic={donnees.niveauTrafic}
              statut={donnees.statutArrivees}
            />
            <TrainCard
              variant="rentre"
              trains={donnees.departsRetourEntete.slice(0, 3)}
              niveauTrafic={donnees.niveauTrafic}
              statut={donnees.statutRetourMeaux}
              onOuvrirBus={busPopup.show}
            />
          </section>
        )}

        <GymCard
          meteoMeaux={donnees.meteos?.[1]}
          departsRetourEntete={donnees.departsRetourEntete}
          statutRetourMeaux={donnees.statutRetourMeaux}
          trajetsGym={donnees.trajetsGym}
          trajetsGymTous={donnees.trajetsGymTous}
          gymCacheAujourdhui={donnees.gymCacheAujourdhui}
          estDimancheAujourdhui={donnees.estDimancheAujourdhui}
          gymVerrouilleActif={donnees.gymVerrouilleActif}
        />

        <TrafficCard
          niveauTrafic={donnees.niveauTrafic}
          phaseServiceActuelle={donnees.phaseServiceActuelle}
          texteAlerte={donnees.texteAlerte}
          detailAlerte={donnees.detailAlerte}
          prochaineTravaux={donnees.prochaineTravaux}
          travauxFuturs={donnees.travauxFuturs}
        />
      </main>

      <BusPopup
        open={busPopup.open}
        onClose={busPopup.hide}
        onInsideClick={busPopup.resetTimer}
        busRetour={donnees.busRetour}
        busVersOnAir={donnees.busVersOnAir}
      />
    </SleepModeProvider>
  )
}
