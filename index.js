import "dotenv/config";
import express from "express";

import {
  recupererProchainsPassages,
  recupererDonneesMeteo,
  recupererInfosTrafic,
} from "./services/api.js";
import {
  extraireDeparts,
  extraireMessages,
  construireDonneesMeteo,
  enrichirCreneaux,
  filtrerDeparts,
  evaluerCreneau,
  formaterDatePerturbation,
  trouverProchainePluie,
  formaterDelaiPluie,
  traduireCodeMeteo,
} from "./services/utils.js";
import {
  icone,
  iconeMeteo,
  iconeVerdict,
  sceneMeteo,
  animationMeteoFond,
  illustrationTrain,
  couleurTemperature,
} from "./services/icons.js";

const app = express();
const port = process.env.PORT || 3000;
const MODE_DEMO_AUTORISE = process.env.ENABLE_DEMO_MODE === "true";

if (!process.env.IDFM_API_KEY) {
  throw new Error("La variable d'environnement IDFM_API_KEY est requise.");
}

const villes = [
  {
    nom: "Trilport",
    latitude: 48.9568,
    longitude: 2.9508,
  },

  {
    nom: "Meaux",
    latitude: 48.9603,
    longitude: 2.8789,
  },
];
const heuresRecherchees = [
  // Aller
  {
    realHeure: "17h30",
    forecastHeure: "T18:00",
    villeIndex: 0,
    direction: "aller",
  },
  {
    realHeure: "18h30",
    forecastHeure: "T19:00",
    villeIndex: 0,
    direction: "aller",
  },
  {
    realHeure: "19h30",
    forecastHeure: "T20:00",
    villeIndex: 0,
    direction: "aller",
  },
  {
    realHeure: "20h30",
    forecastHeure: "T21:00",
    villeIndex: 0,
    direction: "aller",
  },

  // Retour
  {
    realHeure: "19h30",
    forecastHeure: "T20:00",
    villeIndex: 1,
    direction: "retour",
    prochainCreneau: "20h05",
  },
  {
    realHeure: "20h05",
    forecastHeure: "T20:00",
    villeIndex: 1,
    direction: "retour",
    prochainCreneau: "20h30",
  },
  {
    realHeure: "20h30",
    forecastHeure: "T21:00",
    villeIndex: 1,
    direction: "retour",
    prochainCreneau: "21h05",
  },
  {
    realHeure: "21h05",
    forecastHeure: "T21:00",
    villeIndex: 1,
    direction: "retour",
    prochainCreneau: null,
  },
];

app.set("view engine", "ejs");
app.use(express.static("public"));

// Construire les données météo pour les créneaux
let cacheMeteo = null;
let dernierAppelMeteo = null;
let requeteMeteoEnCours = null;
const DUREE_CACHE = 15 * 60 * 1000;

async function obtenirMeteo() {
  const maintenant = Date.now();
  if (cacheMeteo && maintenant - dernierAppelMeteo <= DUREE_CACHE) {
    return cacheMeteo;
  }

  if (!requeteMeteoEnCours) {
    requeteMeteoEnCours = Promise.all(villes.map(recupererDonneesMeteo))
      .then((donnees) => {
        cacheMeteo = {
          meteos: donnees,
          previsions: donnees,
        };
        dernierAppelMeteo = Date.now();
        return cacheMeteo;
      })
      .finally(() => {
        requeteMeteoEnCours = null;
      });
  }

  try {
    return await requeteMeteoEnCours;
  } catch (error) {
    if (cacheMeteo) return cacheMeteo;
    throw error;
  }
}

function resultatOuTableau(resultat) {
  return resultat.status === "fulfilled" ? extraireDeparts(resultat.value) : [];
}

function heureActuelleParis() {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
}

// Phase de service Ligne P, purement horaire (pas de vraie grille horaire
// disponible côté API, seulement les prochains passages en temps réel) :
//   - "termine" : nuit, plus de train avant le lendemain matin.
//   - "bientot" : juste avant la reprise, le premier train ne va pas
//     tarder à apparaître dans les prochains passages.
//   - "actif" : heures de service normales (même si un creux ponctuel
//     fait que `departs` est vide à cet instant précis).
function phaseService(heureParis) {
  if (heureParis >= 23 || heureParis < 4) return "termine";
  if (heureParis < 5) return "bientot";
  return "actif";
}

function statutService(departs, disponible, phase) {
  if (!disponible) return "indisponible";
  if (departs.length > 0) return "ok";

  return phase === "actif" ? "attente" : phase;
}

function dateAffichee() {
  const texte = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  return texte.split(" à ")[0].replace(/^./, c => c.toUpperCase());
}

// Scènes météo "boutons témoins" — uniquement utilisables en mode démo
// (?demo=1), pour prévisualiser chaque état sans attendre que la vraie
// météo corresponde. Un jeu de valeurs cohérent par scène (pas juste le
// code météo) pour que la carte entière (icône, températures, humidité,
// vent, dégradé de couleur) ait l'air réelle, pas juste l'icône qui change.
const SCENES_METEO_DEMO = {
  soleil: { code: 0, temp: 24, ressenti: 25, min: 16, max: 27, humidite: 40, vent: 8 },
  "soleil-chaud": { code: 0, temp: 38, ressenti: 41, min: 24, max: 40, humidite: 28, vent: 6 },
  nuage: { code: 3, temp: 17, ressenti: 16, min: 11, max: 19, humidite: 68, vent: 14 },
  pluie: { code: 63, temp: 13, ressenti: 11, min: 9, max: 15, humidite: 85, vent: 22 },
  orage: { code: 95, temp: 21, ressenti: 20, min: 15, max: 24, humidite: 78, vent: 30 },
  neige: { code: 73, temp: -3, ressenti: -7, min: -6, max: 0, humidite: 80, vent: 12 },
  brouillard: { code: 45, temp: 6, ressenti: 4, min: 2, max: 9, humidite: 92, vent: 5 },
};

const NIVEAUX_TRAFIC_DEMO = ["fluide", "info", "ailleurs", "alerte"];

const PHASES_SERVICE_DEMO = ["actif", "bientot", "termine"];

// Niveaux de retard "boutons témoins" — pour prévisualiser la lueur orange
// (>5 min, "moyen") et le clignotement rouge (>10 min, "fort") sur l'heure
// principale des cartes départ/arrivée sans attendre un vrai retard.
// "leger" reproduit le comportement par défaut (juste le texte "retard",
// sans lueur ni clignotement) — utile pour vérifier qu'on repasse bien en
// dessous du seuil.
const NIVEAUX_RETARD_DEMO = ["leger", "moyen", "fort"];

const LABELS_METEO_DEMO = {
  soleil: "Soleil",
  "soleil-chaud": "Soleil très chaud",
  nuage: "Nuageux",
  pluie: "Pluie",
  orage: "Orage",
  neige: "Neige",
  brouillard: "Brouillard",
};

const LABELS_TRAFIC_DEMO = {
  fluide: "Fluide",
  info: "Info",
  ailleurs: "Ailleurs",
  alerte: "En panne",
};

const LABELS_SERVICE_DEMO = {
  actif: "Service actif",
  bientot: "Reprise bientôt",
  termine: "Fin de service",
};

const LABELS_RETARD_DEMO = {
  leger: "Retard léger",
  moyen: "Retard >5 min",
  fort: "Retard >10 min",
};

// Scènes "prochaine pluie" — pour tester le texte "Pluie : dans X" sur
// différents délais sans attendre qu'ils arrivent réellement (bug LL-8 :
// "longue" est exactement le cas qui posait problème, un délai en heures ET
// minutes). Chaque scène (sauf les deux cas spéciaux) passe par
// `formaterDelaiPluie()` — la MÊME fonction que le vrai calcul — pour que la
// démo ne puisse jamais afficher un texte que le vrai code ne produirait pas.
const SCENES_PLUIE_DEMO = {
  bientot: { minutes: 15 },
  ronde: { minutes: 60 },
  longue: { minutes: 1018 },
  lointaine: { minutes: 2500 },
  cours: { special: "cours" },
  aucune: { special: "aucune" },
};

const NIVEAUX_PLUIE_DEMO = Object.keys(SCENES_PLUIE_DEMO);

const LABELS_PLUIE_DEMO = {
  bientot: "Dans 15 min",
  ronde: "Dans 1 h",
  longue: "16 h 58 (LL-8)",
  lointaine: "Dans 2 jours",
  cours: "En cours",
  aucune: "Aucune pluie",
};

function creerPluieDemo(cle) {
  const scene = SCENES_PLUIE_DEMO[cle];
  if (scene.special === "cours") {
    return { resume: "Pluie en cours", dateExacte: null };
  }
  if (scene.special === "aucune") {
    return { resume: "Pas de pluie prévue", dateExacte: null };
  }
  const debut = new Date(Date.now() + scene.minutes * 60_000);
  return formaterDelaiPluie(scene.minutes, debut);
}

// Construit les listes de boutons de la barre démo : chaque bouton pointe
// vers l'URL qui active/désactive UNIQUEMENT sa propre valeur, en
// préservant celle de l'autre axe (météo / trafic) déjà active — pour
// pouvoir combiner les deux librement. Re-cliquer un bouton déjà actif
// retire son paramètre (retour à l'état réel).
function construireBoutonsDemo(
  meteoDemoActif,
  traficDemoActif,
  serviceDemoActif,
  retardDemoActif,
  pluieDemoActif,
) {
  const boutonsMeteo = Object.keys(SCENES_METEO_DEMO).map((cle) => {
    const actif = meteoDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (!actif) params.set("meteo", cle);
    if (traficDemoActif) params.set("trafic", traficDemoActif);
    if (serviceDemoActif) params.set("service", serviceDemoActif);
    if (retardDemoActif) params.set("retard", retardDemoActif);
    if (pluieDemoActif) params.set("pluie", pluieDemoActif);
    return {
      cle,
      label: LABELS_METEO_DEMO[cle],
      code: SCENES_METEO_DEMO[cle].code,
      href: `/?${params.toString()}`,
      actif,
    };
  });

  const boutonsTrafic = NIVEAUX_TRAFIC_DEMO.map((cle) => {
    const actif = traficDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (meteoDemoActif) params.set("meteo", meteoDemoActif);
    if (!actif) params.set("trafic", cle);
    if (serviceDemoActif) params.set("service", serviceDemoActif);
    if (retardDemoActif) params.set("retard", retardDemoActif);
    if (pluieDemoActif) params.set("pluie", pluieDemoActif);
    return {
      cle,
      label: LABELS_TRAFIC_DEMO[cle],
      href: `/?${params.toString()}`,
      actif,
    };
  });

  const boutonsService = PHASES_SERVICE_DEMO.map((cle) => {
    const actif = serviceDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (meteoDemoActif) params.set("meteo", meteoDemoActif);
    if (traficDemoActif) params.set("trafic", traficDemoActif);
    if (!actif) params.set("service", cle);
    if (retardDemoActif) params.set("retard", retardDemoActif);
    if (pluieDemoActif) params.set("pluie", pluieDemoActif);
    return {
      cle,
      label: LABELS_SERVICE_DEMO[cle],
      href: `/?${params.toString()}`,
      actif,
    };
  });

  const boutonsRetard = NIVEAUX_RETARD_DEMO.map((cle) => {
    const actif = retardDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (meteoDemoActif) params.set("meteo", meteoDemoActif);
    if (traficDemoActif) params.set("trafic", traficDemoActif);
    if (serviceDemoActif) params.set("service", serviceDemoActif);
    if (!actif) params.set("retard", cle);
    if (pluieDemoActif) params.set("pluie", pluieDemoActif);
    return {
      cle,
      label: LABELS_RETARD_DEMO[cle],
      href: `/?${params.toString()}`,
      actif,
    };
  });

  const boutonsPluie = NIVEAUX_PLUIE_DEMO.map((cle) => {
    const actif = pluieDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (meteoDemoActif) params.set("meteo", meteoDemoActif);
    if (traficDemoActif) params.set("trafic", traficDemoActif);
    if (serviceDemoActif) params.set("service", serviceDemoActif);
    if (retardDemoActif) params.set("retard", retardDemoActif);
    if (!actif) params.set("pluie", cle);
    return {
      cle,
      label: LABELS_PLUIE_DEMO[cle],
      href: `/?${params.toString()}`,
      actif,
    };
  });

  return {
    boutonsMeteo,
    boutonsTrafic,
    boutonsService,
    boutonsRetard,
    boutonsPluie,
  };
}

// Écarts (minutes de retard) associés à chaque bouton témoin "retard" —
// leger reproduit l'écart par défaut (3 min, juste le texte "retard", pas
// de lueur/clignotement) ; moyen et fort dépassent les seuils de
// evaluerCreneau/extraireDeparts (>5 puis >10) pour prévisualiser la lueur
// orange puis le clignotement rouge.
const ECARTS_RETARD_DEMO = { leger: 3, moyen: 7, fort: 13 };

function creerTrainsDemo(retardDemoActif) {
  const ecartPrincipal = ECARTS_RETARD_DEMO[retardDemoActif] ?? 3;
  // Sans bouton "retard" actif, l'arrivée témoin reste "à l'heure" comme
  // avant (comportement par défaut inchangé) — le bouton l'aligne sur le
  // même écart que le départ, pour vérifier au passage que les deux cartes
  // clignotent bien en phase (voir synchroniserAnimationsAlerte).
  const ecartArrivee = retardDemoActif ? ecartPrincipal : 0;

  const creerVisite = (destination, dansMinutes, ecartMinutes, type) => {
    const heure = new Date(Date.now() + dansMinutes * 60_000);
    const heurePrevue = new Date(heure.getTime() - ecartMinutes * 60_000);
    const appel =
      type === "depart"
        ? {
          ExpectedDepartureTime: heure.toISOString(),
          AimedDepartureTime: heurePrevue.toISOString(),
        }
        : {
          ExpectedArrivalTime: heure.toISOString(),
          AimedArrivalTime: heurePrevue.toISOString(),
        };

    return {
      MonitoredVehicleJourney: {
        DestinationName: [{ value: destination }],
        MonitoredCall: appel,
      },
    };
  };

  const convertir = (visites) =>
    extraireDeparts({
      Siri: {
        ServiceDelivery: {
          StopMonitoringDelivery: [{ MonitoredStopVisit: visites }],
        },
      },
    });

  return {
    departs: convertir([
      creerVisite("Paris Est", 8, ecartPrincipal, "depart"),
      creerVisite("Meaux", 28, 0, "depart"),
      creerVisite("Paris Est", 58, 0, "depart"),
    ]),
    arrivees: convertir([
      creerVisite("Château-Thierry", 12, ecartArrivee, "arrivee"),
      creerVisite("La Ferté-Milon", 34, -1, "arrivee"),
      creerVisite("Château-Thierry", 64, 0, "arrivee"),
    ]),
  };
}

app.get("/", async (req, res) => {
  try {
    const modeDemo = MODE_DEMO_AUTORISE && req.query.demo === "1";
    const [resultatMeaux, resultatTrilport, resultatTrafic, resultatMeteo] =
      await Promise.allSettled([
        recupererProchainsPassages("STIF:StopArea:SP:43161:"),
        recupererProchainsPassages("STIF:StopArea:SP:47962:"),
        recupererInfosTrafic(),
        obtenirMeteo(),
      ]);

    const departsMeaux = resultatOuTableau(resultatMeaux);
    const departsTrilport = resultatOuTableau(resultatTrilport);
    const meauxDisponible = resultatMeaux.status === "fulfilled";
    const trilportDisponible = resultatTrilport.status === "fulfilled";

    // Départs Trilport → Meaux / Paris
    let departsTrilportDepart = filtrerDeparts(
      departsTrilport,
      ["Meaux", "Paris Est"],
      3,
    );

    // Arrivées à Trilport depuis l'autre sens
    let arrivesTrilport = filtrerDeparts(
      departsTrilport,
      ["Château-Thierry", "La Ferté-Milon"],
      3,
    );
    // Bouton témoin retard (démo uniquement) : force l'écart du train
    // "vitrine" départ/arrivée pour prévisualiser la lueur orange (>5 min)
    // et le clignotement rouge (>10 min) sans attendre un vrai retard.
    const retardDemoActif =
      modeDemo && NIVEAUX_RETARD_DEMO.includes(req.query.retard)
        ? req.query.retard
        : null;
    if (modeDemo) {
      const trainsDemo = creerTrainsDemo(retardDemoActif);
      departsTrilportDepart = trainsDemo.departs;
      arrivesTrilport = trainsDemo.arrivees;
    }

    // Bouton témoin phase de service (démo uniquement) : pour "bientot"/
    // "termine", vide aussi les trains synthétiques ci-dessus — sinon la
    // démo contredirait sa propre prévisualisation (des trains "présents"
    // alors qu'on prévisualise justement "plus de train").
    const serviceDemoActif =
      modeDemo && PHASES_SERVICE_DEMO.includes(req.query.service)
        ? req.query.service
        : null;
    const phaseServiceActuelle = serviceDemoActif ?? phaseService(heureActuelleParis());
    if (serviceDemoActif && serviceDemoActif !== "actif") {
      departsTrilportDepart = [];
      arrivesTrilport = [];
    }

    let { meteos, previsions } =
      resultatMeteo.status === "fulfilled"
        ? resultatMeteo.value
        : { meteos: [], previsions: [] };

    // Bouton témoin météo (démo uniquement) : ne touche que la carte météo
    // actuelle (icône/températures/humidité/vent) — les prévisions horaires
    // utilisées pour "prochaine pluie" et les créneaux gym restent réelles,
    // volontairement, ce n'est pas ce que ces boutons prévisualisent.
    const meteoDemoActif =
      modeDemo && SCENES_METEO_DEMO[req.query.meteo] ? req.query.meteo : null;
    if (meteoDemoActif && meteos[0]) {
      const scene = SCENES_METEO_DEMO[meteoDemoActif];
      // obtenirMeteo() renvoie le MÊME objet en cache à toutes les requêtes
      // pendant 15 min (voir DUREE_CACHE) — muter meteos[0] en place
      // corromprait la météo réelle affichée à tout le monde jusqu'à
      // expiration du cache. On clone donc (tableau + current + daily,
      // dont les tableaux min/max) avant de surcharger, uniquement ici.
      meteos = [
        {
          ...meteos[0],
          current: { ...meteos[0].current },
          daily: {
            ...meteos[0].daily,
            temperature_2m_min: [...meteos[0].daily.temperature_2m_min],
            temperature_2m_max: [...meteos[0].daily.temperature_2m_max],
          },
        },
        ...meteos.slice(1),
      ];
      meteos[0].current.weather_code = scene.code;
      meteos[0].current.temperature_2m = scene.temp;
      meteos[0].current.apparent_temperature = scene.ressenti;
      meteos[0].current.relative_humidity_2m = scene.humidite;
      meteos[0].current.wind_speed_10m = scene.vent;
      meteos[0].daily.temperature_2m_min[0] = scene.min;
      meteos[0].daily.temperature_2m_max[0] = scene.max;
      // Toutes les scènes météo démo sont pensées de jour (ex. "Soleil") —
      // sans ce forçage, tester ces boutons le soir/la nuit (is_day réel
      // vient de l'API, pas du bouton) renvoyait silencieusement sceneMeteo()
      // sur "calme" (aucune animation), rendant le bouton "Soleil" muet
      // exactement au moment où on veut le prévisualiser.
      meteos[0].current.is_day = 1;
    }

    const infosTrafic =
      resultatTrafic.status === "fulfilled"
        ? resultatTrafic.value
        : { disruptions: [] };
    const messages = extraireMessages(infosTrafic);
    let prochainePluieTrilport = meteos[0]
      ? trouverProchainePluie(meteos[0])
      : null;

    // Bouton témoin pluie (démo uniquement) : force le résumé "Pluie : dans
    // X" sur un délai choisi, pour tester le texte (dont le cas exact du bug
    // LL-8 : un délai en heures ET minutes) sans attendre la vraie prévision.
    const pluieDemoActif =
      modeDemo && NIVEAUX_PLUIE_DEMO.includes(req.query.pluie)
        ? req.query.pluie
        : null;
    if (pluieDemoActif) {
      prochainePluieTrilport = creerPluieDemo(pluieDemoActif);
    }

    // Déterminer le niveau d'alerte trafic — deux tiers de perturbation
    // selon qu'elle touche MON trajet (Trilport↔Meaux/Paris) ou non :
    //   - "alerte" : perturbation sur le trajet → train en panne, figé.
    //   - "ailleurs" : perturbation ailleurs sur la ligne P (avant, cette
    //     catégorie était juste ignorée si ce n'était pas aussi une
    //     INFORMATION — maintenant elle reste visible, mais avec un signal
    //     plus discret (train qui roule mais tressaute) plutôt que la
    //     panne complète, réservée à ce qui affecte vraiment mon trajet.
    const perturbations = messages.filter(
      (m) =>
        m.cause === "PERTURBATION" && m.estAujourdhui && m.concerneMonTrajet,
    );
    const perturbationsAilleurs = messages.filter(
      (m) =>
        m.cause === "PERTURBATION" && m.estAujourdhui && !m.concerneMonTrajet,
    );
    const informations = messages.filter(
      (m) => m.cause === "INFORMATION" && m.estAujourdhui,
    );

    let niveauTrafic =
      resultatTrafic.status === "fulfilled" ? "fluide" : "indisponible";
    let texteAlerte = null;
    let detailAlerte = null;
    if (perturbations.length > 0) {
      niveauTrafic = "alerte";
      texteAlerte = perturbations[0].texte;
      detailAlerte = perturbations[0];
    } else if (perturbationsAilleurs.length > 0) {
      niveauTrafic = "ailleurs";
      texteAlerte = perturbationsAilleurs[0].texte;
      detailAlerte = perturbationsAilleurs[0];
    } else if (informations.length > 0) {
      niveauTrafic = "info";
    }

    // Bouton témoin trafic (démo uniquement) : force niveauTrafic, et pour
    // "alerte"/"ailleurs" fabrique un texte/detailAlerte plausible pour
    // que la carte (et le popup "i") aient un contenu cohérent à afficher.
    const traficDemoActif =
      modeDemo && NIVEAUX_TRAFIC_DEMO.includes(req.query.trafic)
        ? req.query.trafic
        : null;
    if (traficDemoActif) {
      niveauTrafic = traficDemoActif;
      if (traficDemoActif === "alerte") {
        texteAlerte = "Circulation interrompue entre Meaux et Château-Thierry";
        detailAlerte = {
          texte: texteAlerte,
          details:
            "Incident de signalisation entre Meaux et Château-Thierry. Circulation interrompue jusqu'à nouvel ordre. (Aperçu démo — aucun incident réel.)",
          trajet: "Meaux ↔ Château-Thierry",
          debut: null,
          fin: null,
        };
      } else if (traficDemoActif === "ailleurs") {
        texteAlerte = "Ralentissements entre Nanteuil-Saâcy et Charly";
        detailAlerte = {
          texte: texteAlerte,
          details:
            "Travaux de voie entre Nanteuil-Saâcy et Charly. Cette section ne concerne pas le trajet Trilport ↔ Meaux/Paris. (Aperçu démo — aucun incident réel.)",
          trajet: "Nanteuil-Saâcy ↔ Charly",
          debut: null,
          fin: null,
        };
      }
    }

    // Départs utiles depuis Meaux
    const departsRetour = filtrerDeparts(departsMeaux, [
      "Château-Thierry",
      "La Ferté-Milon",
    ]);

    // Départs utiles depuis Trilport
    const departsAller = filtrerDeparts(departsTrilport, [
      "Meaux",
      "Paris Est",
    ]);

    const donneesMeteo =
      meteos.length === villes.length && previsions.length === villes.length
        ? construireDonneesMeteo(previsions, meteos, villes, heuresRecherchees)
        : [];
    const statutDeparts = statutService(
      departsTrilportDepart,
      modeDemo || trilportDisponible,
      phaseServiceActuelle,
    );
    const statutArrivees = statutService(
      arrivesTrilport,
      modeDemo || trilportDisponible,
      phaseServiceActuelle,
    );

    // On enrichit chaque créneau avec verdicts, score et résumé
    const creneauxEvalues = enrichirCreneaux(
      donneesMeteo.map(evaluerCreneau),
      departsAller,
      departsRetour,
    );
    for (const creneau of creneauxEvalues) {
      if (
        (creneau.direction === "aller" && !trilportDisponible) ||
        (creneau.direction === "retour" && !meauxDisponible)
      ) {
        creneau.statutTrain = "indisponible";
      }
    }
    const travauxFuturs = messages
      .filter((m) => m.cause === "TRAVAUX" && m.concerneMonTrajet)
      .sort((a, b) => a.debut.localeCompare(b.debut))
      .slice(0, 4);

    const prochaineTravaux = travauxFuturs[0];

    travauxFuturs.forEach((travaux) => {
      travaux.dateDebut =
        travaux.debut.slice(6, 8) + "/" + travaux.debut.slice(4, 6);

      travaux.dateFin = travaux.fin.slice(6, 8) + "/" + travaux.fin.slice(4, 6);
    });

    const {
      boutonsMeteo,
      boutonsTrafic,
      boutonsService,
      boutonsRetard,
      boutonsPluie,
    } = construireBoutonsDemo(
      meteoDemoActif,
      traficDemoActif,
      serviceDemoActif,
      retardDemoActif,
      pluieDemoActif,
    );
    res.render("index.ejs", {
      meteos,
      creneaux: creneauxEvalues,
      departsRetour,
      departsTrilportDepart,
      arrivesTrilport,
      texteAlerte,
      detailAlerte,
      formaterDatePerturbation,
      statutDeparts,
      statutArrivees,
      traduireCodeMeteo,
      niveauTrafic,
      phaseServiceActuelle,
      prochaineTravaux,
      travauxFuturs,
      prochainePluieTrilport,
      modeDemo,
      demoDisponible: MODE_DEMO_AUTORISE,
      meteoDemoActif,
      traficDemoActif,
      serviceDemoActif,
      retardDemoActif,
      pluieDemoActif,
      boutonsMeteo,
      boutonsTrafic,
      boutonsService,
      boutonsRetard,
      boutonsPluie,
      icone,
      iconeMeteo,
      iconeVerdict,
      sceneMeteo,
      animationMeteoFond,
      illustrationTrain,
      couleurTemperature,
      dateAffichee: dateAffichee(),
    });
  } catch (error) {
    console.error(
      "Erreur API:",
      error.config?.url,
      error.response?.status,
      error.message,
    );

    res.render("index.ejs", {
      meteos: [],
      creneaux: [],
      texteAlerte: null,
      detailAlerte: null,
      erreur: error.message,
      niveauTrafic: "fluide",
      phaseServiceActuelle: "actif",
      prochaineTravaux: null,
      prochainePluieTrilport: null,
      modeDemo: false,
      demoDisponible: false,
      icone,
      iconeMeteo,
      illustrationTrain,
      dateAffichee: dateAffichee(),
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
