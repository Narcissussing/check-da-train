// Priorité pluie, puis froid, soleil, conditions neutres.
export function iconeVerdict({ parapluie, couche, lunettes } = {}) {
  if (parapluie) return 'parapluie'
  if (couche) return 'flocon'
  if (lunettes) return 'soleil'
  return 'coche'
}

export function iconeMeteo(code, estJour = true) {
  if (code === 0) return estJour ? 'soleil' : 'lune'
  if (code === 1 || code === 2) return estJour ? 'nuage-soleil' : 'nuage-lune'
  if (code === 3) return 'nuage'
  if (code === 45 || code === 48) return 'brouillard'
  if (code === 51 || code === 53 || code === 55) return 'bruine'
  if ([61, 63, 65, 80, 81, 82].includes(code)) return 'pluie'
  if ([71, 73, 75].includes(code)) return 'neige'
  if ([95, 96, 99].includes(code)) return 'orage'
  return 'nuage'
}

export function sceneMeteo(code, estJour = true) {
  if ([95, 96, 99].includes(code)) return 'orage'
  if ([71, 73, 75].includes(code)) return 'neige'
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'pluie'
  if (code === 45 || code === 48) return 'brouillard'
  if (code === 0 || code === 1) return estJour ? 'soleil' : 'calme'
  return 'nuage'
}

// === Couleur par température ===
const ARRETS_TEMPERATURE = [
  { temp: -10, rgb: [59, 130, 246] }, // bleu — froid
  { temp: 12, rgb: [34, 197, 94] }, // vert — doux
  { temp: 25, rgb: [245, 158, 11] }, // orange — chaud
  { temp: 38, rgb: [239, 68, 68] }, // rouge — très chaud
]

function rgbVersHex([r, g, b]) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

export function couleurTemperature(tempC) {
  const arrets = ARRETS_TEMPERATURE
  const dernier = arrets[arrets.length - 1]
  if (tempC <= arrets[0].temp) return rgbVersHex(arrets[0].rgb)
  if (tempC >= dernier.temp) return rgbVersHex(dernier.rgb)

  for (let i = 0; i < arrets.length - 1; i += 1) {
    const debut = arrets[i]
    const fin = arrets[i + 1]
    if (tempC >= debut.temp && tempC <= fin.temp) {
      const ratio = (tempC - debut.temp) / (fin.temp - debut.temp)
      const rgb = debut.rgb.map((canal, idx) => Math.round(canal + (fin.rgb[idx] - canal) * ratio))
      return rgbVersHex(rgb)
    }
  }
  return rgbVersHex(dernier.rgb)
}
