// Icônes ligne, dessinées à la main dans le style minimal demandé par docs/ui-design.md
// (poids de trait constant, pas de remplissage, coins arrondis).

const PATHS = {
  soleil: `<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>`,
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
};

// Retourne le SVG (chaîne) pour une icône donnée. `taille` en px, `classe` optionnelle.
export function icone(nom, { taille = 20, classe = "" } = {}) {
  const contenu = PATHS[nom];
  if (!contenu) return "";
  return `<svg class="icone ${classe}" width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${contenu}</svg>`;
}

// Illustration pour la carte trafic — deux images vectorisées
// (public/images/train-profil.svg, train-en-panne.svg, tracées depuis les
// illustrations fournies par l'utilisateur) et une image raster
// (train-dort.png, non vectorisée). États selon `niveauTrafic` et
// `phaseServiceActuelle` (voir phaseService() dans index.js), par
// priorité :
//   - "alerte" (perturbation sur MON trajet, Trilport↔Meaux/Paris) :
//     illustration endommagée, figée au centre, qui tressaute fort
//     périodiquement. Prioritaire sur tout le reste — un vrai incident
//     reste affiché même en pleine nuit.
//   - phase "termine" (plus de service avant demain matin) : illustration
//     dédiée (train-dort.png, un seul wagon avec la cabine bien visible —
//     plus simple à garer proprement que la vue multi-wagons de
//     train-profil.svg), immobile à droite, qui "dort" (petit Zzz qui
//     s'échappe du haut de la cabine).
//   - "ailleurs" (perturbation ailleurs sur la ligne P, hors trajet) :
//     traversée ralentie (comme "info" ci-dessous) et un léger
//     tressautement continu en plus — un signal plus discret qu'un vrai
//     incident sur mon trajet, mais qui doit quand même se voir.
//   - "info" (message d'information général) : traversée ralentie, mais
//     sans tressautement — le contraste de vitesse à lui seul doit
//     suffire à distinguer "il se passe quelque chose" d'un trafic
//     vraiment fluide, sans avoir l'air d'un vrai incident.
//   - tout le reste (fluide/indisponible, service actif) : traversée à
//     vitesse normale, sans secousse.
// Structure à deux niveaux (.illustration-train-glisseur pour la
// position/traversée, .illustration-train-img pour la secousse) plutôt
// qu'un seul élément : une `animation` CSS remplace entièrement la
// précédente sur la même propriété (`transform`), donc glissement et
// secousse ne peuvent pas cohabiter sur le même élément — même logique
// que les nuages météo (voir plus haut), appliquée ici à deux <div>
// imbriqués plutôt qu'à un <g> SVG.
// (train-ligne-p.svg — vue 3/4 avant — n'est plus utilisée mais conservée :
// c'est la seule copie restante de cette illustration, le PNG source ayant
// été supprimé par erreur.)
export function illustrationTrain(niveauTrafic, phaseServiceActuelle = "actif") {
  const enPanne = niveauTrafic === "alerte";
  const endormi = !enPanne && phaseServiceActuelle === "termine";
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
    ? "/images/train-en-panne.svg"
    : endormi
      ? "/images/train-dort.png"
      : "/images/train-profil.svg";
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

// Choisit l'icône d'un verdict de créneau gym — même ordre de priorité que
// le texte `resume` dans evaluerCreneau() (services/utils.js), pour rester
// cohérent : pluie d'abord (même si aussi froid), puis froid, puis beau
// temps, sinon tranquille.
export function iconeVerdict({ parapluie, couche, lunettes } = {}) {
  if (parapluie) return "parapluie";
  if (couche) return "flocon";
  if (lunettes) return "soleil";
  return "coche";
}

// Choisit une icône météo à partir d'un code WMO et du statut jour/nuit.
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

// Regroupe les codes météo en 6 "scènes" pour l'animation de fond de la
// carte météo — moins fines que iconeMeteo (une pluie fine ou forte, ça
// reste la scène "pluie"), plus une scène "calme" pour un ciel clair de
// nuit (pas de rayons de soleil qui n'auraient pas de sens la nuit).
export function sceneMeteo(code, estJour = true) {
  if ([95, 96, 99].includes(code)) return "orage";
  if ([71, 73, 75].includes(code)) return "neige";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "pluie";
  if (code === 45 || code === 48) return "brouillard";
  if (code === 0 || code === 1) return estJour ? "soleil" : "calme";
  return "nuage";
}

// Animation de fond, discrète, derrière le contenu de la carte météo — pur
// CSS (les @keyframes vivent dans main.css), donc aucun souci de
// compatibilité iOS 12 au-delà de ce que CSS gère déjà nativement.
export function animationMeteoFond(scene) {
  if (scene === "calme") return "";

  // Un seul contour de nuage de base, réutilisé à différentes tailles/
  // positions via transform (translate+scale) sur un <g> englobant plutôt
  // qu'en recalculant les courbes à la main à chaque fois — et surtout
  // séparé du <path> animé : CSS anime le `transform` du <path> (dérive),
  // et un `transform` CSS écrase entièrement l'attribut `transform` SVG du
  // même élément. En le mettant sur le <g> parent, position/échelle
  // statiques et dérive animée du <path> se combinent sans se marcher
  // dessus.
  const NUAGE_D =
    "M20 60a20 20 0 0 1 38-9 26 26 0 0 1 50 15 18 18 0 0 1-4 35H36a22 22 0 0 1-16-41Z";
  const nuage = (x, y, echelle, classe = "nuage-1") =>
    `<g transform="translate(${x},${y}) scale(${echelle})"><path class="nuage-forme ${classe}" fill="currentColor" d="${NUAGE_D}"/></g>`;

  const gouttes = (n, { hauteur = 40, tag = "pluie-goutte" } = {}) =>
    Array.from({ length: n }, (_, i) => {
      const x = 10 + i * (390 / n) + (i % 2 === 0 ? 0 : 14);
      return `<line class="${tag}" x1="${x}" y1="0" x2="${x - 14}" y2="${hauteur}"/>`;
    }).join("");

  // Décalage/durée par flocon en style inline plutôt qu'une liste
  // :nth-child en CSS — ça reste correct quel que soit le nombre de
  // flocons demandé, sans avoir une seconde liste à tenir à jour ailleurs.
  const flocons = (n) =>
    Array.from({ length: n }, (_, i) => {
      const x = 10 + i * (385 / n);
      const r = 2.5 + (i % 3) * 1.5;
      const delai = ((i / n) * 6).toFixed(2);
      const duree = (4.5 + (i % 4) * 0.7).toFixed(2);
      return `<circle class="neige-flocon" cx="${x}" cy="0" r="${r}" style="animation-delay:-${delai}s;animation-duration:${duree}s"/>`;
    }).join("");

  const scenes = {
    soleil: `<svg class="meteo-fond meteo-fond-soleil" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle class="soleil-lueur" cx="200" cy="100" r="160" fill="currentColor"/>
      <g class="soleil-rayons" stroke="currentColor" stroke-width="4" stroke-linecap="round">
        <line x1="200" y1="100" x2="200" y2="-90"/>
        <line x1="200" y1="100" x2="340" y2="-40"/>
        <line x1="200" y1="100" x2="400" y2="100"/>
        <line x1="200" y1="100" x2="340" y2="240"/>
        <line x1="200" y1="100" x2="200" y2="290"/>
        <line x1="200" y1="100" x2="60" y2="240"/>
        <line x1="200" y1="100" x2="0" y2="100"/>
        <line x1="200" y1="100" x2="60" y2="-40"/>
      </g>
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

// Dégradé bleu → vert → orange → rouge selon la température, dans l'esprit
// des échelles "ressenti intuitif" (ex. https://xkcd.com/1683-like charts).
// Calculée côté serveur en couleur hexadécimale figée : l'iPad cible tourne
// en iOS 12, donc pas de color-mix() ni de dégradé calculé côté client.
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
