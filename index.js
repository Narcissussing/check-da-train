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
  construireTrajetsGym,
  filtrerDeparts,
  formaterDatePerturbation,
  trouverProchainePluie,
  formaterDelaiPluie,
  traduireCodeMeteo,
  dateAujourdhuiParis,
  estDimancheParis,
  construireBusRetour,
} from "./services/utils.js";
import {
  icone,
  iconeMeteo,
  iconeVerdict,
  sceneMeteo,
  animationMeteoFond,
  illustrationTrain,
  illustrationBusCote,
  couleurTemperature,
} from "./services/icons.js";

const app = express();
const port = process.env.PORT || 3000;
const MODE_DEMO_AUTORISE = process.env.ENABLE_DEMO_MODE === "true";

let gymTermineDate = null;
// Sélection verrouillée d'un trajet gym précis (LOOK-44), partagée entre
// tous les onglets/appareils qui consultent le tableau de bord — même
// principe que `gymTermineDate` ci-dessus : état mémoire côté serveur, lu et
// rendu à chaque GET /, donc propagé automatiquement au rafraîchissement 60s
// de chacun sans action manuelle de leur part.
let gymVerrouille = null;

app.post("/gym/verrouiller", express.json(), (req, res) => {
  const { allerHeure, retourHeure, expireISO } = req.body || {};
  const expireMs = expireISO ? new Date(expireISO).getTime() : NaN;

  if (
    typeof allerHeure !== "string" ||
    typeof retourHeure !== "string" ||
    !Number.isFinite(expireMs) ||
    expireMs <= Date.now()
  ) {
    res.status(400).json({ ok: false });
    return;
  }

  gymVerrouille = { allerHeure, retourHeure, expireMs };
  res.json({ ok: true });
});

app.post("/gym/terminer", express.json(), (req, res) => {
  const gymDemoActif =
    MODE_DEMO_AUTORISE &&
    req.query.demo === "1" &&
    NIVEAUX_GYM_DEMO.includes(req.query.gym)
      ? req.query.gym
      : null;

  if (gymDemoActif && gymDemoActif !== "dimanche") {
    res.json({ termine: false });
    return;
  }

  const aujourdhui = dateAujourdhuiParis();
  gymTermineDate = gymTermineDate === aujourdhui ? null : aujourdhui;
  const bascule = gymTermineDate === aujourdhui;
  const estDimanche =
    gymDemoActif === "dimanche" || (!gymDemoActif && estDimancheParis());
  const cache = estDimanche ? !bascule : bascule;
  res.json({ termine: cache });
});

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
app.set("view engine", "ejs");
app.use(express.static("public"));

// Cache météo partagé pendant 10 minutes.
let cacheMeteo = null;
let dernierAppelMeteo = null;
let requeteMeteoEnCours = null;
const DUREE_CACHE = 10 * 60 * 1000;

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

// Estimation horaire faute de grille complète dans l'API.
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

// Valeurs cohérentes pour chaque scène météo de démonstration.
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

// Retards de démonstration pour les deux seuils visuels.
const NIVEAUX_RETARD_DEMO = ["leger", "fort"];

// Prévisualiser le badge retour Meaux (LOOK-43) à chaque seuil de couleur.
const NIVEAUX_RETOUR_MEAUX_DEMO = ["aLheure", "moyen", "fort", "fin"];
const ECARTS_RETOUR_MEAUX_DEMO = { moyen: 6, fort: 12 };

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
  leger: "Retard léger · 5 min",
  fort: "Retard rouge · 10 min+",
};

const LABELS_RETOUR_MEAUX_DEMO = {
  aLheure: "Retour Meaux : à l'heure",
  moyen: "Retour Meaux : retard 6 min",
  fort: "Retour Meaux : retard 12 min",
  fin: "Retour Meaux : fin de service",
};

// Délais de démonstration utilisant le formatage réel.
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

// États gym synthétiques, testables à toute heure.
const NIVEAUX_GYM_DEMO = ["plein", "un", "indisponible", "dimanche", "retard"];

const LABELS_GYM_DEMO = {
  plein: "Gym : 3 trajets",
  un: "Gym : dernier trajet",
  indisponible: "Gym : Meaux HS",
  dimanche: "Gym : dimanche",
  retard: "Gym : retard",
};

function creerTrainsGymDemo(scenario) {
  // Arrondi à la minute (pas Date.now() brut) : deux requêtes rapprochées
  // (ex. deux appareils consultant le tableau de bord à quelques secondes
  // d'écart) doivent voir des trains démo identiques, sinon une sélection
  // verrouillée (LOOK-44, identifiée par l'horaire exact du train) ne
  // pourrait jamais se retrouver d'une requête à l'autre en mode démo.
  const maintenant = Math.floor(Date.now() / 60_000) * 60_000;
  const visite = (destination, dansMinutes, ecartMinutes = 0) => {
    const heure = new Date(maintenant + dansMinutes * 60_000);
    const heurePrevue = new Date(heure.getTime() - ecartMinutes * 60_000);
    return {
      MonitoredVehicleJourney: {
        DestinationName: [{ value: destination }],
        MonitoredCall: {
          ExpectedDepartureTime: heure.toISOString(),
          AimedDepartureTime: heurePrevue.toISOString(),
        },
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

  if (scenario === "indisponible") {
    return {
      departsAller: convertir([visite("Meaux", 12)]),
      departsRetour: [],
    };
  }

  if (scenario === "un") {
    return {
      departsAller: convertir([visite("Meaux", 6)]),
      departsRetour: convertir([visite("Château-Thierry", 90)]),
    };
  }

  if (scenario === "retard") {
    return {
      departsAller: convertir([visite("Meaux", 12, 6)]),
      departsRetour: convertir([visite("Château-Thierry", 100, 4)]),
    };
  }

  return {
    departsAller: convertir([
      visite("Meaux", 12),
      visite("Paris Est", 72),
      visite("Meaux", 132),
    ]),
    departsRetour: convertir([
      visite("Château-Thierry", 100),
      visite("La Ferté-Milon", 170),
      visite("Château-Thierry", 230),
    ]),
  };
}

// Le deuxième trajet est pluvieux pour vérifier le classement météo.
function creerMeteoGymDemo() {
  const maintenant = new Date();
  const heurePluie = new Date(maintenant.getTime() + 72 * 60_000).getHours();
  const pad = (n) => String(n).padStart(2, "0");
  const hourly = {
    time: [],
    temperature_2m: [],
    precipitation: [],
    cloud_cover: [],
    weather_code: [],
  };

  for (let h = 0; h < 24; h += 1) {
    const d = new Date(maintenant);
    d.setHours(h, 0, 0, 0);
    const pluvieux = h === heurePluie;
    hourly.time.push(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:00`,
    );
    hourly.temperature_2m.push(pluvieux ? 14 : 21);
    hourly.precipitation.push(pluvieux ? 3 : 0);
    hourly.cloud_cover.push(pluvieux ? 90 : 15);
    hourly.weather_code.push(pluvieux ? 61 : 0);
  }

  return {
    prevision: { hourly },
    sunrise: maintenant.getTime() / 1000 - 6 * 3600,
    sunset: maintenant.getTime() / 1000 + 6 * 3600,
  };
}

// Chaque filtre de démonstration conserve les autres paramètres actifs.
function construireBoutonsDemo(
  meteoDemoActif,
  traficDemoActif,
  serviceDemoActif,
  retardDemoActif,
  pluieDemoActif,
  gymDemoActif,
  retourMeauxDemoActif,
) {
  const boutonsMeteo = Object.keys(SCENES_METEO_DEMO).map((cle) => {
    const actif = meteoDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (!actif) params.set("meteo", cle);
    if (traficDemoActif) params.set("trafic", traficDemoActif);
    if (serviceDemoActif) params.set("service", serviceDemoActif);
    if (retardDemoActif) params.set("retard", retardDemoActif);
    if (pluieDemoActif) params.set("pluie", pluieDemoActif);
    if (gymDemoActif) params.set("gym", gymDemoActif);
    if (retourMeauxDemoActif) params.set("retourMeaux", retourMeauxDemoActif);
    return {
      cle,
      label: LABELS_METEO_DEMO[cle],
      code: SCENES_METEO_DEMO[cle].code,
      temp: SCENES_METEO_DEMO[cle].temp,
      href: `/?${params.toString()}`,
      actif,
    };
  });

  const boutonsTrafic = NIVEAUX_TRAFIC_DEMO.map((cle) => {
    const actif = traficDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (meteoDemoActif) params.set("meteo", meteoDemoActif);
    if (!actif) {
      params.set("trafic", cle);
      // Un scénario trafic explicitement choisi doit rester visible la nuit.
      params.set("service", "actif");
    } else if (serviceDemoActif) {
      params.set("service", serviceDemoActif);
    }
    if (retardDemoActif) params.set("retard", retardDemoActif);
    if (pluieDemoActif) params.set("pluie", pluieDemoActif);
    if (gymDemoActif) params.set("gym", gymDemoActif);
    if (retourMeauxDemoActif) params.set("retourMeaux", retourMeauxDemoActif);
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
    if (gymDemoActif) params.set("gym", gymDemoActif);
    if (retourMeauxDemoActif) params.set("retourMeaux", retourMeauxDemoActif);
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
    if (gymDemoActif) params.set("gym", gymDemoActif);
    if (retourMeauxDemoActif) params.set("retourMeaux", retourMeauxDemoActif);
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
    if (gymDemoActif) params.set("gym", gymDemoActif);
    if (retourMeauxDemoActif) params.set("retourMeaux", retourMeauxDemoActif);
    return {
      cle,
      label: LABELS_PLUIE_DEMO[cle],
      href: `/?${params.toString()}`,
      actif,
    };
  });

  const boutonsGym = NIVEAUX_GYM_DEMO.map((cle) => {
    const actif = gymDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (meteoDemoActif) params.set("meteo", meteoDemoActif);
    if (traficDemoActif) params.set("trafic", traficDemoActif);
    if (serviceDemoActif) params.set("service", serviceDemoActif);
    if (retardDemoActif) params.set("retard", retardDemoActif);
    if (pluieDemoActif) params.set("pluie", pluieDemoActif);
    if (!actif) params.set("gym", cle);
    if (retourMeauxDemoActif) params.set("retourMeaux", retourMeauxDemoActif);
    return {
      cle,
      label: LABELS_GYM_DEMO[cle],
      href: `/?${params.toString()}`,
      actif,
    };
  });

  const boutonsRetourMeaux = NIVEAUX_RETOUR_MEAUX_DEMO.map((cle) => {
    const actif = retourMeauxDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (meteoDemoActif) params.set("meteo", meteoDemoActif);
    if (traficDemoActif) params.set("trafic", traficDemoActif);
    if (serviceDemoActif) params.set("service", serviceDemoActif);
    if (retardDemoActif) params.set("retard", retardDemoActif);
    if (pluieDemoActif) params.set("pluie", pluieDemoActif);
    if (gymDemoActif) params.set("gym", gymDemoActif);
    if (!actif) params.set("retourMeaux", cle);
    return {
      cle,
      label: LABELS_RETOUR_MEAUX_DEMO[cle],
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
    boutonsGym,
    boutonsRetourMeaux,
  };
}

const ECARTS_RETARD_DEMO = { leger: 5, fort: 10 };

function creerTrainsDemo(retardDemoActif) {
  const ecartPrincipal = ECARTS_RETARD_DEMO[retardDemoActif] ?? 3;
  // Le mode retard aligne départ et arrivée.
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

// Un seul train Meaux → Château-Thierry synthétique, au seuil de retard demandé.
function creerRetourMeauxDemo(cle) {
  if (cle === "fin") return [];

  const ecart = ECARTS_RETOUR_MEAUX_DEMO[cle] ?? 0;
  const heure = new Date(Date.now() + 20 * 60_000);
  const heurePrevue = new Date(heure.getTime() - ecart * 60_000);

  return extraireDeparts({
    Siri: {
      ServiceDelivery: {
        StopMonitoringDelivery: [
          {
            MonitoredStopVisit: [
              {
                MonitoredVehicleJourney: {
                  DestinationName: [{ value: "Château-Thierry" }],
                  MonitoredCall: {
                    ExpectedDepartureTime: heure.toISOString(),
                    AimedDepartureTime: heurePrevue.toISOString(),
                  },
                },
              },
            ],
          },
        ],
      },
    },
  });
}

app.get("/", async (req, res) => {
  try {
    const modeDemo = MODE_DEMO_AUTORISE && req.query.demo === "1";
    const [resultatMeaux, resultatTrilport, resultatTrafic, resultatMeteo, resultatBusHayette, resultatBusFauvettes, resultatBusSaintsPeres, resultatBusMeaux] =
      await Promise.allSettled([
        recupererProchainsPassages("STIF:StopArea:SP:43161:"),
        recupererProchainsPassages("STIF:StopArea:SP:47962:"),
        recupererInfosTrafic(),
        obtenirMeteo(),
        recupererProchainsPassages("STIF:StopArea:SP:427141:"),
        recupererProchainsPassages("STIF:StopArea:SP:478203:"),
        recupererProchainsPassages("STIF:StopArea:SP:10863:"),
        recupererProchainsPassages("STIF:StopPoint:Q:19851:"),
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
    // Force le retard du train principal en démonstration.
    const retardDemoActif =
      modeDemo && NIVEAUX_RETARD_DEMO.includes(req.query.retard)
        ? req.query.retard
        : null;
    if (modeDemo) {
      const trainsDemo = creerTrainsDemo(retardDemoActif);
      departsTrilportDepart = trainsDemo.departs;
      arrivesTrilport = trainsDemo.arrivees;
    }

    // Une phase inactive masque aussi les trains synthétiques.
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

    // Le filtre météo ne modifie pas les prévisions horaires.
    const meteoDemoActif =
      modeDemo && SCENES_METEO_DEMO[req.query.meteo] ? req.query.meteo : null;
    if (meteoDemoActif && meteos[0]) {
      const scene = SCENES_METEO_DEMO[meteoDemoActif];
      // Clone le cache avant toute surcharge de démonstration.
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
      // Les scènes de démonstration représentent le jour.
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

    // Force le résumé de pluie en démonstration.
    const pluieDemoActif =
      modeDemo && NIVEAUX_PLUIE_DEMO.includes(req.query.pluie)
        ? req.query.pluie
        : null;
    if (pluieDemoActif) {
      prochainePluieTrilport = creerPluieDemo(pluieDemoActif);
    }

    const gymDemoActif =
      modeDemo && NIVEAUX_GYM_DEMO.includes(req.query.gym)
        ? req.query.gym
        : null;

    const retourMeauxDemoActif =
      modeDemo && NIVEAUX_RETOUR_MEAUX_DEMO.includes(req.query.retourMeaux)
        ? req.query.retourMeaux
        : null;

    // Distingue les incidents du trajet de ceux du reste de la ligne.
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
      texteAlerte = informations[0].texte;
      detailAlerte = informations[0];
    }

    // Ajoute un message cohérent aux alertes de démonstration.
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
      } else if (traficDemoActif === "info") {
        texteAlerte = "Information voyageurs sur la ligne P";
        detailAlerte = {
          texte: texteAlerte,
          details:
            "Message d'information destiné aux voyageurs de la ligne P. (Aperçu démo — aucune information réelle.)",
          trajet: "Ligne P",
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
    const busRetour = construireBusRetour(
      [resultatBusHayette, resultatBusFauvettes, resultatBusSaintsPeres].map(
        (resultat) => ({ data: resultat.status === "fulfilled" ? resultat.value : null }),
      ),
      resultatBusMeaux.status === "fulfilled" ? resultatBusMeaux.value : null,
      departsRetour,
    );
    // Prochain retour Meaux → Trilport affiché en en-tête gym (LOOK-43) :
    // même gating que les cartes départ/arrivée, indépendant des trajets
    // gym eux-mêmes qui restent basés sur `departsRetour` non filtré.
    let departsRetourEntete =
      serviceDemoActif && serviceDemoActif !== "actif" ? [] : departsRetour;
    if (retourMeauxDemoActif) {
      departsRetourEntete = creerRetourMeauxDemo(retourMeauxDemoActif);
    }

    // Départs utiles depuis Trilport
    const departsAller = filtrerDeparts(departsTrilport, [
      "Meaux",
      "Paris Est",
    ]);

    const statutRetourMeaux =
      retourMeauxDemoActif === "fin"
        ? "termine"
        : statutService(
            departsRetourEntete,
            modeDemo || meauxDisponible,
            phaseServiceActuelle,
          );

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

    let departsAllerGym = departsAller;
    let departsRetourGym = departsRetour;
    let meteoMeauxGym = previsions[1]
      ? {
          prevision: previsions[1],
          sunrise: new Date(meteos[1].daily.sunrise[0]).getTime() / 1000,
          sunset: new Date(meteos[1].daily.sunset[0]).getTime() / 1000,
        }
      : null;
    let gymDonneesDisponibles = trilportDisponible && meauxDisponible;
    let bornesGym = {};
    if (gymDemoActif) {
      const donneesDemo = creerTrainsGymDemo(gymDemoActif);
      departsAllerGym = donneesDemo.departsAller;
      departsRetourGym = donneesDemo.departsRetour;
      meteoMeauxGym = creerMeteoGymDemo();
      gymDonneesDisponibles = gymDemoActif !== "indisponible";
      bornesGym = { heureMin: "0h00", heureMax: "23h59", avecAttendus: false };
    }
    // Les recommandations du soir restent cachées pendant la nuit et ne
    // réapparaissent qu'à partir de 7h (les scénarios démo restent testables).
    const gymDansPlageAffichage = Boolean(gymDemoActif) || heureActuelleParis() >= 7;
    const trajetsGymTous = gymDonneesDisponibles && gymDansPlageAffichage
      ? construireTrajetsGym(
          departsAllerGym,
          departsRetourGym,
          meteoMeauxGym,
          bornesGym,
        )
      : [];
    const trajetsGym = trajetsGymTous.slice(0, 3);
    const gymVerrouilleActif =
      gymVerrouille && Date.now() < gymVerrouille.expireMs
        ? gymVerrouille
        : null;
    const bascauleIgnoree = gymDemoActif && gymDemoActif !== "dimanche";
    const gymBasculeAujourdhui =
      !bascauleIgnoree && gymTermineDate === dateAujourdhuiParis();
    const estDimancheAujourdhui =
      gymDemoActif === "dimanche" || (!gymDemoActif && estDimancheParis());
    const gymCacheAujourdhui = estDimancheAujourdhui
      ? !gymBasculeAujourdhui
      : gymBasculeAujourdhui;
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
      boutonsGym,
      boutonsRetourMeaux,
    } = construireBoutonsDemo(
      meteoDemoActif,
      traficDemoActif,
      serviceDemoActif,
      retardDemoActif,
      pluieDemoActif,
      gymDemoActif,
      retourMeauxDemoActif,
    );
    res.render("index.ejs", {
      meteos,
      trajetsGym,
      trajetsGymTous,
      gymCacheAujourdhui,
      estDimancheAujourdhui,
      gymVerrouilleActif,
      departsTrilportDepart,
      arrivesTrilport,
      departsRetourEntete,
      busRetour,
      texteAlerte,
      detailAlerte,
      formaterDatePerturbation,
      statutDeparts,
      statutArrivees,
      statutRetourMeaux,
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
      gymDemoActif,
      retourMeauxDemoActif,
      boutonsMeteo,
      boutonsTrafic,
      boutonsService,
      boutonsRetard,
      boutonsPluie,
      boutonsGym,
      boutonsRetourMeaux,
      icone,
      iconeMeteo,
      iconeVerdict,
      sceneMeteo,
      animationMeteoFond,
      illustrationTrain,
      illustrationBusCote,
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
      trajetsGym: [],
      trajetsGymTous: [],
      gymCacheAujourdhui: false,
      estDimancheAujourdhui: false,
      gymVerrouilleActif: null,
      departsRetourEntete: [],
      busRetour: { principaux: [], autres: [] },
      statutRetourMeaux: "indisponible",
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
      illustrationBusCote,
      dateAffichee: dateAffichee(),
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
