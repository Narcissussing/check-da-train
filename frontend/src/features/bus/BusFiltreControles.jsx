import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'

export default function BusFiltreControles({ id, arrets, filtre, visibles, onFiltrer, onTrier }) {
  return (
    <div
      id={id}
      className={`bus-rentre-controles${visibles ? '' : ' bus-controles-cache'}`}
      hidden={!visibles}
    >
      <div className="bus-filtre-chips" role="group" aria-label="Filtrer par arrêt">
        <button
          type="button"
          className={`bus-filtre-chip${filtre.arret === 'tous' ? ' actif' : ''}`}
          onClick={() => onFiltrer('tous')}
        >
          Tous
        </button>
        {arrets.map((arret) => (
          <button
            key={arret}
            type="button"
            className={`bus-filtre-chip${filtre.arret === arret ? ' actif' : ''}`}
            onClick={() => onFiltrer(arret)}
          >
            {arret}
          </button>
        ))}
      </div>
      <button type="button" className={`bus-tri-bouton${filtre.tri === 'marche' ? ' actif' : ''}`} onClick={onTrier}>
        <Icon name="marche" size={13} />{' '}
        <span className="bus-tri-texte">{filtre.tri === 'marche' ? 'Trier par heure' : 'Trier par marche'}</span>
      </button>
    </div>
  )
}

BusFiltreControles.propTypes = {
  id: PropTypes.string.isRequired,
  arrets: PropTypes.arrayOf(PropTypes.string).isRequired,
  filtre: PropTypes.shape({ arret: PropTypes.string, tri: PropTypes.string }).isRequired,
  visibles: PropTypes.bool.isRequired,
  onFiltrer: PropTypes.func.isRequired,
  onTrier: PropTypes.func.isRequired,
}
