// Délai sans séparateur numérique pour Safari iOS 12.
const DUREE_AUTO_FERMETURE_MS = 10000;
const DUREE_REACTION_MS = 3000;
let minuterie;
let minuterieAcceleration;

function nettoyerAcceleration(carte) {
  clearTimeout(minuterieAcceleration);
  carte.classList.remove("vitesse-active");
}

// Un seul multiplicateur (--vitesse-meteo, lu par toutes les animations
// météo en CSS) accélère la scène affichée sans en démarrer une autre.
// Un seul palier (pas de décroissance en plusieurs étapes) : chaque
// changement de --vitesse-meteo force le recalcul de toutes les
// animations qui en dépendent (gouttes, flocons, nuages…) — moins de
// changements = moins d'à-coups sur du matériel ancien.
function accelererScene(carte) {
  nettoyerAcceleration(carte);
  carte.classList.add("vitesse-active");
  minuterieAcceleration = setTimeout(() => {
    nettoyerAcceleration(carte);
  }, DUREE_REACTION_MS);
}

function obtenirCalque(carte, classe) {
  let calque = carte.querySelector("." + classe);
  if (!calque) {
    calque = document.createElement("div");
    calque.className = classe;
    carte.appendChild(calque);
  }
  return calque;
}

function accelererPluie(pluie) {
  const carte = pluie.closest(".carte-meteo");
  if (!carte) return;

  pluie.classList.add("pluie-interaction-active");
  pluie.setAttribute("aria-expanded", "true");
  accelererScene(carte);

  clearTimeout(pluie._minuterieRestauration);
  pluie._minuterieRestauration = setTimeout(() => {
    pluie.classList.remove("pluie-interaction-active");
    pluie.setAttribute("aria-expanded", "false");
  }, DUREE_REACTION_MS);
}

// Réaction au toucher de la carte entière : la scène affichée accélère ;
// l'orage ajoute en plus un vrai coup de foudre, le calme (pas de fond
// animé) un éclat bref sur la carte elle-même.
function reagirMeteo(carte) {
  const scene = carte.dataset.scene;
  accelererScene(carte);

  if (scene === "orage") {
    // Reflow forcé uniquement sur le petit calque isolé (pas sur toute
    // la carte, qui contient les animations météo en cours — coûteux
    // à recalculer sur du matériel ancien).
    const flash = obtenirCalque(carte, "orage-flash");
    flash.classList.remove("orage-flash-actif");
    void flash.offsetWidth;
    flash.classList.add("orage-flash-actif");

    carte.classList.remove("orage-secousse");
    carte.classList.add("orage-secousse");
    return;
  }

  if (scene === "calme") {
    const flash = obtenirCalque(carte, "calme-flash");
    flash.classList.remove("calme-flash-actif");
    void flash.offsetWidth;
    flash.classList.add("calme-flash-actif");
  }
}

document.addEventListener("click", (event) => {
  const pluie = event.target.closest(".pluie-toggle:not([disabled])");
  if (pluie) {
    if (pluie.classList.contains("pluie-toggle-encours")) {
      accelererPluie(pluie);
      return;
    }

    const estOuvert = pluie.classList.toggle("ouverte");
    pluie.setAttribute("aria-expanded", String(estOuvert));

    clearTimeout(minuterie);
    if (estOuvert) {
      minuterie = setTimeout(() => {
        pluie.classList.remove("ouverte");
        pluie.setAttribute("aria-expanded", "false");
      }, DUREE_AUTO_FERMETURE_MS);
    }
    return;
  }

  const carte = event.target.closest(".carte-meteo");
  if (carte) reagirMeteo(carte);
});
