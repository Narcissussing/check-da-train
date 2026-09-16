import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'
import Popup from '../../components/Popup'
import { iconeVerdict } from '../../utils/icons'

export default function GymPopup({ open, onClose, onInsideClick, trajetsGymTous, gymCacheAujourdhui, onSelect }) {
  const sousCreneauxTous = trajetsGymTous.reduce((tous, groupe) => tous.concat(groupe.sousCreneaux), [])

  return (
    <Popup id="gym-popup" open={open} onClose={onClose} onInsideClick={onInsideClick}>
      <button
        className="popup-fermer"
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        aria-label="Fermer"
      >
        <Icon name="fermer" size={16} />
      </button>
      <p className="popup-titre">Tous les trajets possibles</p>
      <ul className="gym-alternatives gym-popup-liste">
        {sousCreneauxTous.map((t) => {
          const selectionnable = !gymCacheAujourdhui
          function activer() {
            if (!selectionnable) return
            onSelect(t)
          }
          return (
            <li
              key={`${t.aller.heure}-${t.retour.heure}`}
              className="gym-alternative"
              role={selectionnable ? 'button' : undefined}
              tabIndex={selectionnable ? 0 : undefined}
              onClick={activer}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                activer()
              }}
            >
              <Icon name={iconeVerdict(t.meteo.verdicts)} size={12} />
              <span className="gym-alternative-meteo">{t.meteo.resumeSansEmoji}</span>
              <span className="gym-alternative-heures">
                {t.depart.heureFormatee} → {t.departSalleFormatee}
              </span>
              <span className="gym-alternative-duree">{t.dureeFormatee}</span>
            </li>
          )
        })}
      </ul>
    </Popup>
  )
}

GymPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onInsideClick: PropTypes.func,
  trajetsGymTous: PropTypes.array.isRequired,
  gymCacheAujourdhui: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
}
