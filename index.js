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
    ]),
    arrivees: convertir([
      creerVisite("Château-Thierry", 12, 0, "arrivee"),
      creerVisite("La Ferté-Milon", 34, -1, "arrivee"),
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
      2,
    );

    // Arrivées à Trilport depuis l'autre sens
    let arrivesTrilport = filtrerDeparts(
      departsTrilport,
      ["Château-Thierry", "La Ferté-Milon"],
      2,
    );
    if (modeDemo) {
      const trainsDemo = creerTrainsDemo();
      departsTrilportDepart = trainsDemo.departs;
      arrivesTrilport = trainsDemo.arrivees;
    }
    const { meteos, previsions } =
      resultatMeteo.status === "fulfilled"
        ? resultatMeteo.value
        : { meteos: [], previsions: [] };
    const infosTrafic =
      resultatTrafic.status === "fulfilled"
        ? resultatTrafic.value
        : { disruptions: [] };
    const messages = extraireMessages(infosTrafic);
    const prochainePluieTrilport = meteos[0]
      ? trouverProchainePluie(meteos[0])
      : null;

    // Déterminer le niveau d'alerte trafic
    const perturbations = messages.filter(
      (m) =>
        m.cause === "PERTURBATION" && m.estAujourdhui && m.concerneMonTrajet,
    );
    const texteAlerte = perturbations[0]?.texte ?? null;
    const detailAlerte = perturbations[0] ?? null;

    const informations = messages.filter(
      (m) => m.cause === "INFORMATION" && m.estAujourdhui,
    );

    let niveauTrafic =
      resultatTrafic.status === "fulfilled" ? "fluide" : "indisponible";
    const afficherAlerteCarte = perturbations.length > 0;
    if (perturbations.length > 0) {
      niveauTrafic = "alerte";
    } else if (informations.length > 0) {
      niveauTrafic = "info";
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
      afficherAlerteCarte,
      prochainePluieTrilport,
      modeDemo,
      demoDisponible: MODE_DEMO_AUTORISE,
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
      afficherAlerteCarte: false,
      prochaineTravaux: null,
      prochainePluieTrilport: null,
      modeDemo: false,
      demoDisponible: false,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
