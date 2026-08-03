// Comme les autres panneaux "tucked away", la date exacte de pluie se
// referme toute seule après 10 secondes si elle n'a pas été refermée à la
// main.
// Pas de séparateur numérique (10_000) : Safari 12 rejette tout le
// fichier au parsing sans lui — bug LL-7. Écrit en toutes lettres.
const DUREE_AUTO_FERMETURE_MS = 10000;
let minuterie;
let minuteriesAcceleration = [];

function nettoyerAcceleration(carte) {
  minuteriesAcceleration.forEach(clearTimeout);
  minuteriesAcceleration = [];
  carte.classList.remove(
    "pluie-vitesse-rapide",
    "pluie-vitesse-moyenne",
    "pluie-vitesse-douce"
  );
}

function accelererPluie(pluie) {
  const carte = pluie.closest(".carte-meteo");
  if (!carte) return;

  nettoyerAcceleration(carte);
  pluie.classList.add("pluie-interaction-active");
  pluie.setAttribute("aria-expanded", "true");
  carte.classList.add("pluie-vitesse-rapide");

  minuteriesAcceleration.push(setTimeout(() => {
    carte.classList.remove("pluie-vitesse-rapide");
    carte.classList.add("pluie-vitesse-moyenne");
  }, 1200));

  minuteriesAcceleration.push(setTimeout(() => {
    carte.classList.remove("pluie-vitesse-moyenne");
    carte.classList.add("pluie-vitesse-douce");
  }, 2800));

  minuteriesAcceleration.push(setTimeout(() => {
    nettoyerAcceleration(carte);
    pluie.classList.remove("pluie-interaction-active");
    pluie.setAttribute("aria-expanded", "false");
  }, 4800));
}

document.addEventListener("click", (event) => {
  const pluie = event.target.closest(".pluie-toggle:not([disabled])");
  if (!pluie) return;

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
});
