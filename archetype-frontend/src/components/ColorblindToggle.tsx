import { useColorblind } from "@/contexts/ColorblindContext";
import { Eye } from "lucide-react";

const MODES = [
  { value: "off", label: "Normal" },
  { value: "protanopia", label: "Protanopia" },
  { value: "deuteranopia", label: "Deuteranopia" },
  { value: "tritanopia", label: "Tritanopia" },
] as const;

export function ColorblindToggle() {
  const { mode, setMode } = useColorblind();

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4 text-muted-foreground" />
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as typeof mode)}
        className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs focus:border-brand focus:outline-none"
        aria-label="Colorblind mode"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
