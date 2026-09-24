import { create } from 'zustand'

export const useUIStore = create((set) => ({
  isRightPanelOpen: true,
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  activeTab: 'overview', // 'overview' | 'queue' | 'history'
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
