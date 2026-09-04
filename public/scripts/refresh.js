// Fusion DOM ciblée pour préserver les animations entre deux actualisations.
let miseAJourEnCours = false;

// Synchronise les alertes de même durée si Web Animations est disponible.
const SELECTEUR_ANIMATIONS_ALERTE =
  ".carte-glow-chaude, .carte-glow-alerte, .carte-trafic-info, .carte-trafic-ailleurs, .carte-trafic-alerte, .carte-trafic-alerte .statut-dot, .alerte-clignotante, .alerte-anneau";

function synchroniserAnimationsAlerte(conteneur = document) {
  const elements = [...conteneur.querySelectorAll(SELECTEUR_ANIMATIONS_ALERTE)];
  const retardCommun = `-${Date.now() % 1400}ms`;
  elements.forEach((element) => {
    element.style.setProperty("--alerte-delay", retardCommun);
  });

  if (typeof document.timeline === "undefined") return;

  // `subtree` inclut les pseudo-éléments lumineux.
  const animations = [];
  elements
    .filter((element) => typeof element.getAnimations === "function")
    .forEach((element) => {
      element.getAnimations({ subtree: true }).forEach((animation) => {
        if (
          animation.effect &&
          typeof animation.effect.getTiming === "function"
        ) {
          animations.push(animation);
        }
      });
    });

  const parDuree = new Map();
  animations.forEach((animation) => {
    const duree = Math.round(animation.effect.getTiming().duration);
    if (!Number.isFinite(duree)) return;
    if (!parDuree.has(duree)) parDuree.set(duree, []);
    parDuree.get(duree).push(animation);
  });

  const debutCommun = document.timeline.currentTime;
  parDuree.forEach((groupe) => {
    if (groupe.length < 2) return;
    groupe.forEach((animation) => {
      animation.startTime = debutCommun;
    });
  });
}

synchroniserAnimationsAlerte();

// Fusion positionnelle : le gabarit EJS ne réordonne pas ses nœuds.
function fusionnerNoeuds(actuel, nouveau) {
  if (actuel.nodeType !== nouveau.nodeType) {
    actuel.replaceWith(nouveau.cloneNode(true));
    return;
  }

  if (actuel.nodeType === Node.TEXT_NODE || actuel.nodeType === Node.COMMENT_NODE) {
    if (actuel.textContent !== nouveau.textContent) {
      actuel.textContent = nouveau.textContent;
    }
    return;
  }

  if (actuel.nodeType !== Node.ELEMENT_NODE) return;

  if (actuel.tagName !== nouveau.tagName) {
    actuel.replaceWith(nouveau.cloneNode(true));
    return;
  }

  // Aligne les attributs; les panneaux ouverts sont restaurés ensuite.
  const nomsNouveaux = nouveau.getAttributeNames();
  nomsNouveaux.forEach((nom) => {
    const valeur = nouveau.getAttribute(nom);
    if (actuel.getAttribute(nom) !== valeur) actuel.setAttribute(nom, valeur);
  });
  actuel.getAttributeNames().forEach((nom) => {
    if (!nouveau.hasAttribute(nom)) actuel.removeAttribute(nom);
  });

  const enfantsActuels = Array.from(actuel.childNodes);
  const enfantsNouveaux = Array.from(nouveau.childNodes);
  const max = Math.max(enfantsActuels.length, enfantsNouveaux.length);

  for (let i = 0; i < max; i += 1) {
    const a = enfantsActuels[i];
    const n = enfantsNouveaux[i];
    if (a && n) {
      fusionnerNoeuds(a, n);
    } else if (!a && n) {
      actuel.appendChild(n.cloneNode(true));
    } else if (a && !n) {
      a.remove();
    }
  }
}

async function rafraichirTableauDeBord() {
  if (miseAJourEnCours) return;

  const tableauActuel = document.getElementById("dashboard-content");
  if (!tableauActuel) return;

  miseAJourEnCours = true;

  // Mémorise les panneaux ouverts.
  const ciblesOuvertes = [
    ...tableauActuel.querySelectorAll("[data-toggle-target].ouvert"),
  ].map((bouton) => bouton.dataset.toggleTarget);

  try {
    // Préserve les filtres du mode démo.
    const response = await fetch(location.pathname + location.search, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const documentMisAJour = new DOMParser().parseFromString(
      await response.text(),
      "text/html",
    );
    const nouveauTableau = documentMisAJour.getElementById("dashboard-content");
    if (!nouveauTableau) throw new Error("Tableau de bord introuvable");

    fusionnerNoeuds(tableauActuel, nouveauTableau);

    // Resynchronise les animations touchées par la fusion.
    synchroniserAnimationsAlerte(tableauActuel);

    ciblesOuvertes.forEach((id) => {
      const bouton = tableauActuel.querySelector(`[data-toggle-target="${id}"]`);
      const cible = document.getElementById(id);
      if (!bouton || !cible) return;
      // Relance aussi la minuterie du panneau.
      if (window.disclosure) window.disclosure.ouvrir(bouton, cible);
    });

    // La fusion remet .gym-fenetre-active sur la 1ère fenêtre (valeur du
    // rendu serveur) : on relance la rotation plutôt que de la laisser figée.
    if (window.gymRotation) window.gymRotation.redemarrer();

    // Idem pour la direction/le filtre/le tri du popup bus (CDT-54) : la
    // fusion réécrit ces attributs aux valeurs par défaut du serveur.
    if (window.busPopupEtat) window.busPopupEtat.appliquer();
  } catch (error) {
    console.warn("Mise à jour du tableau de bord impossible :", error.message);
  } finally {
    miseAJourEnCours = false;
  }
}

setInterval(rafraichirTableauDeBord, 1 * 60 * 1000);
