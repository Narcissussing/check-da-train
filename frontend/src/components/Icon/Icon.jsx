import PropTypes from 'prop-types'
import { PATHS, VIEWBOXES, traceSoleil, couleurSoleilIcone } from './icon-paths'

// dangerouslySetInnerHTML here is fine — path data is fixed,
// developer-authored SVG, never user input.
export default function Icon({ name, size = 20, className = '', temperature }) {
  const soleilAvecTemp = name === 'soleil' && temperature !== undefined
  const contenu = soleilAvecTemp ? traceSoleil(temperature) : PATHS[name]
  if (!contenu) return null

  const viewBox = VIEWBOXES[name] || '0 0 24 24'
  const style = soleilAvecTemp ? { color: couleurSoleilIcone(temperature) } : undefined

  return (
    <svg
      className={`icone ${className}`.trim()}
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      dangerouslySetInnerHTML={{ __html: contenu }}
    />
  )
}

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(PATHS)).isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
  temperature: PropTypes.number,
}
