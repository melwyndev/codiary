'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'codiary_sidebar_open';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load initial open state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState !== null) {
        setIsSidebarOpen(savedState === 'true');
      }
    } catch (e) {
      console.warn('Failed to read sidebar state from localStorage:', e);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const nextState = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(nextState));
      } catch (e) {
        console.warn('Failed to save sidebar state to localStorage:', e);
      }
      return nextState;
    });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'false');
    } catch (e) {
      console.warn('Failed to save sidebar state to localStorage:', e);
    }
  };

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
