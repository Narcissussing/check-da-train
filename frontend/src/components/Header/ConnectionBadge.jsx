import PropTypes from 'prop-types'
import Icon from '../Icon/Icon'

export default function ConnectionBadge({ estIpad, estHorsLigne, isPaused, isRevealed, onClick }) {
  if (!estIpad) {
    return <button type="button" className="connexion-etat connecte" id="hors-ligne-badge" hidden />
  }

  const classes = ['connexion-etat', estHorsLigne ? 'deconnecte' : 'connecte', isRevealed && 'revele']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      id="hors-ligne-badge"
      title={estHorsLigne ? 'Hors ligne — dernier état connu affiché' : 'Connexion au serveur'}
      aria-pressed={isPaused}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <Icon name="wifi" size={22} />
    </button>
  )
}

ConnectionBadge.propTypes = {
  estIpad: PropTypes.bool.isRequired,
  estHorsLigne: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  isRevealed: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
}
