import { render, screen } from '@testing-library/react'
import TrainCard from './TrainCard'
import { SleepModeProvider } from '../../context/SleepModeContext'

function train(heure, destination = 'Paris Est') {
  return { heureFormatee: heure, destination, compteAReboursFormate: `dans ${heure}` }
}

function renderCard(props, estHorsLigne = false) {
  return render(
    <SleepModeProvider value={estHorsLigne}>
      <TrainCard variant="depart" niveauTrafic="fluide" statut="indisponible" {...props} />
    </SleepModeProvider>,
  )
}

describe('TrainCard', () => {
  test('reserves layout space for the "puis" line with visibility:hidden, not display:none, when fewer than 2 more trains exist', () => {
    renderCard({ trains: [train('19:30')] })
    const puis = screen.getByText(/puis/)
    expect(puis).toHaveStyle({ visibility: 'hidden' })
  })

  test('shows the "puis" line normally with 2+ upcoming trains', () => {
    renderCard({ trains: [train('19:30'), train('19:40'), train('19:50')] })
    const puis = screen.getByText(/puis/)
    expect(puis).not.toHaveStyle({ visibility: 'hidden' })
    expect(puis.textContent).toContain('19:40')
    expect(puis.textContent).toContain('19:50')
  })

  test('falls back to the statut-service label when there are no trains at all', () => {
    renderCard({ trains: [], statut: 'attente' })
    expect(screen.getByText('En attente')).toBeInTheDocument()
  })

  test('sleep mode forces "Fin de service" even when real trains exist, and hides the countdown', () => {
    renderCard({ trains: [train('19:30')] }, true)
    expect(screen.getByText('Fin de service')).toBeInTheDocument()
    expect(screen.queryByText(/dans 19:30/)).not.toBeInTheDocument()
  })
})
