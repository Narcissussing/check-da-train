// Met à jour le tableau de bord toutes les 60 secondes sans recharger l'iPad
// — et sans que ça se voie. `fusionnerNoeuds` compare l'ancien DOM au HTML
// fraîchement reçu et ne touche que ce qui a réellement changé (texte,
// attributs), au lieu de tout détruire/recréer via un simple replaceChild.
// Deux raisons concrètes à ça, pas juste "plus propre" :
//   1. `.carte { animation: apparition ... }` (fondu d'entrée) se rejoue à
//      chaque création d'élément — un replaceChild recrée TOUTES les cartes
//      toutes les 60s, donc elles se refondaient visiblement à chaque fois.
//   2. Le train qui glisse et le fond météo animé sont de longues animations
//      CSS en boucle ; les recréer les fait sauter à leur position de départ
//      à chaque rafraîchissement, ce qui est le genre de saccade qu'on
//      cherche justement à éviter.
// En ne mutant que les nœuds qui diffèrent, les éléments inchangés (la
// plupart, la majeure partie du temps) restent le même nœud DOM et leurs
// animations continuent sans interruption.
let miseAJourEnCours = false;

// L'iPad cible tourne en iOS 12 : Element.getAnimations()/document.timeline
// n'y sont pas fiables. On vérifie leur présence avant usage — sans quoi une
// erreur ici, non rattrapée, empêcherait le setInterval plus bas de
// s'enregistrer et casserait le rafraîchissement automatique en entier.
function synchroniserLueursRetard(conteneur = document) {
  if (typeof document.timeline === "undefined") return;

  const animations = [...conteneur.querySelectorAll(".train-heure.retard")]
    .filter((element) => typeof element.getAnimations === "function")
    .flatMap((element) => element.getAnimations())
    .filter((animation) => animation.animationName === "luire-retard");

  if (animations.length < 2) return;

  const debutCommun = document.timeline.currentTime;
  animations.forEach((animation) => {
    animation.startTime = debutCommun;
  });
}

synchroniserLueursRetard();

// Fusionne `nouveau` dans `actuel` en ne mutant que les différences —
// texte et attributs — plutôt que de remplacer les nœuds. Les enfants sont
// alignés par position : cette appli ne réordonne jamais son contenu (même
// gabarit EJS à chaque fois), donc un alignement positionnel simple suffit,
// pas besoin d'un diff par clé façon virtual-DOM.
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

  // Attributs : applique ceux du nouveau, retire ceux qui ont disparu.
  // (Écrase aussi `class`/`aria-expanded` sur les panneaux "tucked away" —
  // volontaire, rafraichirTableauDeBord() les rouvre juste après en
  // s'appuyant sur son propre relevé pré-fusion, donc l'état visible par
  // l'utilisateur reste correct malgré cet aller-retour.)
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

  // Retient les panneaux "tucked away" ouverts (départs, arrivées, gym,
  // trafic, travaux) pour les rouvrir après la fusion.
  const ciblesOuvertes = [
    ...tableauActuel.querySelectorAll("[data-toggle-target].ouvert"),
  ].map((bouton) => bouton.dataset.toggleTarget);

  try {
    // Préserve la query string actuelle (ex. `?demo=1&meteo=orage`) : sans
    // ça, un état forcé par la barre démo reviendrait silencieusement aux
    // données réelles au premier cycle de rafraîchissement, 60s plus tard.
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

    // Resynchronise seulement les trains dont le retard vient de changer —
    // les autres n'ont jamais arrêté leur animation, rien à faire pour eux.
    synchroniserLueursRetard(tableauActuel);

    ciblesOuvertes.forEach((id) => {
      const bouton = tableauActuel.querySelector(`[data-toggle-target="${id}"]`);
      const cible = document.getElementById(id);
      if (!bouton || !cible) return;
      // Passe par disclosure.js pour repartir sur une minuterie de 10s
      // fraîche, plutôt que de rouvrir le panneau indéfiniment.
      // (pas de "?." — non supporté par Safari sur iOS 12, l'appareil cible)
      if (window.disclosure) window.disclosure.ouvrir(bouton, cible);
    });
  } catch (error) {
    console.warn("Mise à jour du tableau de bord impossible :", error.message);
  } finally {
    miseAJourEnCours = false;
  }
}

setInterval(rafraichirTableauDeBord, 1 * 60 * 1000);
