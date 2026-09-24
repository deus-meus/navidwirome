import { create } from 'zustand'

export const useUIStore = create((set) => ({
  isRightPanelOpen: true,
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  activeTab: 'overview', // 'overview' | 'queue' | 'history'
  setActiveTab: (tab) => set({ activeTab: tab }),

  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),

  isUploadOpen: false,
  openUpload: () => set({ isUploadOpen: true }),
  closeUpload: () => set({ isUploadOpen: false }),

  tagEditorTrack: null,
  openTagEditor: (track) => set({ tagEditorTrack: track }),
  closeTagEditor: () => set({ tagEditorTrack: null }),
}))
