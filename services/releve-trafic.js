// === Relevé des perturbations Ligne P et des retards à Trilport (Family Hub, schéma trafic) ===

import pg from "pg";

const LIGNE_P = "line:IDFM:C01730";
const SEUIL_RETARD_MIN = 5;
const RELEVES_NORMAUX_POUR_FIN = 2;
// Un épisode ouvert plus ancien n'est pas repris au démarrage : sa vraie fin est inconnue.
const REPRISE_MAX_MS = 6 * 60 * 60 * 1000;

// Perturbations vues depuis la dernière écriture, par identifiant IDFM.
const releve = new Map();
// Nouvelles fins annoncées à écrire, et dernière annonce connue par perturbation.
let annonces = [];
const derniereAnnonce = new Map();
// Perturbations en cours qui touchent Trilport, mises à jour à chaque relevé.
let actifsTrilport = new Set();
// Épisode de retard ouvert, et épisodes terminés à écrire.
let episode = null;
let episodesTermines = [];
let relevesNormaux = 0;
let finCandidate = null;
let jourEcrit = jourParis();
// Les retards ne sont notés qu'une fois l'épisode ouvert repris, pour ne pas en créer un doublon.
let repriseFaite = false;
let ecritureEnCours = null;

function jourParis() {
  return new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}

// Heure de Paris au format des périodes IDFM (20261116T170000).
function maintenantParisCompact() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`;
}

// Garde en mémoire chaque perturbation Ligne P de la réponse IDFM, et chaque nouvelle fin annoncée.
export function noterPerturbations(data) {
  const ligne = data?.lines?.find((l) => l.id?.toLowerCase() === LIGNE_P.toLowerCase());
  if (!ligne) return;

  const objets = ligne.impactedObjects ?? [];
  const ids = new Set(objets.flatMap((o) => o.disruptionIds ?? []));
  const maintenant = new Date();
  const maintenantCompact = maintenantParisCompact();
  const touchentTrilport = new Set();

  for (const d of data.disruptions ?? []) {
    if (!ids.has(d.id)) continue;
    const touches = objets.filter((o) => o.disruptionIds?.includes(d.id));
    const arrets = touches.filter((o) => o.type === "stop_point").map((o) => o.name);
    const deja = releve.get(d.id);

    releve.set(d.id, {
      idfm_id: d.id,
      titre: d.title ?? null,
      message: d.message ?? null,
      cause: d.cause ?? null,
      severite: d.severity ?? null,
      arrets,
      vue_premiere: deja?.vue_premiere ?? maintenant,
      vue_derniere: maintenant,
      brut: { ...d, impactedObjects: touches },
    });

    const periode = (d.applicationPeriods ?? []).find(
      (p) => p.begin <= maintenantCompact && (!p.end || p.end >= maintenantCompact),
    );
    if (!periode?.end) continue;
    if (arrets.includes("Trilport")) touchentTrilport.add(d.id);

    const cle = `${periode.end}|${d.message ?? ""}`;
    if (derniereAnnonce.get(d.id) === cle) continue;
    derniereAnnonce.set(d.id, cle);
    annonces.push({
      idfm_id: d.id,
      vue_le: maintenant,
      fin_locale: periode.end,
      titre: d.title ?? null,
      message: d.message ?? "",
    });
  }

  actifsTrilport = touchentTrilport;
}

// Suit les épisodes de retard à Trilport : début au premier train à 5 min ou plus, fin au premier relevé normal confirmé.
// Un train supprimé compte comme un problème, au même titre qu'un retard.
export function noterRetards(visitesTrilport) {
  if (!repriseFaite) return;
  const visites = visitesTrilport ?? [];
  const supprimes = visites.filter((v) => v.statut === "cancelled").length;
  const retards = visites
    .filter((v) => v.statut !== "cancelled")
    .map((v) => v.ecartMinutes ?? 0)
    .filter((e) => e >= SEUIL_RETARD_MIN);
  const maintenant = new Date();
  let aEcrire = false;

  if (retards.length > 0 || supprimes > 0) {
    if (!episode) {
      episode = {
        debut: maintenant,
        retard_max_min: 0,
        trains_retardes: 0,
        trains_supprimes: 0,
        perturbations: new Set(),
      };
      aEcrire = true;
    }
    episode.retard_max_min = Math.max(episode.retard_max_min, ...retards, 0);
    episode.trains_retardes = Math.max(episode.trains_retardes, retards.length);
    episode.trains_supprimes = Math.max(episode.trains_supprimes, supprimes);
    relevesNormaux = 0;
    finCandidate = null;
  } else if (episode) {
    relevesNormaux += 1;
    if (relevesNormaux === 1) finCandidate = maintenant;
    if (relevesNormaux >= RELEVES_NORMAUX_POUR_FIN) {
      episodesTermines.push({ ...episode, fin: finCandidate });
      episode = null;
      relevesNormaux = 0;
      finCandidate = null;
      aEcrire = true;
    }
  }

  if (episode) actifsTrilport.forEach((id) => episode.perturbations.add(id));
  // Début et fin écrits tout de suite, pour qu'un plantage ne perde pas l'épisode.
  if (aEcrire) enregistrerRetards();
}

function versLigneRetard(e) {
  return {
    debut: e.debut,
    fin: e.fin ?? null,
    retard_max_min: e.retard_max_min,
    trains_retardes: e.trains_retardes,
    trains_supprimes: e.trains_supprimes ?? 0,
    perturbations: [...e.perturbations],
  };
}

const SQL_RETARDS = `INSERT INTO trafic.retards
     (debut, fin, retard_max_min, trains_retardes, trains_supprimes, perturbations)
   SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(
     debut TIMESTAMPTZ, fin TIMESTAMPTZ, retard_max_min INTEGER, trains_retardes INTEGER,
     trains_supprimes INTEGER, perturbations TEXT[])
   ON CONFLICT (arret, debut) DO UPDATE SET
     fin = COALESCE(EXCLUDED.fin, trafic.retards.fin),
     retard_max_min = GREATEST(trafic.retards.retard_max_min, EXCLUDED.retard_max_min),
     trains_retardes = GREATEST(trafic.retards.trains_retardes, EXCLUDED.trains_retardes),
     trains_supprimes = GREATEST(trafic.retards.trains_supprimes, EXCLUDED.trains_supprimes),
     perturbations = ARRAY(SELECT DISTINCT unnest(trafic.retards.perturbations || EXCLUDED.perturbations))`;

async function avecClient(travail) {
  if (!process.env.DATABASE_URL) return;
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await travail(client);
  } catch (error) {
    console.error("Relevé trafic non enregistré :", error.message);
  } finally {
    await client.end().catch(() => {});
  }
}

// Écrit seulement les épisodes de retard (ouvert et terminés).
async function enregistrerRetards() {
  const termines = episodesTermines;
  const lignes = [...termines, ...(episode ? [episode] : [])].map(versLigneRetard);
  if (lignes.length === 0) return;
  await avecClient(async (client) => {
    await client.query(SQL_RETARDS, [JSON.stringify(lignes)]);
    episodesTermines = episodesTermines.filter((e) => !termines.includes(e));
  });
}

// Reprend au démarrage l'épisode resté ouvert (deploy ou plantage), au lieu d'en créer un second.
// Un épisode trop ancien est fermé à son début, pour ne pas rester actif dans v_retards.
async function reprendreEpisode() {
  await avecClient(async (client) => {
    const fermes = await client.query(
      `UPDATE trafic.retards SET fin = debut
       WHERE arret = 'trilport' AND fin IS NULL AND debut < now() - make_interval(secs => $1)`,
      [REPRISE_MAX_MS / 1000],
    );
    if (fermes.rowCount > 0) console.log(`Relevé trafic : ${fermes.rowCount} épisode(s) trop ancien(s) fermé(s).`);
    const { rows } = await client.query(
      `SELECT debut, retard_max_min, trains_retardes, trains_supprimes, perturbations
       FROM trafic.retards WHERE arret = 'trilport' AND fin IS NULL
       ORDER BY debut DESC LIMIT 1`,
    );
    const ouvert = rows[0];
    if (!ouvert || episode) return;
    episode = { ...ouvert, perturbations: new Set(ouvert.perturbations) };
    console.log(`Relevé trafic : épisode de retard repris (début ${ouvert.debut.toISOString()}).`);
  });
}

// Une seule écriture à la fois ; renvoie true si le relevé est bien enregistré.
export function enregistrerReleve() {
  ecritureEnCours ??= ecrireReleve().finally(() => { ecritureEnCours = null; });
  return ecritureEnCours;
}

// Écrit tout le relevé en une transaction, puis le vide ; une connexion ouverte juste le temps de l'écriture.
async function ecrireReleve() {
  const perturbations = [...releve.values()];
  const annoncesAEcrire = annonces;
  const termines = episodesTermines;
  const retards = [...termines, ...(episode ? [episode] : [])].map(versLigneRetard);
  const vide = perturbations.length === 0 && annoncesAEcrire.length === 0 && retards.length === 0;
  if (vide || !process.env.DATABASE_URL) return true;

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO trafic.perturbations
         (idfm_id, titre, message, cause, severite, arrets, vue_premiere, vue_derniere, brut)
       SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(
         idfm_id TEXT, titre TEXT, message TEXT, cause TEXT, severite TEXT,
         arrets TEXT[], vue_premiere TIMESTAMPTZ, vue_derniere TIMESTAMPTZ, brut JSONB)
       ON CONFLICT (idfm_id) DO UPDATE SET
         titre = EXCLUDED.titre,
         message = EXCLUDED.message,
         cause = EXCLUDED.cause,
         severite = EXCLUDED.severite,
         arrets = EXCLUDED.arrets,
         vue_premiere = LEAST(trafic.perturbations.vue_premiere, EXCLUDED.vue_premiere),
         vue_derniere = GREATEST(trafic.perturbations.vue_derniere, EXCLUDED.vue_derniere),
         brut = EXCLUDED.brut`,
      [JSON.stringify(perturbations)],
    );
    await client.query(
      `INSERT INTO trafic.annonces (idfm_id, vue_le, fin_annoncee, titre, message)
       SELECT idfm_id, vue_le,
              to_timestamp(fin_locale, 'YYYYMMDD"T"HH24MISS')::timestamp AT TIME ZONE 'Europe/Paris',
              titre, message
       FROM jsonb_to_recordset($1::jsonb) AS x(
         idfm_id TEXT, vue_le TIMESTAMPTZ, fin_locale TEXT, titre TEXT, message TEXT)
       ON CONFLICT (idfm_id, fin_annoncee, md5(message)) DO NOTHING`,
      [JSON.stringify(annoncesAEcrire)],
    );
    await client.query(SQL_RETARDS, [JSON.stringify(retards)]);
    await client.query("COMMIT");

    for (const l of perturbations) {
      if (releve.get(l.idfm_id) === l) releve.delete(l.idfm_id);
    }
    annonces = annonces.filter((a) => !annoncesAEcrire.includes(a));
    episodesTermines = episodesTermines.filter((e) => !termines.includes(e));
    console.log(
      `Relevé trafic : ${perturbations.length} perturbation(s), ${annoncesAEcrire.length} annonce(s), ${retards.length} retard(s) enregistrés.`,
    );
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Relevé trafic non enregistré :", error.message);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

// Écrit une fois par jour, au passage de minuit à Paris, et avant chaque arrêt du serveur.
// Une écriture ratée est retentée chaque minute, le jour n'est marqué écrit qu'après succès.
export function demarrerReleveTrafic() {
  reprendreEpisode().finally(() => { repriseFaite = true; });

  setInterval(async () => {
    const jour = jourParis();
    if (jour === jourEcrit || ecritureEnCours) return;
    if (await enregistrerReleve()) jourEcrit = jour;
  }, 60000);

  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.once(signal, async () => {
      await enregistrerReleve();
      process.exit(0);
    });
  }
}
