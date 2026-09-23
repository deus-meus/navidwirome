import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { createStore, combineReducers } from 'redux'
import Menu from './Menu'

let store

vi.mock('react-admin', () => ({
  useTranslate: () => (x) => x,
  getResources: () => [
    { name: 'album', hasList: true, options: {} },
    { name: 'artist', hasList: true, options: {} },
    { name: 'song', hasList: true, options: {} },
    { name: 'playlist', hasList: true, options: {} },
  ],
  MenuItemLink: ({ primaryText, to }) => (
    <a href={to} data-testid="menu-item-link">
      {primaryText}
    </a>
  ),
}))

vi.mock('../common/LibrarySelector', () => ({
  default: () => <div data-testid="library-selector" />,
}))

vi.mock('./SubMenu', () => ({
  default: ({ children }) => <div data-testid="sub-menu">{children}</div>,
}))

vi.mock('./PlaylistsSubMenu', () => ({
  default: () => <div data-testid="playlists-submenu" />,
}))

describe('<Menu />', () => {
  beforeEach(() => {
    store = createStore(
      combineReducers({
        admin: (
          state = {
            ui: { sidebarOpen: true },
            resources: { playlist: { data: {} } },
          },
        ) => state,
        player: (state = { queue: [] }) => state,
        settings: (state = { sidebarPlaylistsOnlyFavourites: false }) => state,
      }),
    )
  })

  it('renders Audiozine Cassette Deck header and navigation items', () => {
    render(
      <Provider store={store}>
        <Menu />
      </Provider>,
    )
    expect(screen.getByText(/NAVIDROME \/\/ V.94/i)).toBeInTheDocument()
    expect(screen.getByText(/DISCOVER \/ VAULT/i)).toBeInTheDocument()
    expect(screen.getByText(/MIXTAPES & CASSETTES/i)).toBeInTheDocument()
    expect(screen.getByText(/SERVER STATUS \/\/ SUBSONIC/i)).toBeInTheDocument()
  })
})
