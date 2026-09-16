// Ported verbatim from services/icons.js's `PATHS` (server-side SVG string
// builder) — same path data, same names. Do not add/rename/reword entries
// without checking every call site across the app first.
export const PATHS = {
  soleil: '<circle cx="12" cy="12" r="5"/><path d="M12 4.5V2.7M12 19.5V21.3M19.5 12H21.3M4.5 12H2.7M17.3 6.7l1.3-1.3M17.3 17.3l1.3 1.3M6.7 17.3l-1.3 1.3M6.7 6.7l-1.3-1.3"/>',
  lune: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  'nuage-soleil': '<path d="M9.5 5.5a4 4 0 0 1 3.9 5"/><circle cx="9" cy="6" r="3"/><path d="M9 1.5v1.4M4.8 3.3l1 1M13.2 3.3l-1 1"/><path d="M7 20h9.5a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.4 11.2 3.5 3.5 0 0 0 7 20Z"/>',
  'nuage-lune': '<path d="M13 3.5A5.5 5.5 0 0 1 9.7 8" opacity="0"/><path d="M11.8 2.3A4 4 0 1 0 15 8.9a4.7 4.7 0 0 1-3.2-6.6Z"/><path d="M7 20h9.5a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.4 11.2 3.5 3.5 0 0 0 7 20Z"/>',
  nuage: '<path d="M6.5 19a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 19H6.5Z"/>',
  brouillard: '<path d="M6.5 15.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 15.5H6.5Z"/><path d="M4 19h16M6 22h12"/>',
  bruine: '<path d="M6.5 12.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 12.5H6.5Z"/><path d="M8 17v1.5M12 17v1.5M16 17v1.5"/>',
  pluie: '<path d="M6.5 11.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 11.5H6.5Z"/><path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3"/>',
  neige: '<path d="M6.5 11.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 11.5H6.5Z"/><path d="M8 16.5v3M6.5 18h3M12 16.5v3M10.5 18h3M16 16.5v3M14.5 18h3"/>',
  orage: '<path d="M6.5 10.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.75 3.75 0 0 1 17 10.5H6.5Z"/><path d="M13 12.5 10 17h3l-2 4.5 6-7h-3.5l1.5-2Z"/>',
  goutte: '<path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z"/>',
  vent: '<path d="M2.5 8h11a2.5 2.5 0 1 0-2.4-3.2M2.5 12.5h15a2.5 2.5 0 1 1-2.4 3.2M2.5 17h8.5a2 2 0 1 1-1.8 2.8"/>',
  thermometre: '<path d="M12 14.5V4a2 2 0 1 0-4 0v10.5a4 4 0 1 0 4 0Z"/>',
  haltere: '<path d="M6 4v16M18 4v16M4 20h4M16 20h4M1 9h22M3 7v4M21 7v4"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  alerte: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/>',
  calendrier: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"/>',
  travaux: '<path d="M12 3 7.4 19h9.2Z"/><rect x="5" y="19" width="14" height="2.2" rx="1"/><path d="M9.1 9.5h5.8M8.2 14h7.6"/>',
  fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  fermer: '<path d="M6 6l12 12M18 6 6 18"/>',
  parapluie: '<path d="M12 2.5c5 0 9 3.6 9.3 8.2H2.7C3 6.1 7 2.5 12 2.5Z"/><path d="M12 11v8.5a2.2 2.2 0 0 1-4.2.9M12 2.5V1"/>',
  coche: '<path d="M4.5 12.5l5 5L19.5 7"/>',
  flocon: '<path d="M12 3v18M4.8 7.5l14.4 9M19.2 7.5L4.8 16.5"/><path d="M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2M4.8 7.5l.3-2.6M4.8 7.5l2.5.9M19.2 7.5l-.3-2.6M19.2 7.5l-2.5.9M4.8 16.5l.3 2.6M4.8 16.5l2.5-.9M19.2 16.5l-.3 2.6M19.2 16.5l-2.5-.9"/>',
  liste: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  filtre: '<path d="M4 5h16L14 13v6l-4 2v-8L4 5Z"/>',
  bus: '<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 9h16M7 6h10M7 19v2M17 19v2"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>',
  train: '<path d="M.5,6.25H13.92a8.62,8.62,0,0,1,8.62,8.62h0a2.88,2.88,0,0,1-2.87,2.87H.5"/><polyline points="22.54 12.96 13.92 12.96 13.92 6.25"/><polyline points="10.08 9.13 10.08 12.96 6.25 12.96 6.25 9.13"/><polyline points="6.25 9.13 6.25 12.96 2.42 12.96 2.42 9.13"/><line x1="2.42" y1="12.96" x2="0.5" y2="12.96"/><line x1="17.75" y1="17.75" x2="19.67" y2="21.58"/><line x1="13.92" y1="17.75" x2="15.83" y2="21.58"/><line x1="10.08" y1="17.75" x2="12" y2="21.58"/><line x1="6.25" y1="17.75" x2="8.17" y2="21.58"/><line x1="2.42" y1="17.75" x2="4.33" y2="21.58"/><line x1="0.5" y1="21.58" x2="23.5" y2="21.58"/><line x1="8.17" y1="2.42" x2="10.08" y2="6.25"/><line x1="3.38" y1="2.42" x2="11.04" y2="2.42"/>',
  marche: '<circle cx="13.5" cy="4" r="1.6"/><path d="M11.5 8 8 10l1 4.5L6 21M11.5 8l3.5 1.5 3 3.5M11 12.5l3 1.5-1 3.5"/>',
  minuteur: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9.5 2.5h5M12 2.5V4.5"/>',
  // Trois arcs serrés + point plein, plus dense que le reste du set
  // (stroke-width local plus épais) pour lire comme le symbole wifi natif
  // iOS plutôt qu'une icône filaire générique.
  wifi: '<g stroke-width="2.3"><circle cx="12" cy="18.3" r="1.4" fill="currentColor" stroke="none"/><path d="M8.3 14.6a5.4 5.4 0 0 1 7.4 0"/><path d="M5.3 11.1a10 10 0 0 1 13.4 0"/><path d="M2.4 7.7a14.5 14.5 0 0 1 19.2 0"/></g>',
};

export const VIEWBOXES = {
  pluie: '-0.5 -2 25 25',
  neige: '-0.5 -2 25 25',
  orage: '-0.5 -2 25 25',
};

// === Icône soleil — rayons dynamiques par température ===
const SOLEIL_ICONE_TEMP_CHAUD = 30;
const SOLEIL_ICONE_RAYON_CANICULE = 1.8;
const SOLEIL_ICONE_RAYON_NORMAL = SOLEIL_ICONE_RAYON_CANICULE / 2;
const SOLEIL_ICONE_COULEUR_NORMALE = '#f5a524';
const SOLEIL_ICONE_COULEUR_CANICULE = '#f2555a';

export function couleurSoleilIcone(temperature) {
  const t = Number.isFinite(Number(temperature)) ? Number(temperature) : SOLEIL_ICONE_TEMP_CHAUD;
  return t > SOLEIL_ICONE_TEMP_CHAUD ? SOLEIL_ICONE_COULEUR_CANICULE : SOLEIL_ICONE_COULEUR_NORMALE;
}

// Soleil à huit rayons, plus longs en canicule.
export function traceSoleil(temperature) {
  const t = Number.isFinite(Number(temperature)) ? Number(temperature) : SOLEIL_ICONE_TEMP_CHAUD;
  const longueur = t > SOLEIL_ICONE_TEMP_CHAUD ? SOLEIL_ICONE_RAYON_CANICULE : SOLEIL_ICONE_RAYON_NORMAL;

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
