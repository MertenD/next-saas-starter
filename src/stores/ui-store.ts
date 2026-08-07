import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

/**
 * Global Zustand store for cross-cutting, non-persisted UI state (currently
 * just the dashboard sidebar's collapsed/expanded state, read by
 * `src/components/app-shell.tsx` and `src/components/app-sidebar.tsx`). Add
 * new fields here only for UI state that genuinely needs to be shared across
 * unrelated components; prefer local `useState` otherwise.
 */
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
