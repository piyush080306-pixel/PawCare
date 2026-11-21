import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  searchOpen: boolean;
  notificationsOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setMobileNav: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const storedTheme = (() => {
  try {
    return localStorage.getItem('pawcare:theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
})();

export const useUiStore = create<UiState>(set => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  searchOpen: false,
  notificationsOpen: false,
  theme: storedTheme,
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileNav: open => set({ mobileNavOpen: open }),
  setSearchOpen: open => set({ searchOpen: open }),
  setNotificationsOpen: open => set({ notificationsOpen: open }),
  setTheme: theme => {
    try {
      localStorage.setItem('pawcare:theme', theme);
    } catch {
      // storage unavailable — theme still applies for this session
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
  toggleTheme: () =>
    set(state => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('pawcare:theme', next);
      } catch {
        // ignore
      }
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    }),
}));
