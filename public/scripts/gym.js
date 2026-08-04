const DUREE_SOUS_CRENEAU_MS = 7000;
const DUREE_PAUSE_MS = 10000;

let minuterieRotation = null;
let minuterieReprise = null;
let enPause = false;

function demarrerRotationGym() {
  clearTimeout(minuterieRotation);
  if (enPause) return;

  const fenetres = [].slice.call(document.querySelectorAll(".gym-fenetre"));
  const lignes = [].slice.call(
    document.querySelectorAll(".gym-alternative[data-index]"),
  );
  if (fenetres.length === 0) return;

  const pilesParFenetre = fenetres.map(function (fenetre) {
    return [].slice.call(fenetre.querySelectorAll(".gym-sous-stack"));
  });
  const comptesSousParFenetre = pilesParFenetre.map(function (piles) {
    return piles[0] ? piles[0].querySelectorAll(".gym-sous").length : 1;
  });
  const totalEtapes = comptesSousParFenetre.reduce(function (a, b) {
    return a + b;
  }, 0);
  if (totalEtapes <= 1) return;

  const compteFenetres = fenetres.length;

  const appliquerFenetre = function (index) {
    fenetres.forEach(function (fenetre, i) {
      fenetre.classList.toggle("gym-fenetre-active", i === index);
      const ecart = (i - index + compteFenetres) % compteFenetres;
      fenetre.setAttribute(
        "data-etat",
        ecart === 0 ? "actif" : ecart === 1 ? "suivante" : "precedente",
      );
    });
    lignes.forEach(function (ligne) {
      const estActive = Number(ligne.dataset.index) === index;
      ligne.classList.toggle("gym-alternative-cachee", estActive);
    });
  };

  const appliquerSous = function (indexFenetre, indexSous) {
    pilesParFenetre[indexFenetre].forEach(function (pile) {
      const sousElements = [].slice.call(pile.querySelectorAll(".gym-sous"));
      sousElements.forEach(function (el, j) {
        el.classList.toggle("gym-sous-active", j === indexSous);
      });
    });
  };

  let indexFenetre = fenetres.findIndex(function (fenetre) {
    return fenetre.classList.contains("gym-fenetre-active");
  });
  if (indexFenetre === -1) indexFenetre = 0;
  let indexSous = 0;

  appliquerFenetre(indexFenetre);
  appliquerSous(indexFenetre, indexSous);

  const avancer = function () {
    const totalSous = comptesSousParFenetre[indexFenetre];
    if (indexSous < totalSous - 1) {
      indexSous += 1;
      appliquerSous(indexFenetre, indexSous);
    } else {
      indexFenetre = (indexFenetre + 1) % compteFenetres;
      indexSous = 0;
      appliquerFenetre(indexFenetre);
      appliquerSous(indexFenetre, indexSous);
    }
    minuterieRotation = setTimeout(avancer, DUREE_SOUS_CRENEAU_MS);
  };

  minuterieRotation = setTimeout(avancer, DUREE_SOUS_CRENEAU_MS);
}

function configurerPauseRotation() {
  const zone = document.querySelector(".gym-fenetres");
  if (!zone) return;

  const reprendre = function () {
    if (!enPause) return;
    enPause = false;
    clearTimeout(minuterieReprise);
    demarrerRotationGym();
  };

  zone.addEventListener("click", function (event) {
    event.stopPropagation();
    if (enPause) {
      reprendre();
      return;
    }
    enPause = true;
    clearTimeout(minuterieRotation);
    clearTimeout(minuterieReprise);
    minuterieReprise = setTimeout(reprendre, DUREE_PAUSE_MS);
  });

  document.addEventListener("click", reprendre);
}

const BLAGUES_DIMANCHE = [
  "Demande rejetée. Motif invoqué : dimanche.",
  "Request denied under Sunday Statute, article 1.",
  "Dossier en cours d'examen. Résultat : non.",
  "Per company policy, Sundays are rest-mandatory.",
  "I'm just a button, but even I think this is a bad idea.",
  "There's no if-statement in this app for \"yes\" today.",
  "Ce bouton a des convictions religieuses le dimanche.",
  "This joke exists specifically to stall you.",
  "Wrong answer! Try again after a nap.",
  "Achievement unlocked: Stubborn.",
  "And another attempt from the challenger... still no.",
  "Un hibou vient de voter contre.",
  "Random fact: les manchots ne vont pas non plus à la salle.",
  "Somewhere, a cat is also skipping leg day.",
  "Fait divers : un panda a refusé à ta place.",
  "By decree of the Sunday Council, rest shall prevail.",
  "Les esprits du dimanche ont tranché. C'est non.",
  "Le règlement intérieur du dimanche l'interdit formellement.",
  "Chance de gym aujourd'hui : 12%. Chance de regret : 87%.",
  "Ce train ne dessert pas la motivation aujourd'hui.",
  "Même le RER se met en grève le dimanche, techniquement.",
  "Correct. Incorrect. Try again never.",
  "Statistiquement, personne ne regrette une sieste du dimanche.",
  "Ok mais sincèrement, la dernière fois que t'as juste... rien fait ?",
  "Bet you can't resist tapping again though.",
  "Vas-y, insiste. Ça ne changera rien, mais insiste.",
  "Plot twist : le lundi existe pour une bonne raison.",
  "Somewhere a calendar just sighed audibly.",
];
const TAILLE_HISTORIQUE_BLAGUES = 3;
let historiqueBlagues = [];
let tapsDimancheRestants = 3;

function choisirBlague() {
  const disponibles = BLAGUES_DIMANCHE.filter(function (b) {
    return historiqueBlagues.indexOf(b) === -1;
  });
  const bassin = disponibles.length > 0 ? disponibles : BLAGUES_DIMANCHE;
  const choix = bassin[Math.floor(Math.random() * bassin.length)];

  historiqueBlagues.push(choix);
  if (historiqueBlagues.length > TAILLE_HISTORIQUE_BLAGUES) {
    historiqueBlagues.shift();
  }
  return choix;
}

function configurerBoutonTermine() {
  const bouton = document.getElementById("gym-bouton-termine");
  const carte = document.querySelector(".carte-gym");
  if (!bouton || !carte) return;

  bouton.addEventListener("click", function () {
    carte.classList.remove("gym-secousse");
    void carte.offsetWidth; // relance l'animation même si elle vient de jouer
    carte.classList.add("gym-secousse");

    const estDimanche = bouton.dataset.estDimanche === "true";
    const dejaCache = carte.classList.contains("gym-termine");

    if (estDimanche && dejaCache && tapsDimancheRestants > 1) {
      tapsDimancheRestants -= 1;
      const texte = document.querySelector(".gym-repos-texte");
      if (texte) texte.textContent = choisirBlague();
      return;
    }

    tapsDimancheRestants = 3;
    fetch("/gym/terminer" + location.search, { method: "POST" })
      .then(function (reponse) {
        if (!reponse.ok) throw new Error("HTTP " + reponse.status);
        return reponse.json();
      })
      .then(function (donnees) {
        carte.classList.toggle("gym-termine", donnees.termine);
        bouton.setAttribute("aria-pressed", donnees.termine ? "true" : "false");
        const texte = document.querySelector(".gym-repos-texte");
        if (texte) texte.textContent = "Jour de repos.";
      })
      .catch(function (error) {
        console.warn("Bascule gym impossible :", error.message);
      });
  });
}

demarrerRotationGym();
configurerPauseRotation();
configurerBoutonTermine();

window.gymRotation = { redemarrer: demarrerRotationGym };
