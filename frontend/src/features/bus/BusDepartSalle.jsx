import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'

function formaterHeureDepartSalle(iso) {
  return new Date(iso)
    .toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h')
}

function formaterCompteARebours(msRestants) {
  const total = Math.max(0, Math.round(msRestants / 1000))
  const minutes = Math.floor(total / 60)
  const secondes = total % 60
  return `${minutes}:${String(secondes).padStart(2, '0')}`
}

export default function BusDepartSalle({ cible, maintenant }) {
  if (!cible) {
    return (
      <div className="bus-depart-salle">
        <span className="bus-depart-salle-libelle">Lâcher les machines</span>
        <span className="bus-depart-salle-heure-groupe">
          <strong className="bus-depart-salle-valeur">--h--</strong>
          <small className="bus-depart-salle-compte">
            <Icon name="minuteur" size={9} /> <span className="bus-depart-salle-compte-valeur">--:--</span>
          </small>
        </span>
      </div>
    )
  }

  const cibleMs = new Date(cible).getTime()
  const passe = cibleMs <= maintenant

  return (
    <div className={`bus-depart-salle${passe ? ' bus-depart-salle-passe' : ''}`}>
      <span className="bus-depart-salle-libelle">Lâcher les machines</span>
      <span className="bus-depart-salle-heure-groupe">
        <strong className="bus-depart-salle-valeur">{formaterHeureDepartSalle(cible)}</strong>
        <small className="bus-depart-salle-compte">
          <Icon name="minuteur" size={9} />{' '}
          <span className="bus-depart-salle-compte-valeur">{formaterCompteARebours(cibleMs - maintenant)}</span>
        </small>
      </span>
    </div>
  )
}

BusDepartSalle.propTypes = {
  cible: PropTypes.string,
  maintenant: PropTypes.number.isRequired,
}
