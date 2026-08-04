// Panneaux refermés automatiquement après 10 secondes.
// Le littéral reste compatible avec Safari iOS 12.
const DUREE_AUTO_FERMETURE_MS = 10000;
const minuteries = new WeakMap();

function boutonsPour(cible) {
  return [].slice.call(
    document.querySelectorAll(`[data-toggle-target="${cible.id}"]`),
  );
}

function fermer(bouton, cible) {
  boutonsPour(cible).forEach((declencheur) => {
    declencheur.classList.remove("ouvert");
    declencheur.setAttribute("aria-expanded", "false");
    clearTimeout(minuteries.get(declencheur));
    minuteries.delete(declencheur);
  });
  cible.classList.remove("ouvert");
}

function ouvrir(bouton, cible) {
  boutonsPour(cible).forEach((declencheur) => {
    declencheur.classList.add("ouvert");
    declencheur.setAttribute("aria-expanded", "true");
    clearTimeout(minuteries.get(declencheur));
    minuteries.delete(declencheur);
  });
  cible.classList.add("ouvert");

  minuteries.set(
    bouton,
    setTimeout(() => fermer(bouton, cible), DUREE_AUTO_FERMETURE_MS),
  );
}

document.addEventListener("click", (event) => {
  // Fermeture explicite depuis un popup.
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

  // Une interaction prolonge le panneau concerné.
  const panneauOuvert = event.target.closest(".disclosure.ouvert");
  if (!panneauOuvert || !panneauOuvert.id) return;

  const boutonAssocie = document.querySelector(
    `[data-toggle-target="${panneauOuvert.id}"]`,
  );
  if (!boutonAssocie) return;

  // Un tap sur le fond ferme le popup.
  if (
    panneauOuvert.classList.contains("popup-fond") &&
    event.target === panneauOuvert
  ) {
    fermer(boutonAssocie, panneauOuvert);
    return;
  }

  ouvrir(boutonAssocie, panneauOuvert);
});

// Utilisé par refresh.js après une fusion DOM.
window.disclosure = { ouvrir, fermer };
