import { render } from '@testing-library/react'
import Icon from './Icon'

describe('Icon', () => {
  test('renders a known icon', () => {
    const { container } = render(<Icon name="wifi" size={22} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '22')
    expect(svg.querySelector('g')).toBeInTheDocument()
  })

  test('returns null for an unknown icon name', () => {
    const { container } = render(<Icon name="pas-une-icone" />)
    expect(container).toBeEmptyDOMElement()
  })

  test('sun icon below 30°C uses the normal color', () => {
    const { container } = render(<Icon name="soleil" temperature={20} />)
    expect(container.querySelector('svg').style.color).toBe('rgb(245, 165, 36)')
  })

  test('sun icon above 30°C uses the canicule color', () => {
    const { container } = render(<Icon name="soleil" temperature={35} />)
    expect(container.querySelector('svg').style.color).toBe('rgb(242, 85, 90)')
  })
})
