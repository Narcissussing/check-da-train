import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../../components/Icon/Icon'
import useDisclosure from '../../hooks/useDisclosure'
import useGymRotation from './useGymRotation'
import useGymTermine from './useGymTermine'
import useGymLock from './useGymLock'
import GymPopup from './GymPopup'
import { iconeMeteo, iconeVerdict } from '../../utils/icons'

function ColonneUnique({ sousCreneau }) {
  const s = sousCreneau
  return (
    <div className="gym-colonnes">
      <div className="gym-col">
        <div className="gym-sous-stack" data-champ="depart">
          <div className="gym-sous gym-sous-active">
            <span>Départ</span>
            <strong>{s.depart.heureFormatee}</strong>
            {s.depart.estime && <small className="gym-estime gym-estime-ligne">estimé</small>}
            <small className="gym-col-train">
              {s.aller.heureFormatee}
              {s.aller.ecartMinutes >= 3 && <span className="gym-retard">+{s.aller.ecartMinutes}min</span>}
              <Icon name="train" size={13} />
            </small>
          </div>
        </div>
      </div>
      <div className="gym-col">
        <span>Météo</span>
        <strong className="gym-col-verdict">
          <Icon name={iconeVerdict(s.meteo.verdicts)} size={17} /> {s.meteo.resumeSansEmoji}
        </strong>
        <div className="gym-sous-stack" data-champ="duree">
          <small className="gym-sous gym-sous-active gym-col-duree">{s.dureeFormatee} à la salle</small>
        </div>
      </div>
      <div className="gym-col">
        <div className="gym-sous-stack" data-champ="retour">
          <div className="gym-sous gym-sous-active">
            <span>{s.procheDuMax ? 'Partir avant' : 'Retour'}</span>
            <strong>{s.departSalleFormatee}</strong>
            {s.retour.estime && <small className="gym-estime gym-estime-ligne">estimé</small>}
            <small className="gym-col-train">
              <Icon name="train" size={13} />
              {s.retour.heureFormatee}
              {s.retour.ecartMinutes >= 3 && <span className="gym-retard">+{s.retour.ecartMinutes}min</span>}
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

ColonneUnique.propTypes = {
  sousCreneau: PropTypes.object.isRequired,
}

export default function GymCard({
  meteoMeaux,
  departsRetourEntete,
  statutRetourMeaux,
  trajetsGym,
  trajetsGymTous,
  gymCacheAujourdhui,
  estDimancheAujourdhui,
  gymVerrouilleActif,
}) {
  const rotation = useGymRotation(trajetsGym)
  const lock = useGymLock({ trajetsGymTous, gymVerrouilleActif })
  const popup = useDisclosure()
  const premierRetour = departsRetourEntete?.[0]

  const [overrideCache, setOverrideCache] = useState(null)
  useEffect(() => setOverrideCache(null), [gymCacheAujourdhui])
  const cacheEffectif = overrideCache ?? gymCacheAujourdhui

  const termine = useGymTermine({
    gymCacheAujourdhui: cacheEffectif,
    estDimancheAujourdhui,
    onToggled: setOverrideCache,
  })

  const LIBELLES_STATUT = {
    indisponible: 'Indisponible',
    attente: 'En attente',
    bientot: 'Reprise bientôt',
    termine: 'Fin de service',
  }

  const classesCarte = ['carte', 'carte-gym', cacheEffectif && 'gym-termine', termine.secousseClasse && `gym-secousse-${termine.secousseClasse}`]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classesCarte}>
      <div className="carte-gym-entete">
        <button
          className="gym-bouton-termine"
          type="button"
          id="gym-bouton-termine"
          aria-pressed={cacheEffectif}
          data-est-dimanche={estDimancheAujourdhui}
          aria-label={estDimancheAujourdhui ? 'Voir les trajets malgré le jour de repos' : 'Marquer la séance comme terminée'}
          onClick={termine.handleClick}
        >
          <span className="eyebrow">
            <Icon name="haltere" size={15} /> Gym
          </span>
        </button>
        <div className="gym-entete-droite">
          {meteoMeaux && (
            <span className="meaux-meteo">
              <Icon
                name={iconeMeteo(meteoMeaux.current.weather_code, meteoMeaux.current.is_day === 1)}
                size={15}
                temperature={meteoMeaux.current.temperature_2m}
              />
              Meaux {Math.round(meteoMeaux.current.temperature_2m)}°
            </span>
          )}

          {premierRetour ? (
            <span className={`meaux-retour${premierRetour.retardNiveau ? ` meaux-retour-${premierRetour.retardNiveau}` : ''}`}>
              <Icon name="train" size={13} />
              {premierRetour.heureFormatee}
              {premierRetour.ponctualiteLibelle && (
                <span className="meaux-retour-ponct">{premierRetour.ponctualiteLibelle}</span>
              )}
            </span>
          ) : (
            <span className={`meaux-retour meaux-retour-${statutRetourMeaux}`}>
              <Icon name="train" size={13} />
              {LIBELLES_STATUT[statutRetourMeaux] ?? LIBELLES_STATUT.termine}
            </span>
          )}

          {trajetsGymTous?.length > 0 && (
            <button
              className="gym-bouton-popup"
              type="button"
              aria-expanded={popup.open}
              aria-label="Voir tous les trajets"
              onClick={popup.show}
            >
              <Icon name="liste" size={14} />
            </button>
          )}
        </div>
      </div>

      {estDimancheAujourdhui ? (
        <p className="gym-termine-message gym-repos-message">
          <span className="gym-repos-texte">{termine.texteRepos ?? 'Jour de repos.'}</span>
          <span className="gym-zzz" aria-hidden="true">
            <span>Z</span>
            <span>Z</span>
            <span>Z</span>
          </span>
        </p>
      ) : (
        <p className="gym-termine-message">Séance faite pour aujourd'hui.</p>
      )}

      <div className="gym-corps">
        {!trajetsGym || trajetsGym.length === 0 ? (
          <p className="gym-indisponible">Aucun trajet disponible.</p>
        ) : (
          <>
            <div className="gym-fenetres" onClick={rotation.handleTapFenetres}>
              {trajetsGym.map((t, i) => {
                const ecart = (i - rotation.indexFenetre + trajetsGym.length) % trajetsGym.length
                const dataEtat = ecart === 0 ? undefined : ecart === 1 ? 'suivante' : 'precedente'
                const estActive = i === rotation.indexFenetre
                return (
                  <div
                    key={t.expirationHeure}
                    className={`gym-fenetre${estActive ? ' gym-fenetre-active' : ''}`}
                    data-expire={t.expirationHeure}
                    data-etat={dataEtat}
                  >
                    {estActive && lock.selectedTrajet ? (
                      <ColonneUnique sousCreneau={lock.selectedTrajet} />
                    ) : (
                      <div className="gym-colonnes">
                        <div className="gym-col">
                          <div className="gym-sous-stack" data-champ="depart">
                            {t.sousCreneaux.map((s, j) => (
                              <div
                                key={j}
                                className={`gym-sous${estActive && j === rotation.indexSous ? ' gym-sous-active' : ''}`}
                              >
                                <span>Départ</span>
                                <strong>{s.depart.heureFormatee}</strong>
                                {s.depart.estime && <small className="gym-estime gym-estime-ligne">estimé</small>}
                                <small className="gym-col-train">
                                  {s.aller.heureFormatee}
                                  {s.aller.ecartMinutes >= 3 && <span className="gym-retard">+{s.aller.ecartMinutes}min</span>}
                                  <Icon name="train" size={13} />
                                </small>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="gym-col">
                          <span>Météo</span>
                          <strong className="gym-col-verdict">
                            <Icon name={iconeVerdict(t.meteo.verdicts)} size={17} /> {t.meteo.resumeSansEmoji}
                          </strong>
                          <div className="gym-sous-stack" data-champ="duree">
                            {t.sousCreneaux.map((s, j) => (
                              <small
                                key={j}
                                className={`gym-sous${estActive && j === rotation.indexSous ? ' gym-sous-active' : ''} gym-col-duree`}
                              >
                                {s.dureeFormatee} à la salle
                              </small>
                            ))}
                          </div>
                        </div>
                        <div className="gym-col">
                          <div className="gym-sous-stack" data-champ="retour">
                            {t.sousCreneaux.map((s, j) => (
                              <div
                                key={j}
                                className={`gym-sous${estActive && j === rotation.indexSous ? ' gym-sous-active' : ''}`}
                              >
                                <span>{s.procheDuMax ? 'Partir avant' : 'Retour'}</span>
                                <strong>{s.departSalleFormatee}</strong>
                                {s.retour.estime && <small className="gym-estime gym-estime-ligne">estimé</small>}
                                <small className="gym-col-train">
                                  <Icon name="train" size={13} />
                                  {s.retour.heureFormatee}
                                  {s.retour.ecartMinutes >= 3 && <span className="gym-retard">+{s.retour.ecartMinutes}min</span>}
                                </small>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {trajetsGym.length > 1 && (
              <ul className={`gym-alternatives gym-alternatives-${Math.min(trajetsGym.length - 1, 2)}`}>
                {trajetsGym.map((t, i) => (
                  <li
                    key={t.expirationHeure}
                    className={`gym-alternative${i === rotation.indexFenetre ? ' gym-alternative-cachee' : ''}`}
                    data-index={i}
                  >
                    <Icon name={iconeVerdict(t.meteo.verdicts)} size={12} />
                    <span className="gym-alternative-meteo">{t.meteo.resumeSansEmoji}</span>
                    <span className="gym-alternative-heures">
                      {t.depart.heureFormatee} → {t.departSalleFormatee}
                    </span>
                    <span className="gym-alternative-duree">{t.dureeFormatee}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {trajetsGymTous?.length > 0 && (
        <GymPopup
          open={popup.open}
          onClose={popup.hide}
          onInsideClick={popup.resetTimer}
          trajetsGymTous={trajetsGymTous}
          gymCacheAujourdhui={cacheEffectif}
          onSelect={(sousCreneau) => {
            lock.selectionner(sousCreneau)
            popup.hide()
          }}
        />
      )}
    </section>
  )
}

GymCard.propTypes = {
  meteoMeaux: PropTypes.object,
  departsRetourEntete: PropTypes.array,
  statutRetourMeaux: PropTypes.string.isRequired,
  trajetsGym: PropTypes.array,
  trajetsGymTous: PropTypes.array,
  gymCacheAujourdhui: PropTypes.bool,
  estDimancheAujourdhui: PropTypes.bool,
  gymVerrouilleActif: PropTypes.shape({
    allerHeure: PropTypes.string,
    retourHeure: PropTypes.string,
    expireMs: PropTypes.number,
  }),
}
