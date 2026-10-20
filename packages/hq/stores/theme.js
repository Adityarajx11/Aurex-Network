import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const THEME_PRESETS = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    h: 260,
    s: '85%',
    l: '60%',
    color: '#8b5cf6',
    vibe: 'Deep violet — mysterious & premium',
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    h: 15,
    s: '90%',
    l: '55%',
    color: '#f97316',
    vibe: 'Warm orange-red — energetic',
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    h: 165,
    s: '80%',
    l: '50%',
    color: '#14b8a6',
    vibe: 'Teal-cyan — calm & modern',
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson',
    h: 345,
    s: '85%',
    l: '55%',
    color: '#f43f5e',
    vibe: 'Rose-red — bold & commanding',
  },
  solaris: {
    id: 'solaris',
    name: 'Solaris',
    h: 45,
    s: '95%',
    l: '55%',
    color: '#eab308',
    vibe: 'Gold-amber — regal & warm',
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    h: 280,
    s: '100%',
    l: '65%',
    color: '#c026d3',
    vibe: 'Electric purple — cyberpunk',
  },
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      preset: 'obsidian',
      setPreset: (presetId) => {
        if (!THEME_PRESETS[presetId]) return;
        set({ preset: presetId });
        applyThemeToDocument(THEME_PRESETS[presetId]);
      },
      getCurrentTheme: () => THEME_PRESETS[get().preset] || THEME_PRESETS.obsidian,
    }),
    {
      name: 'dominyx_theme_preset',
    }
  )
);

export function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--accent-h', `${theme.h}`);
  root.style.setProperty('--accent-s', theme.s);
  root.style.setProperty('--accent-l', theme.l);
  root.style.setProperty('--accent', `hsl(${theme.h} ${theme.s} ${theme.l})`);
  root.style.setProperty('--accent-glow', `hsl(${theme.h} ${theme.s} 60% / 0.3)`);
  root.style.setProperty('--accent-dim', `hsl(${theme.h} ${theme.s} 30%)`);
  root.style.setProperty('--accent-bright', `hsl(${theme.h} ${theme.s} 75%)`);
}
