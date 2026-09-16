import { render } from '@testing-library/react'
import TrainIllustration from './TrainIllustration'
import { SleepModeProvider } from '../../context/SleepModeContext'

function renderIllustration(niveauTrafic, phaseServiceActuelle) {
  const { container } = render(
    <SleepModeProvider value={false}>
      <TrainIllustration niveauTrafic={niveauTrafic} phaseServiceActuelle={phaseServiceActuelle} />
    </SleepModeProvider>,
  )
  return container.querySelector('.illustration-train-conteneur')
}

describe('TrainIllustration priority chain', () => {
  test('fin de service beats everything else, including alerte', () => {
    const el = renderIllustration('alerte', 'termine')
    expect(el).toHaveClass('endormi')
    expect(el).not.toHaveClass('en-panne')
  })

  test('alerte shows en-panne when service is active', () => {
    const el = renderIllustration('alerte', 'actif')
    expect(el).toHaveClass('en-panne')
    expect(el).not.toHaveClass('ralenti')
  })

  test('ailleurs is ralenti and secoue', () => {
    const el = renderIllustration('ailleurs', 'actif')
    expect(el).toHaveClass('ralenti')
    expect(el).toHaveClass('secoue')
  })

  test('info is ralenti but not secoue', () => {
    const el = renderIllustration('info', 'actif')
    expect(el).toHaveClass('ralenti')
    expect(el).not.toHaveClass('secoue')
  })

  test('fluide has none of the special classes', () => {
    const el = renderIllustration('fluide', 'actif')
    expect(el.className).toBe('illustration-train-conteneur')
  })
})
