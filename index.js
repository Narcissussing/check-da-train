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

function statutService(departs, disponible) {
  if (!disponible) return "indisponible";
  if (departs.length > 0) return "ok";

  const heureParis = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
  return heureParis < 5 ? "attente" : heureParis >= 23 ? "termine" : "attente";
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
  soleil: { code: 0, temp: 29, ressenti: 30, min: 19, max: 31, humidite: 35, vent: 8 },
  nuage: { code: 3, temp: 17, ressenti: 16, min: 11, max: 19, humidite: 68, vent: 14 },
  pluie: { code: 63, temp: 13, ressenti: 11, min: 9, max: 15, humidite: 85, vent: 22 },
  orage: { code: 95, temp: 21, ressenti: 20, min: 15, max: 24, humidite: 78, vent: 30 },
  neige: { code: 73, temp: -3, ressenti: -7, min: -6, max: 0, humidite: 80, vent: 12 },
  brouillard: { code: 45, temp: 6, ressenti: 4, min: 2, max: 9, humidite: 92, vent: 5 },
};

const NIVEAUX_TRAFIC_DEMO = ["fluide", "info", "ailleurs", "alerte"];

const LABELS_METEO_DEMO = {
  soleil: "Soleil",
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

// Construit les listes de boutons de la barre démo : chaque bouton pointe
// vers l'URL qui active/désactive UNIQUEMENT sa propre valeur, en
// préservant celle de l'autre axe (météo / trafic) déjà active — pour
// pouvoir combiner les deux librement. Re-cliquer un bouton déjà actif
// retire son paramètre (retour à l'état réel).
function construireBoutonsDemo(meteoDemoActif, traficDemoActif) {
  const boutonsMeteo = Object.keys(SCENES_METEO_DEMO).map((cle) => {
    const actif = meteoDemoActif === cle;
    const params = new URLSearchParams({ demo: "1" });
    if (!actif) params.set("meteo", cle);
    if (traficDemoActif) params.set("trafic", traficDemoActif);
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
    return {
      cle,
      label: LABELS_TRAFIC_DEMO[cle],
      href: `/?${params.toString()}`,
      actif,
    };
  });

  return { boutonsMeteo, boutonsTrafic };
}

// Boutons "scénario" : un clic force météo + trafic en une fois, pour
// couvrir toutes les combinaisons (6 météo × 3 trafic = 18) sans avoir à
// cliquer les deux axes séparément à chaque fois.
function construireScenariosDemo(meteoDemoActif, traficDemoActif) {
  const scenarios = [];
  Object.keys(SCENES_METEO_DEMO).forEach((meteo) => {
    NIVEAUX_TRAFIC_DEMO.forEach((trafic) => {
      const params = new URLSearchParams({ demo: "1", meteo, trafic });
      scenarios.push({
        cle: `${meteo}-${trafic}`,
        label: `${LABELS_METEO_DEMO[meteo]} · ${LABELS_TRAFIC_DEMO[trafic]}`,
        href: `/?${params.toString()}`,
        actif: meteoDemoActif === meteo && traficDemoActif === trafic,
      });
    });
  });
  return scenarios;
}

function creerTrainsDemo() {
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
      creerVisite("Paris Est", 8, 3, "depart"),
      creerVisite("Meaux", 28, 0, "depart"),
      creerVisite("Paris Est", 58, 0, "depart"),
    ]),
    arrivees: convertir([
      creerVisite("Château-Thierry", 12, 0, "arrivee"),
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
    if (modeDemo) {
      const trainsDemo = creerTrainsDemo();
      departsTrilportDepart = trainsDemo.departs;
      arrivesTrilport = trainsDemo.arrivees;
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
    }

    const infosTrafic =
      resultatTrafic.status === "fulfilled"
        ? resultatTrafic.value
        : { disruptions: [] };
    const messages = extraireMessages(infosTrafic);
    const prochainePluieTrilport = meteos[0]
      ? trouverProchainePluie(meteos[0])
      : null;

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
    );
    const statutArrivees = statutService(
      arrivesTrilport,
      modeDemo || trilportDisponible,
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

    const { boutonsMeteo, boutonsTrafic } = construireBoutonsDemo(
      meteoDemoActif,
      traficDemoActif,
    );
    const scenariosDemo = construireScenariosDemo(
      meteoDemoActif,
      traficDemoActif,
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
      prochaineTravaux,
      travauxFuturs,
      prochainePluieTrilport,
      modeDemo,
      demoDisponible: MODE_DEMO_AUTORISE,
      meteoDemoActif,
      traficDemoActif,
      boutonsMeteo,
      boutonsTrafic,
      scenariosDemo,
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
