// Comme les autres panneaux "tucked away", la date exacte de pluie se
// referme toute seule après 10 secondes si elle n'a pas été refermée à la
// main.
// Pas de séparateur numérique (10_000) : Safari 12 rejette tout le
// fichier au parsing sans lui — bug LL-7. Écrit en toutes lettres.
const DUREE_AUTO_FERMETURE_MS = 10000;
let minuterie;

document.addEventListener("click", (event) => {
  const pluie = event.target.closest(".pluie-toggle:not([disabled])");
  if (!pluie) return;

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
