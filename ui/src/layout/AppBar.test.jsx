import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { createStore, combineReducers } from 'redux'
import { activityReducer } from '../reducers'
import AppBar from './AppBar'
import config from '../config'

let store
const mockPermissions = vi.hoisted(() => ({ value: 'admin' }))

vi.mock('react-admin', () => ({
  AppBar: ({ userMenu }) => <div data-testid="appbar">{userMenu}</div>,
  useTranslate: () => (x) => x,
  usePermissions: () => ({ permissions: mockPermissions.value }),
  getResources: () => [],
}))

vi.mock('./NowPlayingPanel', () => ({
  default: () => <div data-testid="now-playing-panel" />,
}))
vi.mock('./ActivityPanel', () => ({
  default: () => <div data-testid="activity-panel" />,
}))
vi.mock('./PersonalMenu', () => ({
  default: () => <div />,
}))
vi.mock('./UserMenu', () => ({
  default: ({ children }) => <div>{children}</div>,
}))
vi.mock('../dialogs/Dialogs', () => ({
  Dialogs: () => <div />,
}))
vi.mock('../dialogs', () => ({
  AboutDialog: () => <div />,
  QuickConnectDialog: () => <div />,
}))
vi.mock('../upload/UploaderDialog', () => ({
  default: () => <div />,
  UploaderDialog: () => <div />,
}))

describe('<AppBar />', () => {
  beforeEach(() => {
    config.devActivityPanel = true
    config.enableNowPlaying = true
    config.enableQuickConnect = false
    store = createStore(combineReducers({ activity: activityReducer }), {
      activity: { nowPlayingCount: 0 },
    })
  })

  it('renders NowPlayingPanel when enabled', () => {
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.getByTestId('now-playing-panel')).toBeInTheDocument()
  })

  it('hides NowPlayingPanel when disabled', () => {
    config.enableNowPlaying = false
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.queryByTestId('now-playing-panel')).toBeNull()
  })

  it('shows the Quick Connect menu item when enabled', () => {
    config.enableQuickConnect = true
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.queryAllByText('menu.quickConnect.name')).not.toHaveLength(0)
  })

  it('hides the Quick Connect menu item when disabled', () => {
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.queryAllByText('menu.quickConnect.name')).toHaveLength(0)
    expect(screen.queryAllByText('menu.about')).not.toHaveLength(0)
  })

  it('shows the Upload menu item when user has upload permission', () => {
    mockPermissions.value = 'admin'
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.queryAllByText('menu.upload')).not.toHaveLength(0)
  })

  it('hides the Upload menu item when user lacks upload permission', () => {
    mockPermissions.value = 'user'
    localStorage.removeItem('canUpload')
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.queryAllByText('menu.upload')).toHaveLength(0)
  })
})
