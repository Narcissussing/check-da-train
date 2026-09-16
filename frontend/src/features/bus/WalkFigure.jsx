import PropTypes from 'prop-types'

export default function WalkFigure({ size = 16 }) {
  return (
    <svg
      className="marche-anim"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="13" cy="4.3" r="2.1" fill="currentColor" stroke="none" />
      <path d="M13 6.6V14" strokeWidth="2.4" />
      <g className="marche-anim-bras marche-anim-phase-b" style={{ transformOrigin: '13px 8px' }}>
        <path d="M13 8 16.5 11.2" />
      </g>
      <g className="marche-anim-bras marche-anim-phase-a" style={{ transformOrigin: '13px 8px' }}>
        <path d="M13 8 9.5 11.2" />
      </g>
      <g className="marche-anim-jambe marche-anim-phase-a" style={{ transformOrigin: '13px 14px' }}>
        <path d="M13 14 16.9 20.5" />
      </g>
      <g className="marche-anim-jambe marche-anim-phase-b" style={{ transformOrigin: '13px 14px' }}>
        <path d="M13 14 9.1 20.5" />
      </g>
    </svg>
  )
}

WalkFigure.propTypes = {
  size: PropTypes.number,
}
