"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextType {
  isOpen: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsMobileOpen: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  isMobileOpen: false,
  toggleSidebar: () => {},
  toggleMobileSidebar: () => {},
  setIsMobileOpen: () => {},
});

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => setIsOpen((p) => !p), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileOpen((p) => !p), []);

  return (
    <SidebarContext.Provider
      value={{ isOpen, isMobileOpen, toggleSidebar, toggleMobileSidebar, setIsMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  return useContext(SidebarContext);
}
