const MINUTE_EN_MS = 60000;

function obtenirPartiesDateParis(date = new Date()) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );
}

function obtenirOffsetParis(date) {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find(({ type }) => type === "timeZoneName")
    ?.value.match(/GMT([+-])(\d{2}):(\d{2})/);

  return offset
    ? (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === "+" ? 1 : -1)
    : 0;
}

function creerDateParis(year, month, day, hour, minute) {
  const dateUTC = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetEnMinutes = obtenirOffsetParis(dateUTC);

  return new Date(dateUTC.getTime() - offsetEnMinutes * MINUTE_EN_MS);
}

function dateLocaleParis(realHeure) {
  const { year, month, day } = obtenirPartiesDateParis();
  const [hour, minute] = realHeure.split("h").map(Number);
  return creerDateParis(year, month, day, hour, minute);
}

function dateISOParis(iso) {
  const [date, heure] = iso.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = heure.split(":").map(Number);
  return creerDateParis(year, month, day, hour, minute);
}

export function dateAujourdhuiParis() {
  const { year, month, day } = obtenirPartiesDateParis();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function jourSemaineParis(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    weekday: "short",
  }).format(date);
}

export function estDimancheParis(date = new Date()) {
  return jourSemaineParis(date) === "Sun";
}

export function estWeekendParis(date = new Date()) {
  const jour = jourSemaineParis(date);
  return jour === "Sat" || jour === "Sun";
}

function extraireHoraires(visite) {
  const trajet = visite?.MonitoredVehicleJourney?.MonitoredCall;
  const estUnDepart = Boolean(trajet?.ExpectedDepartureTime);

  return {
    heure:
      trajet?.ExpectedDepartureTime ??
      trajet?.ExpectedArrivalTime,
    heurePrevue: estUnDepart
      ? trajet?.AimedDepartureTime
      : trajet?.AimedArrivalTime,
  };
}

function nettoyerMessageTrafic(message) {
  const entites = {
    amp: "&",
    apos: "'",
    quot: '"',
    lt: "<",
    gt: ">",
    nbsp: " ",
    agrave: "à",
    acirc: "â",
    eacute: "é",
    egrave: "è",
    ecirc: "ê",
    euml: "ë",
    icirc: "î",
    iuml: "ï",
    ocirc: "ô",
    ugrave: "ù",
    uuml: "ü",
    ccedil: "ç",
  };

  return String(message)
    .replace(/<\s*br\s*\/?>/giu, "\n")
    .replace(/<\/p\s*>/giu, "\n\n")
    .replace(/<p(?:\s[^>]*)?>/giu, "")
    .replace(/<li(?:\s[^>]*)?>/giu, "• ")
    .replace(/<\/li\s*>/giu, "\n")
    .replace(/<[^>]*>/gu, "")
    .replace(/&#x([0-9a-f]+);/giu, (_, valeur) =>
      String.fromCodePoint(Number.parseInt(valeur, 16)),
    )
    .replace(/&#(\d+);/gu, (_, valeur) =>
      String.fromCodePoint(Number.parseInt(valeur, 10)),
    )
    .replace(/&([a-z]+);/giu, (_, nom) => entites[nom.toLowerCase()] ?? `&${nom};`)
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function construireDateLocale(realHeure) {
  return dateLocaleParis(realHeure);
}

// Transformer les perturbations en tableau de messages à afficher
export function extraireMessages(data) {
  const disruptions = data?.disruptions ?? [];

  return disruptions
    .filter((d) => {
      // Garder uniquement les perturbations Ligne P
      const sections = d.impactedSections ?? [];

      return sections.some(
        (s) => s.lineId?.toLowerCase() === "line:idfm:c01730",
      );
    })
    .filter((d) => d.applicationPeriods?.length > 0)
    .map((d) => {
      const section = d.impactedSections?.[0];

      return {
        texte: d.title || d.shortMessage || "Perturbation sur la ligne P",
        details:
          nettoyerMessageTrafic(
            d.description ||
              d.longMessage ||
              d.message ||
              d.shortMessage ||
              d.title ||
              "Aucun détail supplémentaire n'est disponible.",
          ),
        severity: d.severity,
        cause: d.cause,

        estAujourdhui: estActiveAujourdhui(d.applicationPeriods),
        concerneMonTrajet: concerneTrajet(d),

        debut: d.applicationPeriods[0].begin,
        fin: d.applicationPeriods[d.applicationPeriods.length - 1].end,

        trajet:
          section?.from?.name && section?.to?.name
            ? `${nettoyerNomArret(section.from.name)} ↔ ${nettoyerNomArret(section.to.name)}`
            : null,
      };
    });
}

// Transformer les données de passages en tableau de départs simples
export function extraireDeparts(data) {
  const deliveries = data?.Siri?.ServiceDelivery?.StopMonitoringDelivery ?? [];
  const visites = deliveries.flatMap(
    (delivery) => delivery?.MonitoredStopVisit ?? [],
  );

  return visites.map((visite) => {
    const { heure, heurePrevue } = extraireHoraires(visite);
    const ecartMinutes =
      heure && heurePrevue
        ? Math.round(
            (new Date(heure).getTime() - new Date(heurePrevue).getTime()) /
              MINUTE_EN_MS,
          )
        : undefined;
    const dansXMin = heure ? minutesAvantDepart(heure) : undefined;
    const destination =
      visite?.MonitoredVehicleJourney?.DestinationName?.[0]?.value
        ?.replace(/Ch.teau-Thierry/u, "Château-Thierry")
        ?.replace(/La Fert.-Milon/u, "La Ferté-Milon");

    return {
      destination,
      destinationCourte: raccourcirDestination(destination),
      direction: visite?.MonitoredVehicleJourney?.DirectionRef?.value,
      heure,
      heureFormatee: heure ? formaterHeure(heure) : undefined,
      heurePrevue,
      heurePrevueFormatee: heurePrevue
        ? formaterHeure(heurePrevue)
        : undefined,
      ecartMinutes,
      ponctualiteLibelle:
        ecartMinutes === undefined
          ? undefined
          : ecartMinutes > 0
            ? `+${ecartMinutes}min`
            : ecartMinutes < 0
              ? `${Math.abs(ecartMinutes)} min d’avance`
              : "à l’heure",
      ponctualiteClasse:
        ecartMinutes > 0
          ? "retard"
          : ecartMinutes < 0
            ? "avance"
            : "a-heure",
      // 5–9 min : ambre ; 10 min et plus : rouge.
      retardNiveau:
        ecartMinutes >= 10 ? "fort" : ecartMinutes >= 5 ? "moyen" : undefined,
      dansXMin,
      compteAReboursFormate:
        dansXMin === undefined
          ? undefined
          : formaterCompteARebours(dansXMin),
    };
  });
}

const LIGNES_BUS_HAYETTE = {
  C00637: { nom: "7718", couleur: "#3c91dc", texte: "#ffffff", duree: 5 },
  C00914: { nom: "2319", couleur: "#f79036", texte: "#000000", duree: 8 },
  C00949: { nom: "2311", couleur: "#6fa8dc", texte: "#000000", duree: 12 },
  C00900: { nom: "2306", couleur: "#722671", texte: "#ffffff", duree: 10 },
  C00961: { nom: "7709", couleur: "#3c91dc", texte: "#ffffff", duree: 5 },
  C02069: { nom: "2403", couleur: "#dc9600", texte: "#000000", duree: 6 },
  C02070: { nom: "2411", couleur: "#d2d200", texte: "#000000", duree: 10 },
};

function extraireVisites(data) {
  return (data?.Siri?.ServiceDelivery?.StopMonitoringDelivery ?? []).flatMap(
    (livraison) => livraison?.MonitoredStopVisit ?? [],
  );
}

// Associer le même bus entre La Hayette et son arrivée à Meaux.
export function construireBusRetour(donneesDeparts, dataMeaux, trainsRetour = []) {
  const arriveesParTrajet = new Map();
  extraireVisites(dataMeaux).forEach((visite) => {
    const trajet = visite?.MonitoredVehicleJourney?.FramedVehicleJourneyRef
      ?.DatedVehicleJourneyRef;
    if (trajet) arriveesParTrajet.set(trajet, visite);
  });

  const maintenant = Date.now();
  const sources = Array.isArray(donneesDeparts)
    ? donneesDeparts
    : [{ data: donneesDeparts }];
  const visitesDepart = sources.flatMap(({ data }) => extraireVisites(data));
  const buses = visitesDepart
    .map((visite) => {
      const parcours = visite?.MonitoredVehicleJourney;
      const appel = parcours?.MonitoredCall;
      const code = parcours?.LineRef?.value?.match(/C\d+/u)?.[0];
      const ligne = LIGNES_BUS_HAYETTE[code];
      const destination = appel?.DestinationDisplay?.[0]?.value ?? "";
      const arret = appel?.StopPointName?.[0]?.value ?? "";
      const depart = appel?.ExpectedDepartureTime ?? appel?.ExpectedArrivalTime;
      const departPrevu = appel?.AimedDepartureTime ?? appel?.AimedArrivalTime;
      if (!ligne || !/Gare de Meaux/iu.test(destination) || !depart) return null;

      const trajet = parcours?.FramedVehicleJourneyRef?.DatedVehicleJourneyRef;
      const visiteMeaux = trajet ? arriveesParTrajet.get(trajet) : null;
      const appelMeaux = visiteMeaux?.MonitoredVehicleJourney?.MonitoredCall;
      const dureeMs = ligne.duree * MINUTE_EN_MS;
      const arriveePrevue =
        appelMeaux?.AimedArrivalTime ??
        new Date(new Date(departPrevu ?? depart).getTime() + dureeMs).toISOString();
      const arrivee =
        appelMeaux?.ExpectedArrivalTime ??
        new Date(new Date(depart).getTime() + dureeMs).toISOString();
      const train = trainsRetour.find(
        (candidat) => new Date(candidat.heure).getTime() >= new Date(arrivee).getTime(),
      );
      const attenteTrain = train
        ? Math.round((new Date(train.heure).getTime() - new Date(arrivee).getTime()) / MINUTE_EN_MS)
        : null;
      const retardHayette = departPrevu
        ? Math.round((new Date(depart).getTime() - new Date(departPrevu).getTime()) / MINUTE_EN_MS)
        : 0;
      const retardMeaux = arriveePrevue
        ? Math.round((new Date(arrivee).getTime() - new Date(arriveePrevue).getTime()) / MINUTE_EN_MS)
        : 0;
      const departOnAir = new Date(new Date(depart).getTime() - 13 * MINUTE_EN_MS);
      const dansXMin = Math.round((new Date(depart).getTime() - maintenant) / MINUTE_EN_MS);
      // 5–9 min : ambre ; 10 min et plus : rouge (même seuils que les trains).
      const retardNiveau =
        retardMeaux >= 10 ? "fort" : retardMeaux >= 5 ? "moyen" : undefined;

      return {
        id: `${ligne.nom}-${trajet ?? depart}`,
        ligne: ligne.nom,
        arret,
        couleur: ligne.couleur,
        couleurTexte: ligne.texte,
        prioritaire: ligne.nom === "7718" || ligne.nom === "2319",
        retardNiveau,
        compteARebours: `${Math.max(0, dansXMin)} min`,
        departOnAirFormate: formaterHeure(departOnAir),
        depart,
        departFormate: formaterHeure(depart),
        departPrevu,
        departPrevuFormate: departPrevu ? formaterHeure(departPrevu) : null,
        retardHayette,
        arrivee,
        arriveeFormatee: formaterHeure(arrivee),
        arriveePrevue,
        arriveePrevueFormatee: formaterHeure(arriveePrevue),
        arriveeLive: Boolean(appelMeaux?.ExpectedArrivalTime),
        retardMeaux,
        train: train?.heureFormatee ?? null,
        attenteTrain,
      };
    })
    .filter((bus) => bus && new Date(bus.arrivee).getTime() >= maintenant - 2 * MINUTE_EN_MS)
    .sort((a, b) => new Date(a.depart) - new Date(b.depart));

  const principaux = ["7718", "2319"]
    .map((nom) => {
      const meta = Object.values(LIGNES_BUS_HAYETTE).find((ligne) => ligne.nom === nom);
      return {
        ligne: nom,
        couleur: meta.couleur,
        couleurTexte: meta.texte,
        options: buses.filter((bus) => bus.ligne === nom).slice(0, 3),
      };
    });
  const autres = buses
    .filter((bus) => !bus.prioritaire)
    .slice(0, 4);

  return { principaux, autres };
}

// Formater une heure ISO en "17:30"
export function formaterHeure(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Calculer le nombre de minutes avant le départ
export function minutesAvantDepart(iso) {
  const depart = new Date(iso);
  return Math.round((depart.getTime() - Date.now()) / MINUTE_EN_MS);
}

export function formaterCompteARebours(minutes) {
  if (minutes < 0) return `il y a ${Math.abs(minutes)} min`;
  if (minutes === 0) return "maintenant";
  return `dans ${minutes} min`;
}

// Formate les délais réels et de démonstration de façon identique.
export function formaterDelaiPluie(minutes, debut) {
  const dateExacte = debut.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (minutes < 60) {
    return { resume: `Dans ${minutes} min`, dateExacte };
  }

  if (minutes < 24 * 60) {
    const heures = Math.floor(minutes / 60);
    const minutesRestantes = minutes % 60;
    return {
      resume:
        minutesRestantes === 0
          ? `Dans ${heures} h`
          : `Dans ${heures} h ${minutesRestantes} min`,
      dateExacte,
    };
  }

  const jours = Math.ceil(minutes / (24 * 60));
  return {
    resume: `Dans ${jours} jour${jours > 1 ? "s" : ""}`,
    dateExacte,
  };
}

export function trouverProchainePluie(prevision, maintenant = new Date()) {
  const heures = prevision?.hourly?.time ?? [];
  const precipitations = prevision?.hourly?.precipitation ?? [];

  for (let index = 0; index < heures.length; index += 1) {
    if ((precipitations[index] ?? 0) < 0.1) continue;

    const debut = dateISOParis(heures[index]);
    const fin = new Date(debut.getTime() + 60 * MINUTE_EN_MS);

    if (maintenant >= debut && maintenant < fin) {
      return {
        resume: "Pluie en cours",
        dateExacte: null,
      };
    }

    if (debut > maintenant) {
      const minutes = Math.max(
        1,
        Math.round((debut.getTime() - maintenant.getTime()) / MINUTE_EN_MS),
      );

      return formaterDelaiPluie(minutes, debut);
    }
  }

  return {
    resume: "Pas de pluie prévue",
    dateExacte: null,
  };
}

export function raccourcirDestination(dest) {
  const raccourcis = {
    "Château-Thierry": "Ch.-Thierry",
    "La Ferté-Milon": "La Ferté",
  };
  return raccourcis[dest] ?? dest;
}

// Filtrer et trier les départs par destination
export function filtrerDeparts(trains, destinations, limite = null) {
  const resultat = trains
    .filter(
      (train) =>
        destinations.includes(train.destination) && train.dansXMin >= -2,
    )
    .sort((a, b) => new Date(a.heure) - new Date(b.heure));
  return limite ? resultat.slice(0, limite) : resultat;
}

// Score horaire : pluie double, froid simple; le plus bas gagne.
export function evaluerConditionsMeteo({
  precipitation,
  weatherCode,
  cloudCover,
  temperature,
  estJour,
}) {
  const parapluie = precipitation > 0 || weatherCode >= 51;
  const lunettes = cloudCover < 30 && estJour;
  const couche = temperature < 15;
  const score = Number(parapluie) * 2 + Number(couche);

  let resume;
  if (parapluie && couche) resume = "🌧️🥶 Défavorable";
  else if (parapluie) resume = "🌧️ Parapluie !";
  else if (couche) resume = "🥶 Couvre-toi";
  else if (lunettes) resume = "☀️ Lunettes !";
  else resume = "✅ Tranquille";

  return { verdicts: { parapluie, lunettes, couche }, resume, score };
}

function formaterCibleHoraire(date) {
  const { year, month, day, hour } = obtenirPartiesDateParis(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00`;
}

// Prévision de Meaux à l'heure exacte du trajet.
function meteoAHeure(contexte, date) {
  if (!contexte) return null;
  const { prevision, sunrise, sunset } = contexte;
  const cible = formaterCibleHoraire(date);
  const index = prevision.hourly.time.findIndex((t) => t === cible);
  if (index === -1) return null;

  const dateMs = date.getTime();
  const estJour = dateMs >= sunrise * 1000 && dateMs <= sunset * 1000;

  return evaluerConditionsMeteo({
    precipitation: prevision.hourly.precipitation[index],
    weatherCode: prevision.hourly.weather_code[index],
    cloudCover: prevision.hourly.cloud_cover[index],
    temperature: prevision.hourly.temperature_2m[index],
    estJour,
  });
}

function formaterDureeGym(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? `${heures} h` : `${heures} h ${reste}`;
}

// Arrondi à la dizaine inférieure : plus lisible qu'un "xh22" exact.
function arrondirALaDizaineInferieure(date) {
  const d = new Date(date);
  d.setMinutes(Math.floor(d.getMinutes() / 10) * 10, 0, 0);
  return d;
}

// Repli utilisé quand l'horizon temps réel IDFM (1-2h) ne couvre pas
// encore l'heure demandée. Marqué `estime: true`.
const MINUTES_ALLER_ATTENDUES = [30, 38];

function creerTrainsAttendus(borneMinMs, borneMaxMs, minutesAttendues) {
  const trains = [];
  const debutHeure = new Date(borneMinMs);
  debutHeure.setMinutes(0, 0, 0);

  for (
    let heureMs = debutHeure.getTime();
    heureMs <= borneMaxMs;
    heureMs += 60 * MINUTE_EN_MS
  ) {
    for (const minute of minutesAttendues) {
      const d = new Date(heureMs);
      d.setMinutes(minute, 0, 0);
      if (d.getTime() >= borneMinMs && d.getTime() <= borneMaxMs) {
        trains.push({
          heure: d.toISOString(),
          heureFormatee: formaterHeure(d.toISOString()),
          estime: true,
        });
      }
    }
  }

  return trains;
}

// Grille réelle mesurée, pas une formule — ne jamais extrapoler au-delà
// (un "21h45" fabriqué n'existe pas : trou entre 21h15 et 22h15).
const HORAIRES_RETOUR_SEMAINE = [
  [17, 15],
  [17, 45],
  [18, 15],
  [18, 30],
  [18, 45],
  [19, 15],
  [19, 45],
  [20, 15],
  [20, 45],
  [21, 15],
  [22, 15],
  [22, 45],
];

// Le week-end, fréquence réduite à un train par heure, à :15.
function creerTrainsRetourAttendus(borneMinMs, estWeekend) {
  const horaires = estWeekend
    ? Array.from({ length: 24 }, (_, h) => [h, 15])
    : HORAIRES_RETOUR_SEMAINE;

  const { year, month, day } = obtenirPartiesDateParis(new Date(borneMinMs));

  return horaires
    .map(([heure, minute]) => creerDateParis(year, month, day, heure, minute))
    .filter((d) => d.getTime() >= borneMinMs)
    .map((d) => ({
      heure: d.toISOString(),
      heureFormatee: formaterHeure(d.toISOString()),
      estime: true,
    }));
}

// Regroupe les variantes d'une même heure (:30/:38) pour l'effet horloge
// digitale côté vue, au lieu de les traiter comme des fenêtres séparées.
function grouperAllersParHeure(allers) {
  const groupes = new Map();
  for (const aller of allers) {
    const { year, month, day, hour } = obtenirPartiesDateParis(
      new Date(aller.heure),
    );
    const cle = `${year}-${month}-${day}-${hour}`;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(aller);
  }
  return [...groupes.values()].map((groupe) =>
    [...groupe].sort((a, b) => new Date(a.heure) - new Date(b.heure)),
  );
}

// Le live (retards compris) a priorité sur un créneau attendu proche (10 min).
function fusionnerAvecAttendus(trainsLive, trainsAttendus) {
  const proches = (a, b) =>
    Math.abs(new Date(a.heure).getTime() - new Date(b.heure).getTime()) <=
    10 * MINUTE_EN_MS;

  const complements = trainsAttendus.filter(
    (attendu) => !trainsLive.some((live) => proches(live, attendu)),
  );

  return [...trainsLive, ...complements].sort(
    (a, b) => new Date(a.heure) - new Date(b.heure),
  );
}

export function construireTrajetsGym(
  departsAller,
  departsRetour,
  meteoMeaux = null,
  options = {},
) {
  const {
    scooterMinutes = 8,
    retourMinutes = 15,
    dureeMinGymMinutes = 60,
    dureeMaxGymMinutes = 120,
    heureMin = "17h20",
    // Ne pas couper à 20h30 : un train de 20h38 peut encore permettre un
    // retour réel à 22h15 ou 22h45. La grille des retours borne la fin utile.
    heureMax = "23h59",
    // Désactivé en démo : la fenêtre y est élargie à la journée entière.
    avecAttendus = true,
  } = options;

  const scooterMs = scooterMinutes * MINUTE_EN_MS;
  const retourMs = retourMinutes * MINUTE_EN_MS;
  const dureeMinGymMs = dureeMinGymMinutes * MINUTE_EN_MS;
  const borneMin = construireDateLocale(heureMin).getTime();
  const borneMax = construireDateLocale(heureMax).getTime();
  // Un aller déjà parti disparaît au prochain rafraîchissement (60s).
  const borneMinEffective = Math.max(borneMin, Date.now());

  const allersLive = departsAller.filter((train) => {
    const t = new Date(train.heure).getTime();
    return t >= borneMinEffective && t <= borneMax;
  });
  const allersAttendus = avecAttendus
    ? creerTrainsAttendus(borneMinEffective, borneMax, MINUTES_ALLER_ATTENDUES)
    : [];
  const allersViables = fusionnerAvecAttendus(allersLive, allersAttendus);

  const retoursAttendus = avecAttendus
    ? creerTrainsRetourAttendus(borneMin, estWeekendParis(new Date(borneMin)))
    : [];
  const retoursTries = fusionnerAvecAttendus(departsRetour, retoursAttendus);

  const allersParHeure = grouperAllersParHeure(allersViables);
  const groupes = [];

  for (const allersDuGroupe of allersParHeure) {
    const meteo = meteoAHeure(meteoMeaux, new Date(allersDuGroupe[0].heure));
    if (!meteo) continue;

    const sousCreneaux = [];

    // Produit cartésien : chaque aller de l'heure × chaque retour valide
    // dans la fourchette 1h-2h (pas un seul retour par aller).
    for (const aller of allersDuGroupe) {
      const arriveeGymMs = new Date(aller.heure).getTime() + scooterMs;
      const departMaisonMs = arrondirALaDizaineInferieure(
        new Date(new Date(aller.heure).getTime() - scooterMs),
      ).getTime();
      const depart = {
        heure: new Date(departMaisonMs).toISOString(),
        heureFormatee: formaterHeure(new Date(departMaisonMs).toISOString()),
        estime: aller.estime,
      };

      const departSallesVus = new Set();

      for (const retour of retoursTries) {
        const departSalleMsBrut = new Date(retour.heure).getTime() - retourMs;
        const dureeMinutes = Math.round(
          (departSalleMsBrut - arriveeGymMs) / MINUTE_EN_MS,
        );
        if (
          dureeMinutes < dureeMinGymMinutes ||
          dureeMinutes > dureeMaxGymMinutes
        ) {
          continue;
        }

        const departSalleMs = arrondirALaDizaineInferieure(
          new Date(departSalleMsBrut),
        ).getTime();
        if (departSallesVus.has(departSalleMs)) continue;
        departSallesVus.add(departSalleMs);

        sousCreneaux.push({
          aller,
          retour,
          depart,
          arriveeGymFormatee: formaterHeure(
            new Date(arriveeGymMs).toISOString(),
          ),
          departSalleHeure: new Date(departSalleMs).toISOString(),
          departSalleFormatee: formaterHeure(
            new Date(departSalleMs).toISOString(),
          ),
          dureeMinutes,
          dureeFormatee: formaterDureeGym(dureeMinutes),
          meteo,
          estime: Boolean(aller.estime || retour.estime),
          procheDuMax: dureeMinutes >= dureeMaxGymMinutes - 30,
        });
      }
    }

    if (sousCreneaux.length === 0) continue;
    // Dernier "quitter la salle" possible parmi les sous-créneaux du
    // groupe : sert de date d'expiration à une sélection verrouillée
    // côté client (le créneau reste affiché tant qu'il reste jouable).
    const expirationMs = Math.max(
      ...sousCreneaux.map((s) => new Date(s.departSalleHeure).getTime()),
    );
    groupes.push({
      ...sousCreneaux[0],
      sousCreneaux,
      expirationHeure: new Date(expirationMs).toISOString(),
    });
  }

  groupes.sort((a, b) => {
    const scoreA = a.meteo?.score ?? 0;
    const scoreB = b.meteo?.score ?? 0;
    return scoreA - scoreB || new Date(a.aller.heure) - new Date(b.aller.heure);
  });

  return groupes;
}

// Traduire un code météo WMO en description française
export function traduireCodeMeteo(code) {
  const descriptions = {
    0: "☀️ ensoleillé",
    1: "🌤️ peu nuageux",
    2: "⛅ partiellement nuageux",
    3: "☁️ couvert",
    45: "🌫️ brouillard",
    48: "🌫️❄️ brouillard givrant",
    51: "🌦️ bruine légère",
    53: "🌦️ bruine",
    55: "🌧️ bruine dense",
    61: "🌧️ pluie légère",
    63: "🌧️🌧️ pluie",
    65: "🌧️🌧️🌧️ forte pluie",
    71: "🌨️ neige légère",
    73: "🌨️🌨️ neige",
    75: "❄️❄️❄️ forte neige",
    80: "🌦️ averses légères",
    81: "🌧️ averses",
    82: "⛈️ fortes averses",
    95: "⛈️ orage",
    96: "⛈️🌨️ orage avec grêle",
    99: "⛈️⛈️ orage violent",
  };
  return descriptions[code] ?? "conditions variables";
}

// Formater une date IDFM (YYYYMMDDTHHMMSS) dans le fuseau de Paris
export function formaterDatePerturbation(date) {
  if (!date) return null;

  const correspondance = date.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (!correspondance) return date;

  const [, year, month, day, hour, minute] = correspondance.map(Number);
  return creerDateParis(year, month, day, hour, minute).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Le terminus Paris-Est seul ne suffit pas à identifier cette branche.
const ARRETS_TRAJET = ["meaux", "trilport", "château-thierry", "la ferté-milon"];

// Vérifier si une perturbation est active aujourd'hui
function estActiveAujourdhui(periodes) {
  const aujourdhui = dateAujourdhuiParis().replace(/-/g, "");
  return periodes.some((p) => {
    const debut = p.begin?.slice(0, 8) ?? "00000000";
    const fin = p.end?.slice(0, 8) ?? "99999999";
    return debut <= aujourdhui && fin >= aujourdhui;
  });
}

// Vérifier si une perturbation concerne le trajet
function concerneTrajet(disruption) {
  const texte = JSON.stringify(disruption.impactedSections ?? []).toLowerCase();
  return ARRETS_TRAJET.some((arret) => texte.includes(arret));
}

// Nettoyer le nom d'un arrêt en supprimant les parenthèses et leur contenu
function nettoyerNomArret(nom) {
  return nom?.replace(/\s*\(.*?\)/g, "").trim();
}
