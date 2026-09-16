import PropTypes from 'prop-types'

const NUAGE_D =
  'M20 60a20 20 0 0 1 38-9 26 26 0 0 1 50 15 18 18 0 0 1-4 35H36a22 22 0 0 1-16-41Z'

function Nuage({ x, y, echelle, classe = 'nuage-1' }) {
  return (
    <g transform={`translate(${x},${y}) scale(${echelle})`}>
      <path className={`nuage-forme ${classe}`} fill="currentColor" d={NUAGE_D} />
    </g>
  )
}

function Gouttes({ n, hauteur = 40, tag = 'pluie-goutte' }) {
  return Array.from({ length: n }, (_, i) => {
    const x = 10 + i * (390 / n) + (i % 2 === 0 ? 0 : 14)
    return <line key={i} className={tag} x1={x} y1={0} x2={x - 14} y2={hauteur} />
  })
}

function Flocons({ n }) {
  return Array.from({ length: n }, (_, i) => {
    const x = 10 + i * (385 / n)
    const r = 2.5 + (i % 3) * 1.5
    const delai = ((i / n) * 6).toFixed(2)
    const duree = (4.5 + (i % 4) * 0.7).toFixed(2)
    return (
      <circle
        key={i}
        className="neige-flocon"
        cx={x}
        cy={0}
        r={r}
        style={{ animationDelay: `-${delai}s`, animationDuration: `${duree}s` }}
      />
    )
  })
}

export default function WeatherBackground({ scene, temperature = null }) {
  if (scene === 'calme') return null

  const temperatureSoleil = Number.isFinite(Number(temperature)) ? Number(temperature) : 24
  const soleilTresChaud = temperatureSoleil >= 32
  const centreSoleilX = 338
  const centreSoleilY = 154
  const rayonSoleil = Math.round(Math.max(36, Math.min(68, 36 + (temperatureSoleil - 12) * 1.25)))
  const rayonLueurSoleil = Math.round(rayonSoleil * 2.15)

  if (scene === 'soleil') {
    return (
      <svg
        className={`meteo-fond meteo-fond-soleil${soleilTresChaud ? ' meteo-fond-soleil-chaud' : ''}`}
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle className="soleil-lueur" cx={centreSoleilX} cy={centreSoleilY} r={rayonLueurSoleil} fill="currentColor" />
        <circle className="soleil-coeur" cx={centreSoleilX} cy={centreSoleilY} r={rayonSoleil} fill="currentColor" />
      </svg>
    )
  }

  if (scene === 'nuage') {
    return (
      <svg className="meteo-fond meteo-fond-nuage" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Nuage x={-20} y={60} echelle={2.1} classe="nuage-1" />
        <Nuage x={150} y={10} echelle={1.5} classe="nuage-2" />
        <Nuage x={230} y={75} echelle={1.9} classe="nuage-3" />
      </svg>
    )
  }

  if (scene === 'pluie') {
    return (
      <svg className="meteo-fond meteo-fond-pluie" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Nuage x={-20} y={40} echelle={2.1} classe="nuage-1" />
        <Nuage x={200} y={15} echelle={1.7} classe="nuage-2" />
        <g className="pluie-gouttes" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
          <Gouttes n={14} />
        </g>
      </svg>
    )
  }

  if (scene === 'orage') {
    return (
      <svg className="meteo-fond meteo-fond-orage" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Nuage x={-30} y={35} echelle={2.3} classe="nuage-1" />
        <Nuage x={190} y={15} echelle={1.8} classe="nuage-2" />
        <g className="pluie-gouttes orage-gouttes" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
          <Gouttes n={11} hauteur={34} />
        </g>
        <rect className="orage-eclair orage-eclair-1" x="0" y="0" width="400" height="200" fill="currentColor" />
        <rect className="orage-eclair orage-eclair-2" x="0" y="0" width="400" height="200" fill="currentColor" />
        <rect className="orage-eclair orage-eclair-3" x="0" y="0" width="400" height="200" fill="currentColor" />
      </svg>
    )
  }

  if (scene === 'neige') {
    return (
      <svg className="meteo-fond meteo-fond-neige" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g className="neige-flocons" fill="currentColor">
          <Flocons n={24} />
        </g>
      </svg>
    )
  }

  if (scene === 'brouillard') {
    return (
      <svg className="meteo-fond meteo-fond-brouillard" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <filter id="flou-brouillard" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        <g filter="url(#flou-brouillard)">
          <ellipse className="brouillard-nappe n1" cx="40" cy="40" rx="150" ry="30" fill="currentColor" />
          <ellipse className="brouillard-nappe n2" cx="300" cy="80" rx="180" ry="34" fill="currentColor" />
          <ellipse className="brouillard-nappe n3" cx="150" cy="120" rx="160" ry="28" fill="currentColor" />
          <ellipse className="brouillard-nappe n4" cx="340" cy="160" rx="140" ry="26" fill="currentColor" />
        </g>
      </svg>
    )
  }

  // `?? scenes.nuage` en original — un code de scène inconnu retombe sur nuage.
  return (
    <svg className="meteo-fond meteo-fond-nuage" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Nuage x={-20} y={60} echelle={2.1} classe="nuage-1" />
      <Nuage x={150} y={10} echelle={1.5} classe="nuage-2" />
      <Nuage x={230} y={75} echelle={1.9} classe="nuage-3" />
    </svg>
  )
}

WeatherBackground.propTypes = {
  scene: PropTypes.string.isRequired,
  temperature: PropTypes.number,
}
