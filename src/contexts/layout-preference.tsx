/* eslint-disable react-refresh/only-export-components -- context + hook exported from same module */
import { createContext, useContext, useEffect, useState } from "react";

type ViewMode = "classic" | "explorer";

interface LayoutPreferenceValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const LayoutPreferenceContext = createContext<LayoutPreferenceValue | undefined>(undefined);

const STORAGE_KEY = "samui-connect:view-mode";

export const LayoutPreferenceProvider = ({ children }: { children: React.ReactNode }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "classic";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "explorer" ? "explorer" : "classic";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  return (
    <LayoutPreferenceContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </LayoutPreferenceContext.Provider>
  );
};

export const useLayoutPreference = () => {
  const context = useContext(LayoutPreferenceContext);
  if (!context) {
    throw new Error("useLayoutPreference must be used within LayoutPreferenceProvider");
  }
  return context;
};
