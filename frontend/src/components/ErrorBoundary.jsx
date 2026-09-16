import { Component } from 'react'
import PropTypes from 'prop-types'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { aPlante: false }
  }

  static getDerivedStateFromError() {
    return { aPlante: true }
  }

  componentDidCatch(error, info) {
    console.error('Erreur applicative :', error, info)
  }

  render() {
    if (this.state.aPlante) {
      return (
        <main className="etat-erreur">
          <p>Impossible de contacter le serveur pour le moment.</p>
          <p>Nouvelle tentative automatique dans moins d'une minute.</p>
        </main>
      )
    }
    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
}
