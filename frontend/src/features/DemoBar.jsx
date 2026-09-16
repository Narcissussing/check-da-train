import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import Icon from '../components/Icon/Icon'
import { iconeMeteo } from '../utils/icons'

function GroupeSimple({ boutons, icone }) {
  return (
    <ul className="barre-demo-groupe">
      {boutons.map((bouton) => (
        <li key={bouton.href}>
          <Link to={bouton.href} className={`barre-demo-bouton${bouton.actif ? ' actif' : ''}`}>
            {icone}
            {bouton.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

GroupeSimple.propTypes = {
  boutons: PropTypes.arrayOf(
    PropTypes.shape({ href: PropTypes.string.isRequired, label: PropTypes.string.isRequired, actif: PropTypes.bool }),
  ).isRequired,
  icone: PropTypes.node,
}

export default function DemoBar({
  boutonsMeteo,
  boutonsTrafic,
  boutonsService,
  boutonsRetard,
  boutonsPluie,
  boutonsGym,
  boutonsRetourMeaux,
  reinitialiserHref,
  afficherReinitialiser,
}) {
  return (
    <section className="barre-demo" aria-label="Démo : forcer un état à l’affichage">
      <p className="barre-demo-titre">Démo</p>
      <ul className="barre-demo-groupe">
        {boutonsMeteo.map((bouton) => (
          <li key={bouton.href}>
            <Link to={bouton.href} className={`barre-demo-bouton${bouton.actif ? ' actif' : ''}`}>
              <Icon name={iconeMeteo(bouton.code, true)} size={15} temperature={bouton.temp} />
              {bouton.label}
            </Link>
          </li>
        ))}
      </ul>
      <ul className="barre-demo-groupe">
        {boutonsTrafic.map((bouton) => (
          <li key={bouton.href}>
            <Link to={bouton.href} className={`barre-demo-bouton barre-demo-bouton-${bouton.cle}${bouton.actif ? ' actif' : ''}`}>
              <span className="barre-demo-point" />
              {bouton.label}
            </Link>
          </li>
        ))}
      </ul>
      <GroupeSimple boutons={boutonsService} />
      <GroupeSimple boutons={boutonsRetard} />
      <GroupeSimple boutons={boutonsPluie} icone={<Icon name="goutte" size={14} />} />
      <GroupeSimple boutons={boutonsGym} icone={<Icon name="haltere" size={14} />} />
      <GroupeSimple boutons={boutonsRetourMeaux} icone={<Icon name="train" size={14} />} />
      {afficherReinitialiser && (
        <Link to={reinitialiserHref} className="barre-demo-bouton barre-demo-reinit">
          Réinitialiser
        </Link>
      )}
    </section>
  )
}

const boutonsShape = PropTypes.arrayOf(
  PropTypes.shape({ href: PropTypes.string.isRequired, label: PropTypes.string.isRequired, actif: PropTypes.bool }),
).isRequired

DemoBar.propTypes = {
  boutonsMeteo: boutonsShape,
  boutonsTrafic: boutonsShape,
  boutonsService: boutonsShape,
  boutonsRetard: boutonsShape,
  boutonsPluie: boutonsShape,
  boutonsGym: boutonsShape,
  boutonsRetourMeaux: boutonsShape,
  reinitialiserHref: PropTypes.string.isRequired,
  afficherReinitialiser: PropTypes.bool.isRequired,
}
