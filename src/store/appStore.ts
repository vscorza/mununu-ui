import { create } from 'zustand'

import type { Language } from '../i18n'

interface AppState {
  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Theme
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void

  // Language
  language: Language
  setLanguage: (language: Language) => void

  // Tutorial
  tutorialActive: boolean
  tutorialStep: number
  tutorialCompleted: Set<string>
  setTutorialActive: (active: boolean) => void
  setTutorialStep: (step: number) => void
  completeTutorial: (tutorialId: string) => void
  resetTutorial: () => void
}

export const useAppStore = create<AppState>(set => ({
  // UI State
  sidebarOpen: false,
  setSidebarOpen: open => set({ sidebarOpen: open }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

  // Theme
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
  setTheme: theme => {
    localStorage.setItem('theme', theme)
    set({ theme })
  },
  toggleTheme: () =>
    set(state => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', newTheme)
      return { theme: newTheme }
    }),

  // Language
  language: (localStorage.getItem('language') as Language) || 'en',
  setLanguage: language => {
    localStorage.setItem('language', language)
    set({ language })
  },

  // Tutorial
  tutorialActive: false,
  tutorialStep: 0,
  tutorialCompleted: new Set<string>(),
  setTutorialActive: active => set({ tutorialActive: active }),
  setTutorialStep: step => set({ tutorialStep: step }),
  completeTutorial: tutorialId =>
    set(state => {
      const completed = new Set(state.tutorialCompleted)
      completed.add(tutorialId)
      return { tutorialCompleted: completed }
    }),
  resetTutorial: () =>
    set({
      tutorialActive: false,
      tutorialStep: 0,
      tutorialCompleted: new Set(),
    }),
}))
