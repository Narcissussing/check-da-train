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

// Alterne entre deux noms de classe (animations identiques mais
// distinctes) pour redémarrer l'effet à chaque tap sans jamais forcer
// de reflow (void el.offsetWidth) — ce dernier a des effets de bord
// imprévisibles sur du vieux WebKit.
function declencherFlash(calque, prefixe) {
  const classeA = prefixe + "-a";
  const classeB = prefixe + "-b";
  const suivante = calque.classList.contains(classeA) ? classeB : classeA;
  calque.classList.remove(classeA, classeB);
  calque.classList.add(suivante);
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
    declencherFlash(obtenirCalque(carte, "orage-flash"), "orage-flash-actif");

    clearTimeout(carte._minuterieSecousse);
    carte.classList.add("orage-secousse");
    carte._minuterieSecousse = setTimeout(() => {
      carte.classList.remove("orage-secousse");
    }, 400);
    return;
  }

  if (scene === "brouillard") {
    declencherFlash(carte, "brouillard-flou");
    return;
  }

  if (scene === "calme") {
    declencherFlash(obtenirCalque(carte, "calme-flash"), "calme-flash-actif");
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
