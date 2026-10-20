import { create } from 'zustand';

export const useScrollStore = create((set) => ({
  progress: 0,
  activeSection: 'hero',
  setProgress: (progress) => set({ progress }),
  setActiveSection: (activeSection) => set({ activeSection }),
}));
