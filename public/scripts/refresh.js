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

// === Indicateur hors ligne (iPad mural uniquement) ===

// Volontairement limité à l'iPad cible (voir architecture.md) : ce badge
// n'a de sens que sur l'écran mural qui dépend du wifi pour vivre. Un autre
// appareil qui regarde le dashboard (téléphone en 4G, etc.) ne doit pas
// afficher un faux "hors ligne" à chaque coupure wifi qui lui est propre
// alors qu'il a toujours du réseau par ailleurs (4G).
const estIpadCible = /iPad/.test(navigator.userAgent);

// Masqué entièrement (pas juste inactif) sur tout autre appareil — un
// téléphone qui regarde le dashboard en 4G n'a aucune raison d'afficher un
// point vert permanent dans l'en-tête pour un indicateur qui ne le concerne
// pas.
if (!estIpadCible) {
  const badgeInitial = document.getElementById("hors-ligne-badge");
  if (badgeInitial) badgeInitial.hidden = true;
}

// Connecté : masqué par défaut, un tap n'importe où sur l'écran le révèle
// brièvement (DUREE_AFFICHAGE_CONNEXION_MS) puis il se recache — pas besoin
// d'un indicateur "tout va bien" affiché en permanence. Déconnecté : reste
// affiché en continu tant que la connexion n'est pas revenue, sans dépendre
// d'un tap (c'est justement l'info qu'on ne veut jamais manquer).
const DUREE_AFFICHAGE_CONNEXION_MS = 5000;
let horsLigneActuellement = false;
let minuterieConnexionEtat = null;

function rejouerApparition(badge) {
  badge.classList.remove("apparait");
  void badge.offsetWidth;
  badge.classList.add("apparait");
}

// Ne touche JAMAIS au statut trafic réel (.statut-dot/.carte-trafic-titre)
// ni au niveau .carte-trafic-<niveau> — le dernier état connu reste affiché
// tel quel, y compris une vraie alerte, plutôt que d'être masqué derrière
// ce badge. Le train se fige et se ternit (main.css), sans reprendre la
// pose "endormi"/"en-panne" qui a chacune un sens propre déjà pris.
function afficherHorsLigne(horsLigne) {
  if (!estIpadCible) return;
  horsLigneActuellement = horsLigne;
  const carteTrafic = document.querySelector(".carte-trafic");
  const badge = document.getElementById("hors-ligne-badge");
  if (carteTrafic) carteTrafic.classList.toggle("hors-ligne", horsLigne);
  if (!badge) return;

  badge.classList.toggle("connecte", !horsLigne);
  badge.classList.toggle("deconnecte", horsLigne);
  badge.title = horsLigne ? "Hors ligne — dernier état connu affiché" : "Connexion au serveur";

  clearTimeout(minuterieConnexionEtat);
  if (horsLigne) {
    // Toujours visible tant qu'on est hors ligne, indépendamment des taps.
    badge.hidden = false;
    rejouerApparition(badge);
  } else {
    // Revenu en ligne : on repasse en mode "masqué, révélé au tap" plutôt
    // que de laisser un "Connecté" vert affiché indéfiniment.
    badge.hidden = true;
  }
}

// Délégué sur `document`, comme les autres écouteurs de tap de l'appli
// (disclosure.js, bus-return.js) — ne bloque ni n'affecte aucun autre
// gestionnaire, se contente de révéler cet indicateur en plus.
document.addEventListener("click", function () {
  if (horsLigneActuellement || !estIpadCible) return;
  const badge = document.getElementById("hors-ligne-badge");
  if (!badge) return;
  badge.hidden = false;
  rejouerApparition(badge);
  clearTimeout(minuterieConnexionEtat);
  minuterieConnexionEtat = setTimeout(function () {
    badge.hidden = true;
  }, DUREE_AFFICHAGE_CONNEXION_MS);
});

// Un tap sur l'icône ELLE-MÊME (pas un tap générique ailleurs sur l'écran)
// coupe/reprend le rafraîchissement 60s manuellement — utile pour prévisualiser
// l'état hors ligne sans vraiment couper le wifi, et pour reprendre
// immédiatement sans attendre le prochain tick de 60s.
let pauseManuelle = false;

const boutonConnexion = document.getElementById("hors-ligne-badge");
if (boutonConnexion) {
  boutonConnexion.addEventListener("click", function (event) {
    event.stopPropagation();
    pauseManuelle = !pauseManuelle;
    boutonConnexion.setAttribute("aria-pressed", pauseManuelle ? "true" : "false");
    if (pauseManuelle) {
      afficherHorsLigne(true);
    } else {
      afficherHorsLigne(false);
      rafraichirTableauDeBord();
    }
  });
}

async function rafraichirTableauDeBord() {
  if (miseAJourEnCours || pauseManuelle) return;

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
    afficherHorsLigne(false);

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
    afficherHorsLigne(true);
  } finally {
    miseAJourEnCours = false;
  }
}

setInterval(rafraichirTableauDeBord, 1 * 60 * 1000);
