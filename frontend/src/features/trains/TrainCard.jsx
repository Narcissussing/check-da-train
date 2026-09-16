import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'
import useDisclosure from '../../hooks/useDisclosure'
import useSleepMode from '../../context/SleepModeContext'
import useSommeilFade from '../../hooks/useSommeilFade'

const EYEBROWS = { depart: 'Départ', arrivee: 'Arrivée', rentre: 'Rentre' }
const VERBES = { depart: 'départs', arrivee: 'arrivées', rentre: 'retours' }
const LIBELLES_STATUT = {
  indisponible: 'Indisponible',
  attente: 'En attente',
  bientot: 'Reprise bientôt',
  termine: 'Fin de service',
}

export default function TrainCard({ variant, trains, niveauTrafic, statut, onOuvrirBus }) {
  const detail = useDisclosure()
  const premier = trains[0]
  const estHorsLigne = useSleepMode()
  const classeFade = useSommeilFade(estHorsLigne)
  const afficherContenuNormal = trains.length > 0 && !estHorsLigne

  const glow =
    niveauTrafic === 'alerte' || premier?.retardNiveau === 'fort'
      ? 'carte-glow-alerte'
      : premier?.retardNiveau === 'moyen'
        ? 'carte-glow-chaude'
        : ''

  const classeVariant =
    variant === 'depart'
      ? 'carte-depart'
      : variant === 'arrivee'
        ? 'carte-arrivee carte-arrivee-classique'
        : 'carte-arrivee carte-rentre-mobile'

  const destination = (train) => (variant === 'rentre' ? 'Trilport' : train.destination)

  return (
    <article className={['carte', 'carte-train', classeVariant, glow, classeFade].filter(Boolean).join(' ')}>
      <div className="carte-train-entete">
        <span className="carte-train-entete-gauche">
          <span className="eyebrow">{EYEBROWS[variant]}</span>
          {niveauTrafic === 'alerte' && (
            <span className="alerte-clignotante-conteneur">
              <span className="alerte-anneau" />
              <Icon name="alerte" size={18} className="alerte-clignotante" />
            </span>
          )}
        </span>
        {variant === 'rentre' && (
          <button
            className="rentre-bus-bouton"
            type="button"
            aria-expanded="false"
            aria-label="Voir les bus vers la gare de Meaux"
            onClick={onOuvrirBus}
          >
            <Icon name="bus" size={17} />
          </button>
        )}
        {premier && !estHorsLigne && <span className="countdown">{premier.compteAReboursFormate}</span>}
      </div>

      {afficherContenuNormal ? (
        <>
          <p className={`train-heure-principale ${variant === 'depart' ? 'succes' : 'danger'}`}>{premier.heureFormatee}</p>
          <p className="train-destination">
            {destination(premier)}
            {premier.ponctualiteLibelle && (
              <span className={`train-ponct-inline ${premier.ponctualiteClasse}`}>{premier.ponctualiteLibelle}</span>
            )}
          </p>
          <p className="train-puis" style={trains.length <= 1 ? { visibility: 'hidden' } : undefined}>
            puis {trains[1] ? trains[1].heureFormatee : '—'}
            {trains[2] && <> · {trains[2].heureFormatee}</>}
          </p>
        </>
      ) : trains.length > 0 ? (
        <span className="statut-service termine">Fin de service</span>
      ) : (
        <span className={`statut-service ${statut}`}>{LIBELLES_STATUT[statut] ?? LIBELLES_STATUT.termine}</span>
      )}

      {afficherContenuNormal && (
        <>
          <button
            className={`carte-train-toggle${detail.open ? ' ouvert' : ''}`}
            type="button"
            aria-expanded={detail.open}
            onClick={detail.toggle}
          >
            Voir {VERBES[variant]} <Icon name="chevron" size={15} className="fleche-toggle" />
          </button>
          <div
            className={`disclosure carte-train-details${detail.open ? ' ouvert' : ''}`}
            onClick={detail.open ? detail.resetTimer : undefined}
          >
            {trains.map((train, i) => (
              <div className="train-detail-ligne" key={`${train.heureFormatee}-${i}`}>
                <span className={`train-detail-heure ${train.ponctualiteClasse ?? ''}`}>{train.heureFormatee}</span>
                <span className="train-detail-dest">{destination(train)}</span>
                {train.ecartMinutes ? <span className="train-detail-ancienne">{train.heurePrevueFormatee}</span> : null}
                {train.ponctualiteLibelle && (
                  <span className={`train-detail-ponct ${train.ponctualiteClasse}`}>{train.ponctualiteLibelle}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  )
}

TrainCard.propTypes = {
  variant: PropTypes.oneOf(['depart', 'arrivee', 'rentre']).isRequired,
  trains: PropTypes.array.isRequired,
  niveauTrafic: PropTypes.string.isRequired,
  statut: PropTypes.string.isRequired,
  onOuvrirBus: PropTypes.func,
}
