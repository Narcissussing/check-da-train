import PropTypes from 'prop-types'

export default function Popup({ id, open, onClose, onInsideClick, autoClose = true, boiteClassName = '', children }) {
  if (!open) return null

  function handleClick(event) {
    if (event.target === event.currentTarget) {
      onClose()
    } else {
      onInsideClick?.()
    }
  }

  return (
    <div
      className="disclosure popup-fond ouvert"
      id={id}
      onClick={handleClick}
      data-auto-close={autoClose ? undefined : 'false'}
    >
      <div className={`popup-boite ${boiteClassName}`.trim()}>{children}</div>
    </div>
  )
}

Popup.propTypes = {
  id: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onInsideClick: PropTypes.func,
  autoClose: PropTypes.bool,
  boiteClassName: PropTypes.string,
  children: PropTypes.node,
}
