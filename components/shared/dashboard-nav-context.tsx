'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_COLLAPSED = 'sgh-dashboard-sidebar-collapsed';

type DashboardNavContextValue = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  desktopCollapsed: boolean;
  toggleDesktopCollapsed: () => void;
};

const DashboardNavContext = createContext<DashboardNavContextValue | null>(null);

export function DashboardNavProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_COLLAPSED) === '1') {
        setDesktopCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDesktopCollapsed = useCallback(() => {
    setDesktopCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_COLLAPSED, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      mobileOpen,
      setMobileOpen,
      desktopCollapsed,
      toggleDesktopCollapsed,
    }),
    [mobileOpen, desktopCollapsed, toggleDesktopCollapsed]
  );

  return (
    <DashboardNavContext.Provider value={value}>{children}</DashboardNavContext.Provider>
  );
}

export function useDashboardNav() {
  const ctx = useContext(DashboardNavContext);
  if (!ctx) {
    throw new Error('useDashboardNav must be used within DashboardNavProvider');
  }
  return ctx;
}
