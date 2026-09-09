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

// Connecté : masqué en permanence, pas d'indicateur "tout va bien" affiché
// nulle part. Déconnecté : visible en permanence tant que la connexion
// n'est pas revenue — jamais de tap requis pour le voir ni pour qu'il
// disparaisse, l'un ou l'autre état est simplement toujours vrai.
let horsLigneActuellement = false;

function rejouerApparition(badge) {
  badge.classList.remove("apparait");
  void badge.offsetWidth;
  badge.classList.add("apparait");
}

// Choix explicite de l'utilisateur (accepté en connaissance de cause) :
// TOUT le tableau de bord passe en mode sommeil hors ligne — train endormi,
// carte Gym ("Jour de repos"/"Séance faite"), Départ/Arrivée/Retour Meaux en
// "Fin de service", météo basculée sur le résumé du lendemain — plutôt qu'un
// indicateur isolé qui laisse le reste actif. Une vraie alerte trafic EN
// COURS au moment où la connexion tombe peut donc se retrouver masquée
// derrière cet aspect "tout va bien, tout dort" : accepté sciemment après
// discussion, pas un oubli.
//
// Rien ici n'a besoin d'être "annulé" au retour en ligne : la prochaine
// fusion DOM réussie (fusionnerNoeuds, plus bas) réécrit de toute façon tous
// les attributs/contenus vers le vrai rendu serveur, classes ajoutées ici
// comprises — voir "Aligne les attributs" dans fusionnerNoeuds. Cette
// fonction n'a donc qu'un sens : ENDORMIR, jamais RÉVEILLER.
// Cartes concernées par le sommeil hors ligne (voir endormirTableauDeBord),
// réutilisé dans les deux sens : à l'endormissement (juste après avoir posé
// le contenu "sommeil") ET au réveil (juste après une fusion réussie qui a
// restauré le vrai contenu) — un simple fondu d'apparition rejoué sur
// chacune, pas une vraie transition entre ancien/nouveau contenu (le
// contenu a déjà changé instantanément dans les deux cas, comme
// bus-direction-panneau le fait déjà ailleurs dans cette appli). Le
// conteneur du train, pas toute .carte-trafic — son propre statut
// (.statut-dot/.carte-trafic-titre) ne doit jamais sembler "transitionner"
// puisqu'il ne change jamais dans ce contexte.
const SELECTEURS_CARTES_SOMMEIL = [
  ".carte-meteo",
  ".carte-gym",
  ".carte-depart",
  ".carte-arrivee-classique",
  ".carte-rentre-mobile",
  ".illustration-train-conteneur",
];

function jouerTransitionSommeil() {
  SELECTEURS_CARTES_SOMMEIL.forEach(function (selecteur) {
    const el = document.querySelector(selecteur);
    if (!el) return;
    el.classList.remove("transition-sommeil");
    void el.offsetWidth;
    el.classList.add("transition-sommeil");
  });
}

function endormirTableauDeBord() {
  const carteMeteo = document.querySelector(".carte-meteo");
  if (carteMeteo) {
    carteMeteo.classList.add("hors-ligne");
    // Le bloc "demain" porte l'attribut hidden au rendu serveur — le garde-fou
    // [hidden]{display:none!important} (main.css) l'emporterait sur la règle
    // CSS .carte-meteo.hors-ligne .carte-meteo-haut-demain{display:flex} si
    // l'attribut restait posé, donc on le retire explicitement ici plutôt
    // que de compter sur la classe seule pour piloter sa visibilité.
    const demain = carteMeteo.querySelector(".carte-meteo-haut-demain");
    if (demain) demain.hidden = false;
  }

  const carteGym = document.querySelector(".carte-gym");
  if (carteGym) carteGym.classList.add("gym-termine");

  const train = document.querySelector(".illustration-train-conteneur");
  if (train) {
    train.classList.add("endormi");
    const img = train.querySelector(".illustration-train-img");
    if (img) img.src = "/images/train-dort.png";
    const glisseur = train.querySelector(".illustration-train-glisseur");
    if (glisseur && !glisseur.querySelector(".train-zzz")) {
      const zzz = document.createElement("div");
      zzz.className = "train-zzz";
      zzz.setAttribute("aria-hidden", "true");
      zzz.innerHTML = "<span>Z</span><span>Z</span><span>Z</span>";
      glisseur.appendChild(zzz);
    }
  }

  [".carte-depart", ".carte-arrivee-classique", ".carte-rentre-mobile"].forEach(function (selecteurCarte) {
    const carte = document.querySelector(selecteurCarte);
    if (!carte) return;
    [".train-heure-principale", ".train-destination", ".train-puis", ".carte-train-toggle", ".carte-train-details", ".countdown"].forEach(
      function (selecteurEnfant) {
        const el = carte.querySelector(selecteurEnfant);
        if (el) el.hidden = true;
      },
    );
    if (!carte.querySelector(".statut-service")) {
      const statut = document.createElement("span");
      statut.className = "statut-service termine";
      statut.textContent = "Fin de service";
      carte.appendChild(statut);
    }
  });

  const retourMeaux = document.querySelector(".meaux-retour");
  if (retourMeaux && !retourMeaux.classList.contains("meaux-retour-termine")) {
    retourMeaux.classList.add("meaux-retour-termine");
    retourMeaux.innerHTML = '<span class="statut-service termine">Fin de service</span>';
  }

  jouerTransitionSommeil();
}

// Ne touche JAMAIS au statut trafic réel (.statut-dot/.carte-trafic-titre)
// ni au niveau .carte-trafic-<niveau> — le dernier état connu reste affiché
// tel quel même hors ligne (voir le commentaire d'endormirTableauDeBord()
// pour le compromis accepté sur le reste de la page).
function afficherHorsLigne(horsLigne) {
  if (!estIpadCible) return;
  horsLigneActuellement = horsLigne;
  const carteTrafic = document.querySelector(".carte-trafic");
  const badge = document.getElementById("hors-ligne-badge");
  if (carteTrafic) carteTrafic.classList.toggle("hors-ligne", horsLigne);
  if (horsLigne) endormirTableauDeBord();
  if (!badge) return;

  // Visibilité pilotée par opacity via ces classes (main.css), pas par
  // hidden — l'élément reste en place et tapable même invisible (connecte),
  // pour que la zone reste au même endroit sans qu'il faille d'abord la
  // voir pour la retrouver.
  badge.classList.toggle("connecte", !horsLigne);
  badge.classList.toggle("deconnecte", horsLigne);
  badge.title = horsLigne ? "Hors ligne — dernier état connu affiché" : "Connexion au serveur";

  if (horsLigne) rejouerApparition(badge);
}

// Un tap sur l'icône ELLE-MÊME (pas un tap générique ailleurs sur l'écran)
// coupe/reprend le rafraîchissement 60s manuellement — utile pour prévisualiser
// l'état hors ligne sans vraiment couper le wifi, et pour reprendre
// immédiatement sans attendre le prochain tick de 60s.
//
// Volontairement asymétrique : passer hors ligne est une action qu'on ne
// veut pas déclencher par un tap accidentel sur cette zone invisible, donc
// ça prend 2 taps — le premier révèle juste l'icône (toujours verte, rien
// n'est coupé) et reste visible 10s sans action pour laisser le temps de
// confirmer ; sans second tap dans ce délai, elle redevient invisible et il
// faut recommencer. Le second tap (sur l'icône déjà visible) l'active pour
// de vrai. Revenir en ligne n'a pas besoin de cette protection (aucun risque
// à annuler une pause qu'on vient soi-même de poser) : 1 seul tap suffit,
// mais reste quand même visible 10s ensuite comme confirmation visuelle du
// retour en ligne, plutôt que de disparaître instantanément.
const DUREE_CONFIRMATION_MS = 10000;
let pauseManuelle = false;
let minuterieConfirmation = null;

const boutonConnexion = document.getElementById("hors-ligne-badge");

// Révèle SANS jamais activer — c'est tout ce que .header-date a le droit de
// déclencher (voir plus bas). N'agit pas si déjà hors ligne (rien à révéler
// de plus, .deconnecte gère déjà sa propre visibilité en continu).
function reveler() {
  if (!boutonConnexion || pauseManuelle) return;
  clearTimeout(minuterieConfirmation);
  boutonConnexion.classList.add("revele");
  rejouerApparition(boutonConnexion);
  minuterieConfirmation = setTimeout(function () {
    boutonConnexion.classList.remove("revele");
  }, DUREE_CONFIRMATION_MS);
}

// SEUL un tap sur l'icône elle-même peut activer/désactiver — jamais
// .header-date, qui ne fait que révéler (voir reveler() ci-dessus et les
// écouteurs plus bas).
function gererTapBadge(event) {
  if (!boutonConnexion) return;
  event.stopPropagation();

  if (pauseManuelle) {
    // Hors ligne → en ligne : 1 tap suffit, mais reste visible 10s en
    // confirmation avant de s'effacer plutôt que de disparaître d'un coup.
    pauseManuelle = false;
    boutonConnexion.setAttribute("aria-pressed", "false");
    afficherHorsLigne(false);
    rafraichirTableauDeBord();
    reveler();
    return;
  }

  // La classe "revele" est la seule source de vérité pour "actuellement
  // visible sans être hors ligne" — qu'elle vienne d'un 1er tap de
  // révélation, d'un tap sur .header-date, OU de la confirmation
  // post-reprise ci-dessus, un tap sur l'icône pendant qu'elle est déjà
  // visible compte directement comme confirmation, pas comme un nouveau
  // 1er tap qui redemanderait encore une révélation.
  if (!boutonConnexion.classList.contains("revele")) {
    reveler();
    return;
  }

  // Déjà visible : ce tap active pour de vrai — .deconnecte reste visible
  // tant qu'on est réellement hors ligne, pas besoin de minuterie ici.
  clearTimeout(minuterieConfirmation);
  pauseManuelle = true;
  boutonConnexion.classList.remove("revele");
  boutonConnexion.setAttribute("aria-pressed", "true");
  afficherHorsLigne(true);
}

if (boutonConnexion) {
  boutonConnexion.addEventListener("click", gererTapBadge);
  // Zone de tap étendue jusqu'à la date : révèle seulement où se trouve
  // l'icône, ne l'active jamais elle-même — l'activation reste réservée à
  // un tap sur l'icône (voir gererTapBadge()).
  const dateEntete = document.querySelector(".header-date");
  if (dateEntete) {
    dateEntete.addEventListener("click", function (event) {
      event.stopPropagation();
      reveler();
    });
  }
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

    // Capturé AVANT afficherHorsLigne(false), qui écrase cet état — sert à
    // ne jouer le fondu de réveil que sur la fusion qui vient vraiment de
    // sortir du mode sommeil, pas à chaque rafraîchissement normal.
    const sortDuSommeil = horsLigneActuellement;
    fusionnerNoeuds(tableauActuel, nouveauTableau);
    afficherHorsLigne(false);
    if (sortDuSommeil) jouerTransitionSommeil();

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
