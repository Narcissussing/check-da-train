import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'
import Popup from '../../components/Popup'
import useDisclosure from '../../hooks/useDisclosure'
import TrainIllustration from './TrainIllustration'

const TITRES_PAR_NIVEAU = {
  fluide: 'Trafic fluide',
  info: 'Perturbation sur la ligne P',
}

export default function TrafficCard({ niveauTrafic, phaseServiceActuelle, texteAlerte, detailAlerte, messageInfoRetard, prochaineTravaux, travauxFuturs }) {
  const trafic = useDisclosure()
  const travaux = useDisclosure()

  const titre =
    messageInfoRetard ??
    TITRES_PAR_NIVEAU[niveauTrafic] ??
    (niveauTrafic === 'ailleurs' || niveauTrafic === 'alerte'
      ? texteAlerte
      : 'Infos trafic temporairement indisponibles')

  return (
    <>
      <section className={`carte carte-trafic carte-trafic-${niveauTrafic}`}>
        {prochaineTravaux && (
          <button
            className="carte-trafic-icone-bouton carte-trafic-travaux-bouton"
            type="button"
            aria-expanded={travaux.open}
            aria-label="Travaux Ligne P"
            onClick={travaux.show}
          >
            <Icon name="travaux" size={16} />
          </button>
        )}

        <button
          className="carte-trafic-corps"
          type="button"
          disabled={!detailAlerte}
          aria-expanded={detailAlerte ? trafic.open : undefined}
          aria-label={detailAlerte ? 'Afficher les détails du trafic' : undefined}
          onClick={detailAlerte ? trafic.show : undefined}
        >
          <span className="statut-dot" />
          <div className="carte-trafic-texte">
            <p className="carte-trafic-titre">{titre}</p>
          </div>
        </button>

        <TrainIllustration niveauTrafic={niveauTrafic} phaseServiceActuelle={phaseServiceActuelle} />
      </section>

      {detailAlerte && (
        <Popup id="trafic-details" open={trafic.open} onClose={trafic.hide} onInsideClick={trafic.resetTimer}>
          <button
            className="popup-fermer"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              trafic.hide()
            }}
            aria-label="Fermer"
          >
            <Icon name="fermer" size={16} />
          </button>
          <p className="popup-titre">{texteAlerte}</p>
          <p>{detailAlerte.details}</p>
          {detailAlerte.trajet && <p className="panneau-meta">Trajet : {detailAlerte.trajet}</p>}
          {detailAlerte.debut && (
            <p className="panneau-meta">
              Du {detailAlerte.debutFormate} au {detailAlerte.finFormate}
            </p>
          )}
        </Popup>
      )}

      {prochaineTravaux && (
        <Popup id="travaux-details" open={travaux.open} onClose={travaux.hide} onInsideClick={travaux.resetTimer}>
          <button
            className="popup-fermer"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              travaux.hide()
            }}
            aria-label="Fermer"
          >
            <Icon name="fermer" size={16} />
          </button>
          <p className="popup-titre">Travaux Ligne P</p>
          {travauxFuturs.map((t) => (
            <p key={t.dateDebut + t.dateFin + (t.trajet ?? '')} className="panneau-travaux-item">
              {t.dateDebut} → {t.dateFin}
              {t.trajet && <> • {t.trajet}</>}
            </p>
          ))}
        </Popup>
      )}
    </>
  )
}

TrafficCard.propTypes = {
  niveauTrafic: PropTypes.string.isRequired,
  phaseServiceActuelle: PropTypes.string,
  texteAlerte: PropTypes.string,
  messageInfoRetard: PropTypes.string,
  detailAlerte: PropTypes.shape({
    details: PropTypes.string,
    trajet: PropTypes.string,
    debut: PropTypes.string,
    fin: PropTypes.string,
    debutFormate: PropTypes.string,
    finFormate: PropTypes.string,
  }),
  prochaineTravaux: PropTypes.object,
  travauxFuturs: PropTypes.array,
}
