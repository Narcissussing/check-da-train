// Icônes filaires minimalistes.

// Deux états visuels : normal jusqu'à 30 °C, canicule au-delà.
const SOLEIL_ICONE_TEMP_CHAUD = 30;
const SOLEIL_ICONE_RAYON_CANICULE = 1.8;
const SOLEIL_ICONE_RAYON_NORMAL = SOLEIL_ICONE_RAYON_CANICULE / 2;
const SOLEIL_ICONE_COULEUR_NORMALE = "#f5a524";
const SOLEIL_ICONE_COULEUR_CANICULE = "#f2555a";

function couleurSoleilIcone(temperature) {
  const t = Number.isFinite(Number(temperature))
    ? Number(temperature)
    : SOLEIL_ICONE_TEMP_CHAUD;
  return t > SOLEIL_ICONE_TEMP_CHAUD
    ? SOLEIL_ICONE_COULEUR_CANICULE
    : SOLEIL_ICONE_COULEUR_NORMALE;
}

// Soleil à huit rayons, plus longs en canicule.
function traceSoleil(temperature) {
  const t = Number.isFinite(Number(temperature))
    ? Number(temperature)
    : SOLEIL_ICONE_TEMP_CHAUD;
  const longueur =
    t > SOLEIL_ICONE_TEMP_CHAUD
      ? SOLEIL_ICONE_RAYON_CANICULE
      : SOLEIL_ICONE_RAYON_NORMAL;

  const rDebut = 7.5;
  const rFin = rDebut + longueur;
  const diag = (r) => Math.round(r * 0.7071 * 10) / 10;
  const sDiag = diag(rDebut);
  const eDiag = diag(rFin);
  const pas = Math.round((eDiag - sDiag) * 10) / 10;

  const cardinaux = `M12 ${(12 - rDebut).toFixed(1)}V${(12 - rFin).toFixed(1)}M12 ${(12 + rDebut).toFixed(1)}V${(12 + rFin).toFixed(1)}M${(12 + rDebut).toFixed(1)} 12H${(12 + rFin).toFixed(1)}M${(12 - rDebut).toFixed(1)} 12H${(12 - rFin).toFixed(1)}`;
  const diagonaux = `M${12 + sDiag} ${12 - sDiag}l${pas} -${pas}M${12 + sDiag} ${12 + sDiag}l${pas} ${pas}M${12 - sDiag} ${12 + sDiag}l-${pas} ${pas}M${12 - sDiag} ${12 - sDiag}l-${pas} -${pas}`;

  return `<circle cx="12" cy="12" r="5"/><path d="${cardinaux}${diagonaux}"/>`;
}

const PATHS = {
  soleil: `<circle cx="12" cy="12" r="5"/><path d="M12 4.5V2.7M12 19.5V21.3M19.5 12H21.3M4.5 12H2.7M17.3 6.7l1.3-1.3M17.3 17.3l1.3 1.3M6.7 17.3l-1.3 1.3M6.7 6.7l-1.3-1.3"/>`,
  lune: `<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>`,
  "nuage-soleil": `<path d="M9.5 5.5a4 4 0 0 1 3.9 5"/><circle cx="9" cy="6" r="3"/><path d="M9 1.5v1.4M4.8 3.3l1 1M13.2 3.3l-1 1"/><path d="M7 20h9.5a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.4 11.2 3.5 3.5 0 0 0 7 20Z"/>`,
  "nuage-lune": `<path d="M13 3.5A5.5 5.5 0 0 1 9.7 8" opacity="0"/><path d="M11.8 2.3A4 4 0 1 0 15 8.9a4.7 4.7 0 0 1-3.2-6.6Z"/><path d="M7 20h9.5a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.4 11.2 3.5 3.5 0 0 0 7 20Z"/>`,
  nuage: `<path d="M6.5 19a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 19H6.5Z"/>`,
  brouillard: `<path d="M6.5 15.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 15.5H6.5Z"/><path d="M4 19h16M6 22h12"/>`,
  bruine: `<path d="M6.5 12.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 12.5H6.5Z"/><path d="M8 17v1.5M12 17v1.5M16 17v1.5"/>`,
  pluie: `<path d="M6.5 11.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 11.5H6.5Z"/><path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3"/>`,
  neige: `<path d="M6.5 11.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 11.5H6.5Z"/><path d="M8 16.5v3M6.5 18h3M12 16.5v3M10.5 18h3M16 16.5v3M14.5 18h3"/>`,
  orage: `<path d="M6.5 10.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 10.5H6.5Z"/><path d="M13 12.5 10 17h3l-2 4.5 6-7h-3.5l1.5-2Z"/>`,
  goutte: `<path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z"/>`,
  vent: `<path d="M2.5 8h11a2.5 2.5 0 1 0-2.4-3.2M2.5 12.5h15a2.5 2.5 0 1 1-2.4 3.2M2.5 17h8.5a2 2 0 1 1-1.8 2.8"/>`,
  thermometre: `<path d="M12 14.5V4a2 2 0 1 0-4 0v10.5a4 4 0 1 0 4 0Z"/>`,
  haltere: `<path d="M4 9v6M2.5 10.5v3M7 7v10M19.5 10.5v3M21 9v6M17 7v10M8.5 12h7"/>`,
  chevron: `<path d="m6 9 6 6 6-6"/>`,
  alerte: `<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/>`,
  calendrier: `<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"/>`,
  travaux: `<path d="M12 3 7.4 19h9.2Z"/><rect x="5" y="19" width="14" height="2.2" rx="1"/><path d="M9.1 9.5h5.8M8.2 14h7.6"/>`,
  fleche: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  fermer: `<path d="M6 6l12 12M18 6 6 18"/>`,
  parapluie: `<path d="M12 2.5c5 0 9 3.6 9.3 8.2H2.7C3 6.1 7 2.5 12 2.5Z"/><path d="M12 11v8.5a2.2 2.2 0 0 1-4.2.9M12 2.5V1"/>`,
  coche: `<path d="M4.5 12.5l5 5L19.5 7"/>`,
  flocon: `<path d="M12 3v18M4.8 7.5l14.4 9M19.2 7.5L4.8 16.5"/><path d="M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2M4.8 7.5l.3-2.6M4.8 7.5l2.5.9M19.2 7.5l-.3-2.6M19.2 7.5l-2.5.9M4.8 16.5l.3 2.6M4.8 16.5l2.5-.9M19.2 16.5l-.3 2.6M19.2 16.5l-2.5-.9"/>`,
  liste: `<path d="M9 6h12M9 12h12M9 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>`,
  filtre: `<path d="M4 5h16L14 13v6l-4 2v-8L4 5Z"/>`,
  bus: `<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 9h16M7 6h10M7 19v2M17 19v2"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>`,
  train: `<rect x="5" y="4" width="14" height="12" rx="4"/><path d="M5 10h14"/><path d="M8 16v1.5M16 16v1.5"/><circle cx="9" cy="19" r="1.4"/><circle cx="15" cy="19" r="1.4"/>`,
  marche: `<circle cx="13.5" cy="4" r="1.6"/><path d="M11.5 8 8 10l1 4.5L6 21M11.5 8l3.5 1.5 3 3.5M11 12.5l3 1.5-1 3.5"/>`,
};

const VIEWBOXES = {
  pluie: "-0.5 -2 25 25",
  neige: "-0.5 -2 25 25",
  orage: "-0.5 -2 25 25",
};

// `temperature` ne modifie que l'icône soleil.
export function icone(nom, { taille = 20, classe = "", temperature } = {}) {
  const soleilAvecTemp = nom === "soleil" && temperature !== undefined;
  const contenu = soleilAvecTemp ? traceSoleil(temperature) : PATHS[nom];
  if (!contenu) return "";
  const viewBox = VIEWBOXES[nom] || "0 0 24 24";
  // La couleur locale prime sur celle du conteneur météo.
  const styleCouleur = soleilAvecTemp
    ? ` style="color: ${couleurSoleilIcone(temperature)}"`
    : "";
  return `<svg class="icone ${classe}" width="${taille}" height="${taille}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${styleCouleur}>${contenu}</svg>`;
}

// Priorité : fin de service, alerte, information, trafic normal.
// Deux niveaux séparent déplacement et secousse sur `transform`.
// Les trains restent en PNG pour préserver les performances de l'iPad.
export function illustrationTrain(niveauTrafic, phaseServiceActuelle = "actif") {
  const endormi = phaseServiceActuelle === "termine";
  const enPanne = !endormi && niveauTrafic === "alerte";
  const ralenti =
    !enPanne &&
    !endormi &&
    (niveauTrafic === "ailleurs" || niveauTrafic === "info");
  const secoue = ralenti && niveauTrafic === "ailleurs";

  const classes = ["illustration-train-conteneur"];
  if (enPanne) classes.push("en-panne");
  if (endormi) classes.push("endormi");
  if (ralenti) classes.push("ralenti");
  if (secoue) classes.push("secoue");

  const src = enPanne
    ? "/images/train-en-panne.png"
    : endormi
      ? "/images/train-dort.png"
      : "/images/train-ligne-p.png";
  const alt = enPanne
    ? "Illustration d'un train Transilien Ligne P endommagé"
    : endormi
      ? "Illustration d'un train Transilien Ligne P à l'arrêt pour la nuit"
      : "Illustration d'un train Transilien Ligne P";

  const zzz = endormi
    ? `<div class="train-zzz" aria-hidden="true"><span>Z</span><span>Z</span><span>Z</span></div>`
    : "";

  return `<div class="${classes.join(" ")}">
    <div class="illustration-train-glisseur">
      <img class="illustration-train-img" src="${src}" alt="${alt}" />
      ${zzz}
    </div>
  </div>`;
}

// Silhouette de bus vue de côté, en aplat (currentColor) plutôt qu'au trait :
// permet la teinte selon le retard (ambre/rouge) sans PNG dédié — cette carte
// n'est affichée que sur iPhone, la contrainte de performance iPad ne s'applique pas.
export function illustrationBusCote() {
  return `<svg class="bus-cote" viewBox="0 0 64 30" aria-hidden="true">
    <rect class="bus-cote-carrosserie" x="2" y="3" width="54" height="19" rx="5" fill="currentColor" />
    <rect class="bus-cote-vitre" x="7" y="7" width="9" height="7" rx="1.5" />
    <rect class="bus-cote-vitre" x="19" y="7" width="9" height="7" rx="1.5" />
    <rect class="bus-cote-vitre" x="31" y="7" width="9" height="7" rx="1.5" />
    <rect class="bus-cote-vitre" x="43" y="7" width="8" height="7" rx="1.5" />
    <circle class="bus-cote-roue" cx="15" cy="24" r="3.4" fill="currentColor" />
    <circle class="bus-cote-roue" cx="45" cy="24" r="3.4" fill="currentColor" />
  </svg>`;
}

// Priorité : pluie, froid, soleil, conditions neutres.
export function iconeVerdict({ parapluie, couche, lunettes } = {}) {
  if (parapluie) return "parapluie";
  if (couche) return "flocon";
  if (lunettes) return "soleil";
  return "coche";
}

// Convertit un code WMO en icône.
export function iconeMeteo(code, estJour = true) {
  if (code === 0) return estJour ? "soleil" : "lune";
  if (code === 1 || code === 2) return estJour ? "nuage-soleil" : "nuage-lune";
  if (code === 3) return "nuage";
  if (code === 45 || code === 48) return "brouillard";
  if (code === 51 || code === 53 || code === 55) return "bruine";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "pluie";
  if ([71, 73, 75].includes(code)) return "neige";
  if ([95, 96, 99].includes(code)) return "orage";
  return "nuage";
}

// Regroupe les codes WMO par scène animée.
export function sceneMeteo(code, estJour = true) {
  if ([95, 96, 99].includes(code)) return "orage";
  if ([71, 73, 75].includes(code)) return "neige";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "pluie";
  if (code === 45 || code === 48) return "brouillard";
  if (code === 0 || code === 1) return estJour ? "soleil" : "calme";
  return "nuage";
}

// Génère le fond météo animé par CSS.
export function animationMeteoFond(scene, temperature = null) {
  if (scene === "calme") return "";

  const temperatureSoleil = Number.isFinite(Number(temperature))
    ? Number(temperature)
    : 24;
  const soleilTresChaud = temperatureSoleil >= 32;
  const centreSoleilX = 338;
  const centreSoleilY = 154;
  const rayonSoleil = Math.round(
    Math.max(36, Math.min(68, 36 + (temperatureSoleil - 12) * 1.25)),
  );
  const rayonLueurSoleil = Math.round(rayonSoleil * 2.15);

  // Le groupe positionne le nuage; le path conserve son animation CSS.
  const NUAGE_D =
    "M20 60a20 20 0 0 1 38-9 26 26 0 0 1 50 15 18 18 0 0 1-4 35H36a22 22 0 0 1-16-41Z";
  const nuage = (x, y, echelle, classe = "nuage-1") =>
    `<g transform="translate(${x},${y}) scale(${echelle})"><path class="nuage-forme ${classe}" fill="currentColor" d="${NUAGE_D}"/></g>`;

  const gouttes = (n, { hauteur = 40, tag = "pluie-goutte" } = {}) =>
    Array.from({ length: n }, (_, i) => {
      const x = 10 + i * (390 / n) + (i % 2 === 0 ? 0 : 14);
      return `<line class="${tag}" x1="${x}" y1="0" x2="${x - 14}" y2="${hauteur}"/>`;
    }).join("");

  // Chaque flocon reçoit son propre rythme.
  const flocons = (n) =>
    Array.from({ length: n }, (_, i) => {
      const x = 10 + i * (385 / n);
      const r = 2.5 + (i % 3) * 1.5;
      const delai = ((i / n) * 6).toFixed(2);
      const duree = (4.5 + (i % 4) * 0.7).toFixed(2);
      return `<circle class="neige-flocon" cx="${x}" cy="0" r="${r}" style="animation-delay:-${delai}s;animation-duration:${duree}s"/>`;
    }).join("");

  const scenes = {
    soleil: `<svg class="meteo-fond meteo-fond-soleil${soleilTresChaud ? " meteo-fond-soleil-chaud" : ""}" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle class="soleil-lueur" cx="${centreSoleilX}" cy="${centreSoleilY}" r="${rayonLueurSoleil}" fill="currentColor"/>
      <circle class="soleil-coeur" cx="${centreSoleilX}" cy="${centreSoleilY}" r="${rayonSoleil}" fill="currentColor"/>
    </svg>`,

    nuage: `<svg class="meteo-fond meteo-fond-nuage" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      ${nuage(-20, 60, 2.1, "nuage-1")}
      ${nuage(150, 10, 1.5, "nuage-2")}
      ${nuage(230, 75, 1.9, "nuage-3")}
    </svg>`,

    pluie: `<svg class="meteo-fond meteo-fond-pluie" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      ${nuage(-20, 40, 2.1, "nuage-1")}
      ${nuage(200, 15, 1.7, "nuage-2")}
      <g class="pluie-gouttes" stroke="currentColor" stroke-width="3.5" stroke-linecap="round">
        ${gouttes(14)}
      </g>
    </svg>`,

    orage: `<svg class="meteo-fond meteo-fond-orage" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      ${nuage(-30, 35, 2.3, "nuage-1")}
      ${nuage(190, 15, 1.8, "nuage-2")}
      <g class="pluie-gouttes orage-gouttes" stroke="currentColor" stroke-width="3.5" stroke-linecap="round">
        ${gouttes(11, { hauteur: 34 })}
      </g>
      <rect class="orage-eclair orage-eclair-1" x="0" y="0" width="400" height="200" fill="currentColor"/>
      <rect class="orage-eclair orage-eclair-2" x="0" y="0" width="400" height="200" fill="currentColor"/>
      <rect class="orage-eclair orage-eclair-3" x="0" y="0" width="400" height="200" fill="currentColor"/>
    </svg>`,

    neige: `<svg class="meteo-fond meteo-fond-neige" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g class="neige-flocons" fill="currentColor">
        ${flocons(24)}
      </g>
    </svg>`,

    brouillard: `<svg class="meteo-fond meteo-fond-brouillard" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id="flou-brouillard" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16"/>
        </filter>
      </defs>
      <g filter="url(#flou-brouillard)">
        <ellipse class="brouillard-nappe n1" cx="40" cy="40" rx="150" ry="30" fill="currentColor"/>
        <ellipse class="brouillard-nappe n2" cx="300" cy="80" rx="180" ry="34" fill="currentColor"/>
        <ellipse class="brouillard-nappe n3" cx="150" cy="120" rx="160" ry="28" fill="currentColor"/>
        <ellipse class="brouillard-nappe n4" cx="340" cy="160" rx="140" ry="26" fill="currentColor"/>
      </g>
    </svg>`,
  };

  return scenes[scene] ?? scenes.nuage;
}

// Couleur calculée côté serveur pour Safari iOS 12.
const ARRETS_TEMPERATURE = [
  { temp: -10, rgb: [59, 130, 246] }, // bleu — froid
  { temp: 12, rgb: [34, 197, 94] }, // vert — doux
  { temp: 25, rgb: [245, 158, 11] }, // orange — chaud
  { temp: 38, rgb: [239, 68, 68] }, // rouge — très chaud
];

function rgbVersHex([r, g, b]) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function couleurTemperature(tempC) {
  const arrets = ARRETS_TEMPERATURE;
  if (tempC <= arrets[0].temp) return rgbVersHex(arrets[0].rgb);
  if (tempC >= arrets.at(-1).temp) return rgbVersHex(arrets.at(-1).rgb);

  for (let i = 0; i < arrets.length - 1; i += 1) {
    const debut = arrets[i];
    const fin = arrets[i + 1];
    if (tempC >= debut.temp && tempC <= fin.temp) {
      const ratio = (tempC - debut.temp) / (fin.temp - debut.temp);
      const rgb = debut.rgb.map((canal, idx) =>
        Math.round(canal + (fin.rgb[idx] - canal) * ratio),
      );
      return rgbVersHex(rgb);
    }
  }

  return rgbVersHex(arrets.at(-1).rgb);
}
