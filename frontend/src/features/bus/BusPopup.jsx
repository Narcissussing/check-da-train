import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'
import Popup from '../../components/Popup'
import useBusPopupState from './useBusPopupState'
import BusRowRetour from './BusRowRetour'
import BusRowVersOnAir from './BusRowVersOnAir'
import BusFiltreControles from './BusFiltreControles'
import BusSilhouette from './BusSilhouette'
import usePullToRefresh from './usePullToRefresh'

// Un bus parti depuis plus d'une minute disparaît, sauf s'il est choisi
// (ligne ouverte) ; la dernière seconde sert à jouer l'animation de sortie.
const DELAI_PARTI_MS = 60000
const DUREE_SORTIE_MS = 1000

function etatDepart(bus, maintenant, ouverts) {
  if (ouverts.includes(bus.id)) return 'visible'
  const ecoule = maintenant - new Date(bus.depart).getTime()
  if (ecoule < DELAI_PARTI_MS) return 'visible'
  if (ecoule < DELAI_PARTI_MS + DUREE_SORTIE_MS) return 'sortie'
  return 'parti'
}

function filtrerEtTrier(liste, filtre, champArret, champMarche) {
  let resultat = liste
  if (filtre.arret !== 'tous') {
    resultat = resultat.filter((bus) => champArret(bus) === filtre.arret)
  }
  if (filtre.tri === 'marche') {
    resultat = [...resultat].sort((a, b) => {
      const ma = champMarche(a)
      const mb = champMarche(b)
      if (Number.isNaN(ma)) return 1
      if (Number.isNaN(mb)) return -1
      return ma - mb
    })
  }
  return resultat
}

export default function BusPopup({ open, onClose, onInsideClick, onRefresh, busRetour, busVersOnAir }) {
  const etat = useBusPopupState()
  const tirage = usePullToRefresh(onRefresh, open)
  const [maintenant, setMaintenant] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const retourVisibles = busRetour.filter((b) => etatDepart(b, maintenant, etat.ouverts) !== 'parti')
  const versOnAirVisibles = busVersOnAir.filter((b) => etatDepart(b, maintenant, etat.ouverts) !== 'parti')

  const arretsRetour = [...new Set(retourVisibles.map((b) => b.arret).filter(Boolean))]
  const arretsVersOnAir = [...new Set(versOnAirVisibles.map((b) => b.arretDescente).filter(Boolean))]

  const listeRetour = filtrerEtTrier(
    retourVisibles,
    etat.filtres['onair-meaux'],
    (b) => b.arret,
    (b) => Number(b.marcheMinutes),
  )
  const listeVersOnAir = filtrerEtTrier(
    versOnAirVisibles,
    etat.filtres['meaux-onair'],
    (b) => b.arretDescente,
    (b) => Number(b.marcheMinutes),
  )

  return (
    <Popup
      id="bus-retour-popup"
      open={open}
      onClose={onClose}
      onInsideClick={onInsideClick}
      autoClose={false}
      boiteClassName="bus-retour-popup"
    >
      <div className="bus-tirage-zone" ref={tirage.zoneRef}>
        <div
          className={`bus-tirage bus-tirage-${tirage.etat}${tirage.tirage > 0 && tirage.etat === 'repos' ? ' bus-tirage-actif' : ''}`}
          style={{ height: `${tirage.tirage}px` }}
          aria-hidden="true"
        >
          <span
            className="bus-tirage-bus"
            style={tirage.etat === 'repos' ? { transform: `translateX(${(tirage.progression - 1) * 3}rem)`, opacity: tirage.progression } : undefined}
          >
            <BusSilhouette />
          </span>
        </div>
        <div
          className="popup-titre bus-direction-toggle bus-direction-toggle-pleine-largeur"
          data-direction-actuelle={etat.direction}
        >
          <span className="bus-direction-mot">
            <button
              type="button"
              className="bus-filtres-toggle"
              aria-expanded={etat.filtres[etat.direction].visibles}
              aria-label="Afficher ou masquer les filtres"
              onClick={etat.basculerVisibiliteFiltres}
            >
              <Icon name="train" size={14} className="bus-direction-picto" />
            </button>
            <span className="bus-direction-nom bus-direction-nom-meaux">Meaux</span>
          </span>
          <button type="button" className="bus-direction-swap" aria-label="Changer de direction" onClick={etat.basculerDirection}>
            <Icon name="fleche" size={13} />
          </button>
          <span className="bus-direction-mot">
            <span className="bus-direction-nom bus-direction-nom-onair">On Air</span>{' '}
            <Icon name="haltere" size={14} className="bus-direction-picto" />
          </span>
        </div>

        <div className="bus-direction-panneau" data-direction-panneau="onair-meaux" hidden={etat.direction !== 'onair-meaux'}>
          {retourVisibles.length > 0 ? (
            <>
              <BusFiltreControles
                id="bus-rentre-filtres"
                arrets={arretsRetour}
                filtre={etat.filtres['onair-meaux']}
                visibles={etat.filtres['onair-meaux'].visibles}
                onFiltrer={(arret) => etat.definirFiltre('onair-meaux', arret)}
                onTrier={() => etat.basculerTri('onair-meaux')}
              />
              <ul className="bus-rentre-liste">
                {listeRetour.map((bus) => (
                  <BusRowRetour
                    key={bus.id}
                    bus={bus}
                    ouvert={etat.ouverts.includes(bus.id)}
                    onToggle={() => etat.basculerOuverture(bus.id)}
                    maintenant={maintenant}
                    sortie={etatDepart(bus, maintenant, etat.ouverts) === 'sortie'}
                  />
                ))}
              </ul>
            </>
          ) : (
            <p className="bus-indisponible">Aucun passage disponible actuellement.</p>
          )}
        </div>

        <div className="bus-direction-panneau" data-direction-panneau="meaux-onair" hidden={etat.direction !== 'meaux-onair'}>
          <div className="bus-autres bus-vers-onair">
            {versOnAirVisibles.length > 0 ? (
              <>
                <BusFiltreControles
                  id="bus-vers-onair-filtres"
                  arrets={arretsVersOnAir}
                  filtre={etat.filtres['meaux-onair']}
                  visibles={etat.filtres['meaux-onair'].visibles}
                  onFiltrer={(arret) => etat.definirFiltre('meaux-onair', arret)}
                  onTrier={() => etat.basculerTri('meaux-onair')}
                />
                <ul>
                  {listeVersOnAir.map((bus) => (
                    <BusRowVersOnAir
                      key={bus.id}
                      bus={bus}
                      ouvert={etat.ouverts.includes(bus.id)}
                      onToggle={() => etat.basculerOuverture(bus.id)}
                      maintenant={maintenant}
                      sortie={etatDepart(bus, maintenant, etat.ouverts) === 'sortie'}
                    />
                  ))}
                </ul>
              </>
            ) : (
              <p className="bus-indisponible">Aucun passage disponible actuellement.</p>
            )}
          </div>
        </div>
      </div>
    </Popup>
  )
}

BusPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onInsideClick: PropTypes.func,
  onRefresh: PropTypes.func.isRequired,
  busRetour: PropTypes.array.isRequired,
  busVersOnAir: PropTypes.array.isRequired,
}
