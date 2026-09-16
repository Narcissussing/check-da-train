import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'
import Popup from '../../components/Popup'
import useBusPopupState from './useBusPopupState'
import BusRowRetour from './BusRowRetour'
import BusRowVersOnAir from './BusRowVersOnAir'
import BusFiltreControles from './BusFiltreControles'

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

export default function BusPopup({ open, onClose, onInsideClick, busRetour, busVersOnAir }) {
  const etat = useBusPopupState()
  const [maintenant, setMaintenant] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const arretsRetour = [...new Set(busRetour.map((b) => b.arret).filter(Boolean))]
  const arretsVersOnAir = [...new Set(busVersOnAir.map((b) => b.arretDescente).filter(Boolean))]

  const listeRetour = filtrerEtTrier(
    busRetour,
    etat.filtres['onair-meaux'],
    (b) => b.arret,
    (b) => Number(b.marcheMinutes),
  )
  const listeVersOnAir = filtrerEtTrier(
    busVersOnAir,
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
      <>
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
          {busRetour.length > 0 ? (
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
            {busVersOnAir.length > 0 ? (
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
                    />
                  ))}
                </ul>
              </>
            ) : (
              <p className="bus-indisponible">Aucun passage disponible actuellement.</p>
            )}
          </div>
        </div>
      </>
    </Popup>
  )
}

BusPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onInsideClick: PropTypes.func,
  busRetour: PropTypes.array.isRequired,
  busVersOnAir: PropTypes.array.isRequired,
}
