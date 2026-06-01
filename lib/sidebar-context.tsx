"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface SidebarCtx {
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const Ctx = createContext<SidebarCtx>({
  mobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
  toggleMobile: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);

  return (
    <Ctx.Provider value={{ mobileOpen, openMobile, closeMobile, toggleMobile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMobileSidebar() {
  return useContext(Ctx);
}
