// Bascule générique pour les panneaux "tucked away" (départs, arrivées,
// créneaux gym, détails trafic, travaux) : un bouton [data-toggle-target]
// ouvre/ferme l'élément #id correspondant via la classe .ouvert.
// Un panneau ouvert se referme tout seul après 10 secondes, pour ne pas
// laisser l'écran encombré sur l'affichage toujours allumé (iPad mural).
const DUREE_AUTO_FERMETURE_MS = 10_000;
const minuteries = new WeakMap();

function fermer(bouton, cible) {
  bouton.classList.remove("ouvert");
  cible.classList.remove("ouvert");
  bouton.setAttribute("aria-expanded", "false");
  clearTimeout(minuteries.get(bouton));
  minuteries.delete(bouton);
}

function ouvrir(bouton, cible) {
  bouton.classList.add("ouvert");
  cible.classList.add("ouvert");
  bouton.setAttribute("aria-expanded", "true");

  clearTimeout(minuteries.get(bouton));
  minuteries.set(
    bouton,
    setTimeout(() => fermer(bouton, cible), DUREE_AUTO_FERMETURE_MS),
  );
}

document.addEventListener("click", (event) => {
  // Bouton "×" dédié à l'intérieur d'un popup : ferme explicitement,
  // plutôt que de réutiliser [data-toggle-target] (qui, sur un second
  // bouton distinct du déclencheur d'origine, rouvrirait au lieu de
  // fermer — .ouvert n'est posé que sur le bouton qui a ouvert le panneau).
  const fermeture = event.target.closest("[data-close-target]");
  if (fermeture) {
    const cible = document.getElementById(fermeture.dataset.closeTarget);
    const boutonOuvrant =
      cible &&
      document.querySelector(`[data-toggle-target="${cible.id}"]`);
    if (cible && boutonOuvrant) fermer(boutonOuvrant, cible);
    return;
  }

  const bouton = event.target.closest("[data-toggle-target]");
  if (bouton) {
    const cible = document.getElementById(bouton.dataset.toggleTarget);
    if (!cible) return;

    if (bouton.classList.contains("ouvert")) {
      fermer(bouton, cible);
    } else {
      ouvrir(bouton, cible);
    }
    return;
  }

  // Un tap n'importe où à l'intérieur d'un panneau déjà ouvert relance sa
  // minuterie de 10s (ex. : lire/taper les créneaux gym) — sinon un délai
  // fixe coupe quelqu'un encore en train de l'utiliser. Ne touche que CE
  // panneau : closest() le scope à celui réellement tapé, les autres
  // ouverts en parallèle gardent leur propre minuterie.
  const panneauOuvert = event.target.closest(".disclosure.ouvert");
  if (!panneauOuvert || !panneauOuvert.id) return;

  const boutonAssocie = document.querySelector(
    `[data-toggle-target="${panneauOuvert.id}"]`,
  );
  if (!boutonAssocie) return;

  // Popups (.popup-fond) : le fond assombri EST le panneau lui-même, le
  // contenu réel est un enfant (.popup-boite). Taper précisément sur le
  // fond (pas sur son contenu) ferme le popup, comme une modale classique
  // — sinon (tap dans le contenu), on retombe sur le simple reset de
  // minuterie ci-dessus.
  if (
    panneauOuvert.classList.contains("popup-fond") &&
    event.target === panneauOuvert
  ) {
    fermer(boutonAssocie, panneauOuvert);
    return;
  }

  ouvrir(boutonAssocie, panneauOuvert);
});

// Exposé pour refresh.js : rouvrir un panneau après remplacement du DOM
// doit repartir sur la même minuterie de 10s, pas rester ouvert indéfiniment.
window.disclosure = { ouvrir, fermer };
