import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ColorblindMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

interface ColorblindContextValue {
  mode: ColorblindMode;
  setMode: (mode: ColorblindMode) => void;
  MODES: ColorblindMode[];
}

const ColorblindContext = createContext<ColorblindContextValue | null>(null);

const MODES: ColorblindMode[] = ["normal", "protanopia", "deuteranopia", "tritanopia"];

export function ColorblindProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorblindMode>(
    () => (localStorage.getItem("virtualz_colorblind") as ColorblindMode) || "normal"
  );

  useEffect(() => {
    localStorage.setItem("virtualz_colorblind", mode);
    document.documentElement.setAttribute("data-colorblind", mode);
  }, [mode]);

  return (
    <ColorblindContext.Provider value={{ mode, setMode, MODES }}>
      {children}
    </ColorblindContext.Provider>
  );
}

export function useColorblind(): ColorblindContextValue {
  const ctx = useContext(ColorblindContext);
  if (!ctx) throw new Error("useColorblind deve essere usato dentro ColorblindProvider");
  return ctx;
}
