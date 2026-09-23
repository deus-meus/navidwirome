import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ThemeProvider, createTheme } from '@material-ui/core/styles'
import AlbumGridView from './AlbumGridView'

const theme = createTheme()

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, ...rest }) => (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('react-dnd', () => ({
  useDrag: () => [{}, vi.fn()],
}))

vi.mock('react-measure', () => ({
  withContentRect: () => (Component) => (props) => (
    <Component {...props} contentRect={{ bounds: { width: 200 } }} />
  ),
}))

vi.mock('../common/Artwork', () => ({
  Artwork: ({ title }) => <img alt={title} data-testid="artwork" />,
}))

vi.mock('../common', () => ({
  AlbumContextMenu: () => <div data-testid="context-menu" />,
  PlayButton: () => <button data-testid="play-btn">Play</button>,
  ArtistLinkField: ({ record }) => <span>{record.artist}</span>,
  OverflowTooltip: ({ children }) => <>{children}</>,
}))

vi.mock('./AlbumDatesField.jsx', () => ({
  AlbumDatesField: ({ record }) => <span>{record.year}</span>,
}))

vi.mock('react-admin', () => ({
  linkToRecord: () => '/album/1',
  useListContext: () => ({}),
  Loading: () => <div data-testid="loading" />,
}))

describe('AlbumGridView', () => {
  // ArtistShow renders the grid through ReferenceManyField, which passes no seed tracking.
  it('renders without a shownSeed ref', () => {
    expect(() =>
      render(<AlbumGridView data={{}} ids={[]} basePath="/album" width="md" />),
    ).not.toThrow()
  })

  it('renders polaroid frame with release year badge and format metadata', () => {
    const album = {
      id: 'alb-1',
      name: 'Nevermind: Unmastered',
      artist: 'Nirvana',
      year: 1991,
      songCount: 11,
    }
    render(
      <ThemeProvider theme={theme}>
        <AlbumGridView
          data={{ 'alb-1': album }}
          ids={['alb-1']}
          basePath="/album"
          width="md"
        />
      </ThemeProvider>,
    )
    expect(screen.getByText('1991')).toBeInTheDocument()
    expect(screen.getByText(/11 CUTS/i)).toBeInTheDocument()
    expect(screen.getByText(/TAPE NO/i)).toBeInTheDocument()
  })
})
