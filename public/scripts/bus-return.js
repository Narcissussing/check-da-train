const DIX_MINUTES = 10 * 60 * 1000;
const CLE_SELECTIONS = "lookulooku.busSelections.v2";

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
  document.querySelectorAll(".bus-detail-actif .bus-parcours").forEach(function (parcours) {
    const bus = parcours.querySelector(".bus-mobile");
    const avancee = parcours.querySelector(".bus-progression");
    const depart = new Date(parcours.dataset.depart).getTime();
    const arrivee = new Date(parcours.dataset.arrivee).getTime();
    if (!bus || !Number.isFinite(depart) || !Number.isFinite(arrivee)) return;

    const maintenant = Date.now();
    const largeur = Math.max(0, parcours.clientWidth - bus.offsetWidth);
    const progression = progressionBus(depart, arrivee, maintenant);
    bus.style.transform = `translate3d(${(largeur * progression).toFixed(2)}px, 0, 0)`;
    if (avancee) avancee.style.transform = `scaleX(${progression.toFixed(4)})`;

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

document.addEventListener("click", function (event) {
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
