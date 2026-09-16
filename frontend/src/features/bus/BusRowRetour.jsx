import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'
import WalkFigure from './WalkFigure'
import BusDepartSalle from './BusDepartSalle'

export default function BusRowRetour({ bus, ouvert, onToggle, maintenant }) {
  return (
    <li
      className={`bus-rentre-item${ouvert ? ' bus-rentre-ouvert' : ''}`}
      data-bus-id={bus.id}
      data-arret={bus.arret}
      data-marche={bus.marcheMinutes ?? ''}
    >
      <button
        type="button"
        className="bus-rentre-toggle"
        aria-expanded={ouvert}
        aria-label={`Détails du bus ${bus.ligne} à ${bus.departFormate}`}
        onClick={onToggle}
      >
        <div className="bus-vers-onair-ligne bus-rentre-grille">
          <strong
            className="bus-ligne bus-ligne-petite bvo-c1 bvo-r1"
            style={{ '--ligne-fond': bus.couleur, '--ligne-texte': bus.couleurTexte }}
          >
            {bus.ligne}
          </strong>
          <span className="bus-quai-badge bus-rentre-arret bvo-c1 bvo-r2">{bus.arret}</span>

          <span className={`bus-vers-onair-marche-icone bvo-c2 bvo-r1${bus.marcheDepassee ? ' alerte-clignotante' : ''}`}>
            <WalkFigure size={16} />
          </span>
          {bus.marcheMinutes != null && (
            <small className={`bus-vers-onair-marche-temps bvo-c2 bvo-r2${bus.marcheDepassee ? ' alerte-clignotante' : ''}`}>
              {bus.marcheMinutes} min
            </small>
          )}

          <strong className="bus-option-heure bus-rentre-heure bvo-c3 bvo-r1">
            {bus.departFormate}
            {bus.retardHayette > 0 && <em className="bus-retard">+{bus.retardHayette}</em>}
          </strong>
          <small className="bus-vers-onair-compte bvo-c3 bvo-r2">
            <Icon name="minuteur" size={9} /> {bus.dansXMin}
          </small>

          <span className="bus-option-arret bvo-c4 bvo-r1">Meaux</span>
          <span className="bus-vers-onair-arrivee bvo-c4 bvo-r2">
            <Icon name="train" size={13} /> {bus.arriveeFormatee}
          </span>
        </div>

        <div className="bus-rentre-anim bus-rentre-anim-compte">
          <BusDepartSalle cible={bus.momentArretSalle} maintenant={maintenant} />
        </div>
      </button>
    </li>
  )
}

BusRowRetour.propTypes = {
  bus: PropTypes.object.isRequired,
  ouvert: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  maintenant: PropTypes.number.isRequired,
}
