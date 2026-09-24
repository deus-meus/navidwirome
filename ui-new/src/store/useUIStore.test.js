import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './useUIStore'

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      isRightPanelOpen: true,
      activeTab: 'overview',
      activePanelTab: 'monitor',
      isSearchOpen: false,
      isUploadOpen: false,
      tagEditorTrack: null,
      isSettingsOpen: false,
    })
  })

  it('manages tag editor state correctly', () => {
    const mockTrack = { id: 'track-123', title: 'Song 1' }

    expect(useUIStore.getState().tagEditorTrack).toBeNull()

    useUIStore.getState().openTagEditor(mockTrack)
    expect(useUIStore.getState().tagEditorTrack).toEqual(mockTrack)

    useUIStore.getState().closeTagEditor()
    expect(useUIStore.getState().tagEditorTrack).toBeNull()
  })

  it('toggles right panel and sets panel tabs', () => {
    expect(useUIStore.getState().isRightPanelOpen).toBe(true)
    useUIStore.getState().toggleRightPanel()
    expect(useUIStore.getState().isRightPanelOpen).toBe(false)

    useUIStore.getState().setActivePanelTab('queue')
    expect(useUIStore.getState().activePanelTab).toBe('queue')
  })
})
