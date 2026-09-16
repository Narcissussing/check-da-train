import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'
import WeatherBackground from './WeatherBackground'
import useWeatherReactions from './useWeatherReactions'
import useSleepMode from '../../context/SleepModeContext'
import useSommeilFade from '../../hooks/useSommeilFade'
import { iconeMeteo, sceneMeteo, couleurTemperature } from '../../utils/icons'

export default function WeatherCard({ meteo, meteoActuelleTexte, meteoDemainTexte, prochainePluieTrilport }) {
  const { current, daily } = meteo
  const scene = sceneMeteo(current.weather_code, current.is_day === 1)
  const couleur = couleurTemperature(current.temperature_2m)
  const pluieEnCours = prochainePluieTrilport?.resume === 'Pluie en cours'
  const reactions = useWeatherReactions(scene)
  const estHorsLigne = useSleepMode()
  const classeFade = useSommeilFade(estHorsLigne)

  const codeDemain = daily.weather_code?.[1]
  const meteoDemain =
    codeDemain !== undefined
      ? {
          code: codeDemain,
          max: Math.round(daily.temperature_2m_max[1]),
          min: Math.round(daily.temperature_2m_min[1]),
        }
      : null

  const classesCard = [
    'carte',
    'carte-meteo',
    estHorsLigne && 'hors-ligne',
    classeFade,
    reactions.accelere && 'vitesse-active',
    reactions.accelere && 'couleur-tap-active',
    reactions.secousse && 'orage-secousse',
    reactions.flouBrouillard && `brouillard-flou-${reactions.flouBrouillard}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={classesCard}
      data-scene={scene}
      style={{ '--couleur-icone-meteo': couleur }}
      onClick={reactions.handleCardClick}
    >
      <WeatherBackground scene={scene} temperature={current.temperature_2m} />

      {scene === 'orage' && (
        <div className={`orage-flash${reactions.flashOrage ? ` orage-flash-actif-${reactions.flashOrage}` : ''}`} />
      )}
      {scene === 'calme' && (
        <div className={`calme-flash${reactions.flashCalme ? ` calme-flash-actif-${reactions.flashCalme}` : ''}`} />
      )}

      <div className="carte-meteo-haut carte-meteo-haut-actuel">
        <div className="carte-meteo-icone" style={{ color: couleur }}>
          <Icon name={iconeMeteo(current.weather_code, current.is_day === 1)} size={56} temperature={current.temperature_2m} />
        </div>
        <div>
          <p className="temp">{Math.round(current.temperature_2m)}°</p>
          <p className="condition">{meteoActuelleTexte}</p>
          <p className="ressenti">Ressenti {Math.round(current.apparent_temperature)}°</p>
        </div>
      </div>

      {meteoDemain && (
        <div className="carte-meteo-haut carte-meteo-haut-demain" hidden={!estHorsLigne}>
          <div className="carte-meteo-icone" style={{ color: couleurTemperature(meteoDemain.max) }}>
            <Icon name={iconeMeteo(meteoDemain.code, true)} size={56} />
          </div>
          <div>
            <p className="temp">
              {meteoDemain.max}° <span className="temp-min-demain">{meteoDemain.min}°</span>
            </p>
            <p className="condition">{meteoDemainTexte}</p>
            <p className="ressenti">Demain</p>
          </div>
        </div>
      )}

      <div className="carte-meteo-stats">
        <div className="stat">
          <span>Max</span>
          <strong>{Math.round(daily.temperature_2m_max[0])}°</strong>
        </div>
        <div className="stat">
          <span>Min</span>
          <strong>{Math.round(daily.temperature_2m_min[0])}°</strong>
        </div>
        <div className="stat">
          <span>Humidité</span>
          <strong>{Math.round(current.relative_humidity_2m)}%</strong>
        </div>
        <div className="stat">
          <span>Vent</span>
          <strong>{Math.round(current.wind_speed_10m)} km/h</strong>
        </div>
      </div>

      {prochainePluieTrilport && (
        <button
          className={[
            'pluie-toggle',
            pluieEnCours && 'pluie-toggle-encours',
            reactions.pluieOuverte && 'ouverte',
            reactions.pluieAcceleree && 'pluie-interaction-active',
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
          aria-expanded={reactions.pluieOuverte || reactions.pluieAcceleree}
          disabled={!prochainePluieTrilport.dateExacte && !pluieEnCours}
          onClick={(event) => {
            event.stopPropagation()
            reactions.handlePluieClick(pluieEnCours)
          }}
        >
          <Icon name="goutte" size={14} />
          <span className="pluie-libelle-conteneur">
            <span className="pluie-libelle">Pluie : {prochainePluieTrilport.resume.toLowerCase()}</span>
            {pluieEnCours && (
              <span className="pluie-mini-anim" aria-hidden="true">
                <span className="pluie-mini-goutte" />
                <span className="pluie-mini-goutte" />
                <span className="pluie-mini-goutte" />
              </span>
            )}
            {prochainePluieTrilport.dateExacte && <small>{prochainePluieTrilport.dateExacte}</small>}
          </span>
        </button>
      )}
    </article>
  )
}

WeatherCard.propTypes = {
  meteo: PropTypes.shape({
    current: PropTypes.object.isRequired,
    daily: PropTypes.object.isRequired,
  }).isRequired,
  meteoActuelleTexte: PropTypes.string,
  meteoDemainTexte: PropTypes.string,
  prochainePluieTrilport: PropTypes.shape({
    resume: PropTypes.string,
    dateExacte: PropTypes.string,
  }),
}
