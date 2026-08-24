const DIX_MINUTES = 10 * 60 * 1000;
const CLE_SELECTIONS = "check-da-train.busSelections.v2";
const ANCIENNE_CLE_SELECTIONS = "lookulooku.busSelections.v2";

// Migration ponctuelle du renommage LookuLooku → Check.Da.Train : reprend les
// sélections déjà enregistrées sous l'ancienne clé plutôt que de les perdre.
function migrerAncienneCleSelections() {
  try {
    if (localStorage.getItem(CLE_SELECTIONS) !== null) return;
    const ancienne = localStorage.getItem(ANCIENNE_CLE_SELECTIONS);
    if (ancienne === null) return;
    localStorage.setItem(CLE_SELECTIONS, ancienne);
    localStorage.removeItem(ANCIENNE_CLE_SELECTIONS);
  } catch (_error) {
    // Pas grave : la sélection repart simplement à zéro.
  }
}
migrerAncienneCleSelections();

function lireSelections() {
  try {
    return JSON.parse(localStorage.getItem(CLE_SELECTIONS) || "{}");
  } catch (_error) {
    return {};
  }
}

function sauverSelections(selections) {
  try {
    localStorage.setItem(CLE_SELECTIONS, JSON.stringify(selections));
  } catch (_error) {
    // Le verrouillage reste utilisable jusqu'au prochain rafraîchissement.
  }
}

function texteCompte(depart) {
  const minutes = Math.round((depart - Date.now()) / 60000);
  return `${Math.max(0, minutes)} min`;
}

function restaurerSelection(groupe, selection) {
  if (!selection.html) return null;
  const enveloppe = document.createElement("div");
  enveloppe.innerHTML = selection.html;
  const detail = enveloppe.firstElementChild;
  if (!detail) return null;
  groupe.appendChild(detail);

  const choix = groupe.querySelector(".bus-choix");
  if (choix && !choix.querySelector(`[data-bus-id="${selection.id}"]`)) {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.dataset.busId = selection.id;
    bouton.textContent = selection.texteBouton || "Sélection";
    bouton.setAttribute("aria-pressed", "false");
    choix.insertBefore(bouton, choix.firstChild);
  }
  return detail;
}

function appliquerSelections() {
  const selections = lireSelections();
  let modifie = false;

  document.querySelectorAll(".bus-groupe").forEach(function (groupe) {
    const ligne = groupe.dataset.ligne;
    let selection = selections[ligne];
    if (selection && Date.now() >= new Date(selection.arrivee).getTime()) {
      delete selections[ligne];
      selection = null;
      modifie = true;
    }

    let actif = selection
      ? groupe.querySelector(`.bus-detail-option[data-bus-id="${selection.id}"]`)
      : null;
    if (!actif && selection) actif = restaurerSelection(groupe, selection);
    const apercu = actif || groupe.querySelector(".bus-detail-option");
    groupe.querySelectorAll(".bus-detail-option").forEach(function (detail) {
      detail.classList.toggle("bus-detail-visible", detail === apercu);
      detail.classList.toggle("bus-detail-actif", detail === actif);
    });
    groupe.querySelectorAll(".bus-choix button").forEach(function (bouton) {
      const estActif = actif && bouton.dataset.busId === actif.dataset.busId;
      bouton.classList.toggle("actif", Boolean(estActif));
      bouton.setAttribute("aria-pressed", estActif ? "true" : "false");
    });
    groupe.classList.toggle("bus-verrouille", Boolean(selection && actif));

    const compte = groupe.querySelector(".bus-compte");
    const prochain = apercu;
    if (compte && prochain) {
      compte.textContent = texteCompte(new Date(prochain.dataset.depart).getTime());
    }
    if (compte && !prochain) compte.textContent = "—";
  });

  if (modifie) sauverSelections(selections);
}

function progressionBus(depart, arrivee, maintenant) {
  if (maintenant < depart) {
    return Math.max(0, 0.12 * (1 - (depart - maintenant) / DIX_MINUTES));
  }
  if (maintenant >= arrivee) return 0.88;
  return 0.12 + 0.76 * ((maintenant - depart) / (arrivee - depart));
}

function positionnerBus() {
  appliquerSelections();
  document.querySelectorAll(".bus-detail-visible .bus-parcours").forEach(function (parcours) {
    const bus = parcours.querySelector(".bus-mobile");
    const avancee = parcours.querySelector(".bus-progression");
    const depart = new Date(parcours.dataset.depart).getTime();
    const arrivee = new Date(parcours.dataset.arrivee).getTime();
    if (!bus || !Number.isFinite(depart) || !Number.isFinite(arrivee)) return;

    const maintenant = Date.now();
    const largeur = Math.max(0, parcours.clientWidth - bus.offsetWidth);
    const progression = progressionBus(depart, arrivee, maintenant);

    // Premier positionnement (ouverture, ou fusion 60s qui a réinitialisé le
    // marqueur) : place le bus directement, sans balayer depuis le bord.
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

// État du popup bus, perdu par la fusion DOM du rafraîchissement 60s
// (le HTML re-rendu par le serveur repart toujours des valeurs par défaut) ;
// réappliqué par `appliquerEtatPopupBus()`, appelée depuis refresh.js après
// chaque fusion, exactement comme le verrouillage gym se réapplique déjà.
const etatPopupBus = { direction: "onair-meaux", filtre: "tous", tri: "heure", filtresVisibles: false };

function appliquerDirection(popup, bouton, direction) {
  bouton.dataset.directionActuelle = direction;
  bouton.querySelectorAll("[data-direction-texte]").forEach(function (span) {
    span.hidden = span.dataset.directionTexte !== direction;
  });
  popup.querySelectorAll("[data-direction-panneau]").forEach(function (panneau) {
    panneau.hidden = panneau.dataset.directionPanneau !== direction;
  });
}

function basculerDirectionBus(bouton) {
  const popup = bouton.closest(".bus-retour-popup");
  if (!popup) return;
  const actuelle = bouton.dataset.directionActuelle === "onair-meaux" ? "meaux-onair" : "onair-meaux";
  etatPopupBus.direction = actuelle;
  appliquerDirection(popup, bouton, actuelle);

  // Petit pulse au tap ; retiré à la fin pour pouvoir se rejouer au prochain clic.
  bouton.classList.remove("bus-direction-toggle-anime");
  void bouton.offsetWidth;
  bouton.classList.add("bus-direction-toggle-anime");
}

function appliquerFiltre(popup, arret) {
  popup.querySelectorAll(".bus-filtre-chip").forEach(function (chip) {
    chip.classList.toggle("actif", chip.dataset.filtreArret === arret);
  });
  popup.querySelectorAll(".bus-vers-onair li").forEach(function (item) {
    item.hidden = arret !== "tous" && item.dataset.arret !== arret;
  });
}

function basculerFiltreBus(bouton) {
  const popup = bouton.closest(".bus-retour-popup");
  if (!popup) return;
  etatPopupBus.filtre = bouton.dataset.filtreArret;
  appliquerFiltre(popup, etatPopupBus.filtre);
}

const DUREE_ANIMATION_FILTRES_MS = 250;

function appliquerVisibiliteFiltres(popup, visibles, animer) {
  const bouton = popup.querySelector(".bus-filtres-toggle");
  const controles = popup.querySelector(".bus-vers-onair-controles");
  if (!bouton || !controles) return;

  bouton.setAttribute("aria-expanded", visibles ? "true" : "false");
  bouton.classList.toggle("actif", visibles);

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
    clearTimeout(minuterieFiltres);
    minuterieFiltres = setTimeout(() => {
      controles.hidden = true;
    }, DUREE_ANIMATION_FILTRES_MS);
  }
}
let minuterieFiltres = null;

function basculerVisibiliteFiltres(bouton) {
  const popup = bouton.closest(".bus-retour-popup");
  if (!popup) return;
  etatPopupBus.filtresVisibles = !etatPopupBus.filtresVisibles;
  appliquerVisibiliteFiltres(popup, etatPopupBus.filtresVisibles, true);
}

function appliquerTri(popup, tri) {
  const bouton = popup.querySelector(".bus-tri-bouton");
  if (bouton) {
    bouton.dataset.tri = tri;
    bouton.classList.toggle("actif", tri === "marche");
    bouton.querySelector(".bus-tri-texte").textContent =
      tri === "marche" ? "Trier par heure" : "Trier par marche";
  }
  if (tri !== "marche") return; // "heure" = ordre déjà servi par le serveur.

  const liste = popup.querySelector(".bus-vers-onair ul");
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
  if (!popup) return;
  etatPopupBus.tri = bouton.dataset.tri === "marche" ? "heure" : "marche";
  appliquerTri(popup, etatPopupBus.tri);
}

// Réapplique la direction/le filtre/le tri/la visibilité des filtres après
// une fusion DOM (refresh.js).
function appliquerEtatPopupBus() {
  const popup = document.querySelector(".bus-retour-popup");
  const boutonDirection = popup && popup.querySelector(".bus-direction-toggle");
  if (popup && boutonDirection) appliquerDirection(popup, boutonDirection, etatPopupBus.direction);
  if (popup) appliquerFiltre(popup, etatPopupBus.filtre);
  if (popup) appliquerTri(popup, etatPopupBus.tri);
  if (popup) appliquerVisibiliteFiltres(popup, etatPopupBus.filtresVisibles);
}
window.busPopupEtat = { appliquer: appliquerEtatPopupBus };

document.addEventListener("click", function (event) {
  const boutonDirection = event.target.closest(".bus-direction-toggle");
  if (boutonDirection) {
    basculerDirectionBus(boutonDirection);
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

  const boutonBus = event.target.closest(".bus-choix button");
  if (boutonBus) {
    const groupe = boutonBus.closest(".bus-groupe");
    const detail = groupe && groupe.querySelector(`.bus-detail-option[data-bus-id="${boutonBus.dataset.busId}"]`);
    if (!groupe || !detail) return;

    const selections = lireSelections();
    const ligne = groupe.dataset.ligne;
    if (selections[ligne] && selections[ligne].id === boutonBus.dataset.busId) {
      delete selections[ligne];
    } else {
      selections[ligne] = {
        id: boutonBus.dataset.busId,
        arrivee: detail.dataset.arrivee,
        html: detail.outerHTML,
        texteBouton: boutonBus.textContent.trim(),
      };
    }
    sauverSelections(selections);
    positionnerBus();
    return;
  }

  if (event.target.closest("[data-toggle-target='bus-retour-popup']")) {
    setTimeout(positionnerBus, 0);
  }
});

positionnerBus();
setInterval(positionnerBus, 1000);
window.addEventListener("resize", positionnerBus);
