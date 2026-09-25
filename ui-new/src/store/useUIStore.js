import { create } from 'zustand'

export const useUIStore = create((set) => ({
  isSidebarCollapsed: true,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  collapseSidebar: () => set({ isSidebarCollapsed: true }),
  expandSidebar: () => set({ isSidebarCollapsed: false }),

  isRightPanelOpen: false,
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  openRightPanel: () => set({ isRightPanelOpen: true }),
  closeRightPanel: () => set({ isRightPanelOpen: false }),
  activeTab: 'overview', // 'overview' | 'queue' | 'history'
  setActiveTab: (tab) => set({ activeTab: tab }),

  activePanelTab: 'monitor', // 'monitor' | 'queue'
  setActivePanelTab: (tab) => set({ activePanelTab: tab }),

  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),

  isUploadOpen: false,
  openUpload: () => set({ isUploadOpen: true }),
  closeUpload: () => set({ isUploadOpen: false }),

  tagEditorTrack: null,
  openTagEditor: (track) => set({ tagEditorTrack: track }),
  closeTagEditor: () => set({ tagEditorTrack: null }),

  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}))
