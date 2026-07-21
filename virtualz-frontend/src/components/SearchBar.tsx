// src/components/SearchBar.tsx
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholderKey?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholderKey = "catalog.searchPlaceholder",
  className = "mb-6",
}: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        🔍
      </span>
      <input
        type="text"
        placeholder={t(placeholderKey)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-vz-charcoal border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-vz-lime focus:border-transparent transition-shadow"
      />
    </div>
  );
}