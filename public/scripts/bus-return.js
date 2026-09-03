const DIX_MINUTES = 10 * 60 * 1000;
const MAX_OUVERTS = 2;

// === Animation du tracé de bus (.bus-parcours) ===

function progressionBus(depart, arrivee, maintenant) {
  if (maintenant < depart) {
    return Math.max(0, 0.12 * (1 - (depart - maintenant) / DIX_MINUTES));
  }
  if (maintenant >= arrivee) return 0.88;
  return 0.12 + 0.76 * ((maintenant - depart) / (arrivee - depart));
}

// Anime le tracé .bus-parcours de CHAQUE ligne Rentre actuellement dépliée
// (jusqu'à 2 à la fois), pas seulement la première ouverte.
function positionnerBus() {
  document.querySelectorAll(".bus-rentre-ouvert .bus-parcours").forEach(function (parcours) {
    const bus = parcours.querySelector(".bus-mobile");
    const avancee = parcours.querySelector(".bus-progression");
    const depart = new Date(parcours.dataset.depart).getTime();
    const arrivee = new Date(parcours.dataset.arrivee).getTime();
    if (!bus || !Number.isFinite(depart) || !Number.isFinite(arrivee)) return;

    const maintenant = Date.now();
    const largeur = Math.max(0, parcours.clientWidth - bus.offsetWidth);
    const progression = progressionBus(depart, arrivee, maintenant);

    // Premier positionnement, à l'ouverture ou après une fusion 60s qui a
    // réinitialisé le marqueur, place le bus directement sans balayer
    // depuis le bord.
    const premierPositionnement = parcours.dataset.positionne !== "1";
    if (premierPositionnement) {
      bus.style.transition = "none";
      if (avancee) avancee.style.transition = "none";
    }

    bus.style.transform = `translate3d(${(largeur * progression).toFixed(2)}px, 0, 0)`;
    if (avancee) avancee.style.transform = `scaleX(${progression.toFixed(4)})`;

    if (premierPositionnement) {
      void bus.offsetWidth;
      bus.style.transition = "";
      if (avancee) avancee.style.transition = "";
      parcours.dataset.positionne = "1";
    }

    parcours.classList.remove("bus-approche", "bus-en-route", "bus-arrive");
    if (maintenant < depart) {
      parcours.classList.add("bus-approche");
    } else if (maintenant < arrivee) {
      parcours.classList.add("bus-en-route");
    } else {
      parcours.classList.add("bus-arrive");
    }
  });
}

// === État partagé du popup (survit à la fusion DOM 60s) ===

// Perdu par la fusion DOM du rafraîchissement 60s
// (le HTML re-rendu par le serveur repart toujours des valeurs par défaut) ;
// réappliqué par `appliquerEtatPopupBus()`, appelée depuis refresh.js après
// chaque fusion, exactement comme le verrouillage gym se réapplique déjà.
const etatPopupBus = {
  direction: "onair-meaux",
  ouverts: [], // ids de lignes Rentre dépliées, plus ancienne en premier (FIFO)
  // Filtres/tri sont indépendants par direction (chacune a sa propre liste,
  // ses propres arrêts et son propre bouton dans l'en-tête).
  filtres: {
    "onair-meaux": { arret: "tous", tri: "heure", visibles: false },
    "meaux-onair": { arret: "tous", tri: "heure", visibles: false },
  },
};

// Où trouver la liste et le panneau de contrôles de chaque direction.
const CONFIG_FILTRES = {
  "onair-meaux": { listeSelector: ".bus-rentre-item", controlesId: "bus-rentre-filtres" },
  "meaux-onair": { listeSelector: ".bus-vers-onair li", controlesId: "bus-vers-onair-filtres" },
};

// === Direction On Air ↔ Meaux ===

function appliquerDirection(popup, bouton, direction) {
  // Les libellés "On Air"/"Gare de Meaux" restent fixes de chaque côté ;
  // seule la flèche centrale s'anime pour indiquer le sens (CSS, basé sur
  // cet attribut).
  bouton.dataset.directionActuelle = direction;
  popup.querySelectorAll("[data-direction-panneau]").forEach(function (panneau) {
    panneau.hidden = panneau.dataset.directionPanneau !== direction;
  });
}

// === Lignes Rentre repliables (ouvert/fermé) ===

function appliquerOuverts(popup) {
  if (!popup) return;
  popup.querySelectorAll(".bus-rentre-item").forEach(function (item) {
    const ouvert = etatPopupBus.ouverts.includes(item.dataset.busId);
    item.classList.toggle("bus-rentre-ouvert", ouvert);
    const bouton = item.querySelector(".bus-rentre-toggle");
    if (bouton) bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
  });
}

function basculerOuvertureBus(item) {
  const id = item.dataset.busId;
  const index = etatPopupBus.ouverts.indexOf(id);
  if (index !== -1) {
    etatPopupBus.ouverts.splice(index, 1);
  } else {
    etatPopupBus.ouverts.push(id);
    // Une 3e ligne ouverte ferme la plus ancienne, jamais plus de 2 à la fois.
    if (etatPopupBus.ouverts.length > MAX_OUVERTS) etatPopupBus.ouverts.shift();
  }
  appliquerOuverts(item.closest(".bus-retour-popup"));
  positionnerBus();
}

function basculerDirectionBus(flecheBouton) {
  const conteneur = flecheBouton.closest(".bus-direction-toggle");
  const popup = flecheBouton.closest(".bus-retour-popup");
  if (!conteneur || !popup) return;
  const actuelle = conteneur.dataset.directionActuelle === "onair-meaux" ? "meaux-onair" : "onair-meaux";
  etatPopupBus.direction = actuelle;
  // Changer de direction referme entièrement les lignes Rentre dépliées.
  etatPopupBus.ouverts = [];
  // ... et réinitialise filtre/tri/visibilité des deux côtés, pour repartir
  // à zéro (bouton "déclic") à chaque bascule, plutôt que de garder un filtre
  // actif qu'on ne voit plus une fois revenu sur ce côté.
  Object.keys(CONFIG_FILTRES).forEach(function (cote) {
    etatPopupBus.filtres[cote] = { arret: "tous", tri: "heure", visibles: false };
    appliquerFiltre(popup, cote, "tous");
    appliquerTri(popup, cote, "heure");
    appliquerVisibiliteFiltres(popup, cote, false);
  });
  appliquerDirection(popup, conteneur, actuelle);
  appliquerOuverts(popup);

  // Petit pulse au tap ; retiré à la fin pour pouvoir se rejouer au prochain clic.
  flecheBouton.classList.remove("bus-direction-toggle-anime");
  void flecheBouton.offsetWidth;
  flecheBouton.classList.add("bus-direction-toggle-anime");
}

// === Filtres par arrêt ===

function appliquerFiltre(popup, cote, arret) {
  const config = CONFIG_FILTRES[cote];
  const controles = popup.querySelector(`#${config.controlesId}`);
  if (controles) {
    controles.querySelectorAll(".bus-filtre-chip").forEach(function (chip) {
      chip.classList.toggle("actif", chip.dataset.filtreArret === arret);
    });
  }
  popup.querySelectorAll(config.listeSelector).forEach(function (item) {
    item.hidden = arret !== "tous" && item.dataset.arret !== arret;
  });
}

function basculerFiltreBus(bouton) {
  const popup = bouton.closest(".bus-retour-popup");
  const cote = bouton.closest("[data-filtres-cote]")?.dataset.filtresCote;
  if (!popup || !cote) return;
  etatPopupBus.filtres[cote].arret = bouton.dataset.filtreArret;
  appliquerFiltre(popup, cote, etatPopupBus.filtres[cote].arret);
}

const DUREE_ANIMATION_FILTRES_MS = 250;

function appliquerVisibiliteFiltres(popup, cote, visibles, animer) {
  const config = CONFIG_FILTRES[cote];
  const controles = popup.querySelector(`#${config.controlesId}`);
  if (!controles) return;

  // Un seul bouton (icône train) sert de déclencheur pour les deux
  // directions, donc son état actif/aria ne reflète que le côté
  // actuellement affiché, pas "cote" pour chaque appel de cette fonction.
  if (cote === etatPopupBus.direction) {
    const bouton = popup.querySelector(".bus-filtres-toggle");
    if (bouton) {
      bouton.setAttribute("aria-expanded", visibles ? "true" : "false");
      bouton.classList.toggle("actif", visibles);
    }
  }

  if (!animer) {
    controles.hidden = !visibles;
    controles.classList.toggle("bus-controles-cache", !visibles);
    return;
  }

  if (visibles) {
    // Retire `hidden` avant de retirer la classe repliée, pour que la
    // transition parte bien de l'état replié plutôt que de sauter directement
    // à l'état ouvert (même technique que les autres animations du site).
    controles.hidden = false;
    void controles.offsetWidth;
    controles.classList.remove("bus-controles-cache");
  } else {
    controles.classList.add("bus-controles-cache");
    clearTimeout(minuteriesFiltres[cote]);
    minuteriesFiltres[cote] = setTimeout(() => {
      controles.hidden = true;
    }, DUREE_ANIMATION_FILTRES_MS);
  }
}
const minuteriesFiltres = { "onair-meaux": null, "meaux-onair": null };

function basculerVisibiliteFiltres(bouton) {
  const popup = bouton.closest(".bus-retour-popup");
  if (!popup) return;
  // Bouton unique, agit toujours sur la direction actuellement affichée.
  const cote = etatPopupBus.direction;
  etatPopupBus.filtres[cote].visibles = !etatPopupBus.filtres[cote].visibles;
  appliquerVisibiliteFiltres(popup, cote, etatPopupBus.filtres[cote].visibles, true);
}

// === Tri heure / marche ===

function appliquerTri(popup, cote, tri) {
  const config = CONFIG_FILTRES[cote];
  const controles = popup.querySelector(`#${config.controlesId}`);
  const bouton = controles && controles.querySelector(".bus-tri-bouton");
  if (bouton) {
    bouton.dataset.tri = tri;
    bouton.classList.toggle("actif", tri === "marche");
    bouton.querySelector(".bus-tri-texte").textContent =
      tri === "marche" ? "Trier par heure" : "Trier par marche";
  }
  if (tri !== "marche") return; // "heure" = ordre déjà servi par le serveur.

  const liste = popup.querySelector(cote === "onair-meaux" ? ".bus-rentre-liste" : ".bus-vers-onair ul");
  if (!liste) return;
  const items = Array.from(liste.children);
  items.sort(function (a, b) {
    const marcheA = Number(a.dataset.marche);
    const marcheB = Number(b.dataset.marche);
    if (Number.isNaN(marcheA)) return 1;
    if (Number.isNaN(marcheB)) return -1;
    return marcheA - marcheB;
  });
  items.forEach(function (item) {
    liste.appendChild(item);
  });
}

function basculerTriBus(bouton) {
  const popup = bouton.closest(".bus-retour-popup");
  const cote = bouton.closest("[data-filtres-cote]")?.dataset.filtresCote;
  if (!popup || !cote) return;
  etatPopupBus.filtres[cote].tri = bouton.dataset.tri === "marche" ? "heure" : "marche";
  appliquerTri(popup, cote, etatPopupBus.filtres[cote].tri);
}

// === Réapplication après fusion DOM ===

// Réapplique la direction/les lignes Rentre dépliées/les filtres et tris des
// deux côtés après une fusion DOM (refresh.js).
function appliquerEtatPopupBus() {
  const popup = document.querySelector(".bus-retour-popup");
  const boutonDirection = popup && popup.querySelector(".bus-direction-toggle");
  if (popup && boutonDirection) appliquerDirection(popup, boutonDirection, etatPopupBus.direction);
  if (popup) appliquerOuverts(popup);
  if (popup) {
    Object.keys(CONFIG_FILTRES).forEach(function (cote) {
      const etat = etatPopupBus.filtres[cote];
      appliquerFiltre(popup, cote, etat.arret);
      appliquerTri(popup, cote, etat.tri);
      appliquerVisibiliteFiltres(popup, cote, etat.visibles);
    });
  }
}
window.busPopupEtat = { appliquer: appliquerEtatPopupBus };

// === Délégation des clics ===

document.addEventListener("click", function (event) {
  const boutonFleche = event.target.closest(".bus-direction-swap");
  if (boutonFleche) {
    basculerDirectionBus(boutonFleche);
    return;
  }

  const boutonFiltresToggle = event.target.closest(".bus-filtres-toggle");
  if (boutonFiltresToggle) {
    basculerVisibiliteFiltres(boutonFiltresToggle);
    return;
  }

  const boutonFiltre = event.target.closest(".bus-filtre-chip");
  if (boutonFiltre) {
    basculerFiltreBus(boutonFiltre);
    return;
  }

  const boutonTri = event.target.closest(".bus-tri-bouton");
  if (boutonTri) {
    basculerTriBus(boutonTri);
    return;
  }

  const boutonRentre = event.target.closest(".bus-rentre-toggle");
  if (boutonRentre) {
    const item = boutonRentre.closest(".bus-rentre-item");
    if (item) basculerOuvertureBus(item);
    return;
  }

  if (event.target.closest("[data-toggle-target='bus-retour-popup']")) {
    setTimeout(positionnerBus, 0);
  }
});

positionnerBus();
setInterval(positionnerBus, 1000);
window.addEventListener("resize", positionnerBus);
