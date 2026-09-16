import PropTypes from 'prop-types'
import trainLigneP from '../../assets/images/train-ligne-p.png'
import trainEnPanne from '../../assets/images/train-en-panne.png'
import trainDort from '../../assets/images/train-dort.png'
import useSleepMode from '../../context/SleepModeContext'
import useSommeilFade from '../../hooks/useSommeilFade'

export default function TrainIllustration({ niveauTrafic, phaseServiceActuelle = 'actif' }) {
  const estHorsLigne = useSleepMode()
  const classeFade = useSommeilFade(estHorsLigne)
  const phaseEffective = estHorsLigne ? 'termine' : phaseServiceActuelle
  const endormi = phaseEffective === 'termine'
  const enPanne = !endormi && niveauTrafic === 'alerte'
  const ralenti = !enPanne && !endormi && (niveauTrafic === 'ailleurs' || niveauTrafic === 'info')
  const secoue = ralenti && niveauTrafic === 'ailleurs'

  const classes = ['illustration-train-conteneur']
  if (enPanne) classes.push('en-panne')
  if (endormi) classes.push('endormi')
  if (ralenti) classes.push('ralenti')
  if (secoue) classes.push('secoue')
  if (classeFade) classes.push(classeFade)

  const src = enPanne ? trainEnPanne : endormi ? trainDort : trainLigneP
  const alt = enPanne
    ? "Illustration d'un train Transilien Ligne P endommagé"
    : endormi
      ? "Illustration d'un train Transilien Ligne P à l'arrêt pour la nuit"
      : "Illustration d'un train Transilien Ligne P"

  return (
    <div className={classes.join(' ')}>
      <div className="illustration-train-glisseur">
        <img className="illustration-train-img" src={src} alt={alt} />
        {endormi && (
          <div className="train-zzz" aria-hidden="true">
            <span>Z</span>
            <span>Z</span>
            <span>Z</span>
          </div>
        )}
      </div>
    </div>
  )
}

TrainIllustration.propTypes = {
  niveauTrafic: PropTypes.string.isRequired,
  phaseServiceActuelle: PropTypes.string,
}
