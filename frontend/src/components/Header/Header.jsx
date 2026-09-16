import PropTypes from 'prop-types'
import ConnectionBadge from './ConnectionBadge'
import ThemeToggle from './ThemeToggle'
import useConnectionBadge from '../../hooks/useConnectionBadge'

export default function Header({ dateAffichee, modeDemo, demoDisponible, isPaused, horsLigne, onPause, onResume }) {
  const badge = useConnectionBadge({ isPaused, onPause, onResume })

  return (
    <header className="header">
      <a href="/" className="logo-link">
        Check<span>.</span>Da<span>.</span>Train
      </a>
      <ConnectionBadge
        estIpad={badge.estIpad}
        estHorsLigne={isPaused || horsLigne}
        isPaused={isPaused}
        isRevealed={badge.isRevealed}
        onClick={badge.gererTapBadge}
      />
      <p className="header-date" onClick={(event) => { event.stopPropagation(); badge.reveler() }}>
        {dateAffichee}
      </p>
      <div className="header-actions">
        {modeDemo ? (
          <a className="badge-demo" href="/">Quitter la démo</a>
        ) : demoDisponible ? (
          <a className="badge-demo" href="/?demo=1">Démo</a>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  )
}

Header.propTypes = {
  dateAffichee: PropTypes.string,
  modeDemo: PropTypes.bool,
  demoDisponible: PropTypes.bool,
  isPaused: PropTypes.bool.isRequired,
  horsLigne: PropTypes.bool.isRequired,
  onPause: PropTypes.func.isRequired,
  onResume: PropTypes.func.isRequired,
}
