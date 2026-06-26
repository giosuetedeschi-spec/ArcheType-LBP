import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ColorblindMode = "off" | "protanopia" | "deuteranopia" | "tritanopia";

interface ColorblindContextType {
  mode: ColorblindMode;
  setMode: (m: ColorblindMode) => void;
}

const ColorblindContext = createContext<ColorblindContextType>({
  mode: "off",
  setMode: () => {},
});

export function ColorblindProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorblindMode>(
    () => (localStorage.getItem("colorblind") as ColorblindMode) || "off"
  );

  useEffect(() => {
    if (mode === "off") {
      document.documentElement.removeAttribute("data-colorblind");
    } else {
      document.documentElement.setAttribute("data-colorblind", mode);
    }
    localStorage.setItem("colorblind", mode);
  }, [mode]);

  return (
    <ColorblindContext.Provider value={{ mode, setMode }}>
      {children}
    </ColorblindContext.Provider>
  );
}

export const useColorblind = () => useContext(ColorblindContext);
