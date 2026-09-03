// Fusion DOM ciblée pour préserver les animations entre deux actualisations.
let miseAJourEnCours = false;

// === Indicateur "dernière mise à jour" ===
// Repère visible et diagnostiquable : contrairement aux logs Fly (qui
// mélangent le trafic de tous les appareils), ce texte ne reflète que les
// rafraîchissements réellement réussis sur CET écran précis.

function marquerDerniereMaj() {
  const cible = document.getElementById("derniere-maj");
  if (!cible) return;
  const heure = new Date().toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  cible.textContent = `· maj ${heure}`;
}
marquerDerniereMaj();

// === Synchronisation des animations d'alerte ===

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

// === Fusion DOM ===

// Fusion positionnelle, le gabarit EJS ne réordonne pas ses nœuds.
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

// === Veille nocturne (coût Fly) ===

// De 0h à 6h, personne ne regarde l'iPad, donc on laisse la machine Fly
// dormir (auto_stop_machines) au lieu de la maintenir éveillée pour rien.
function dansFenetreVeilleNocturne() {
  const partieHeure = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hourCycle: "h23",
    hour: "2-digit",
  })
    .formatToParts(new Date())
    .find((partie) => partie.type === "hour");
  const heure = Number(partieHeure?.value);
  return heure >= 0 && heure < 6;
}

// === Rafraîchissement 60s ===

async function rafraichirTableauDeBord() {
  if (miseAJourEnCours) return;
  if (dansFenetreVeilleNocturne()) return;

  const tableauActuel = document.getElementById("dashboard-content");
  if (!tableauActuel) return;

  miseAJourEnCours = true;

  // Mémorise les panneaux ouverts.
  const ciblesOuvertes = [
    ...tableauActuel.querySelectorAll("[data-toggle-target].ouvert"),
  ].map((bouton) => bouton.dataset.toggleTarget);

  try {
    // Délai limite explicite : un fetch qui démarre juste avant que l'onglet
    // parte en arrière-plan peut rester bloqué indéfiniment (ni résolu ni
    // rejeté) une fois iOS suspendu, ce qui garderait miseAJourEnCours à
    // true pour toujours et bloquerait tout rafraîchissement futur.
    const controleur = new AbortController();
    const delaiLimite = setTimeout(() => controleur.abort(), 20000);

    // Préserve les filtres du mode démo.
    const response = await fetch(location.pathname + location.search, {
      cache: "no-store",
      signal: controleur.signal,
    }).finally(() => clearTimeout(delaiLimite));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const documentMisAJour = new DOMParser().parseFromString(
      await response.text(),
      "text/html",
    );
    const nouveauTableau = documentMisAJour.getElementById("dashboard-content");
    if (!nouveauTableau) throw new Error("Tableau de bord introuvable");

    fusionnerNoeuds(tableauActuel, nouveauTableau);
    marquerDerniereMaj();

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
    // rendu serveur), donc on relance la rotation plutôt que de la laisser
    // figée.
    if (window.gymRotation) window.gymRotation.redemarrer();

    // Idem pour la direction/le filtre/le tri du popup bus, la fusion
    // réécrit ces attributs aux valeurs par défaut du serveur.
    if (window.busPopupEtat) window.busPopupEtat.appliquer();
  } catch (error) {
    console.warn("Mise à jour du tableau de bord impossible :", error.message);
  } finally {
    miseAJourEnCours = false;
  }
}

setInterval(rafraichirTableauDeBord, 1 * 60 * 1000);

// iOS suspend les timers d'un onglet en arrière-plan ou verrouillé, donc
// dès que l'onglet redevient visible on rafraîchit tout de suite plutôt
// que d'attendre un prochain tick qui peut ne jamais s'être déclenché
// pendant l'absence.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") rafraichirTableauDeBord();
});
