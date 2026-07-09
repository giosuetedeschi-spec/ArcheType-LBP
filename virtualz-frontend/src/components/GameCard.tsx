import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { Game } from "@/types/api";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { t } = useTranslation();

  // Fallback for missing or empty game names
  const displayName = game.name && game.name.trim() !== "" ? game.name : "Untitled Game";

  // Fallback for missing images (SVG placeholder)
  const displayImage = game.headerImageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect fill='%23272727' width='400' height='225'/%3E%3Ctext fill='%2371717a' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

  // Traduce un singolo genere (es. "Early Access" -> chiave "genres.earlyAccess").
  // Se la chiave di traduzione non esiste, mostra il nome originale invece
  // della chiave grezza (defaultValue), così non compaiono mai "genres.xxx".
  const localizeGenre = (raw: string): string => {
    const name = raw.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase());
    return t(`genres.${slug}`, { defaultValue: name });
  };

  return (
    <Link
      to="/games/$id"
      params={{ id: String(game.id) }}
      className="group bg-vz-charcoal rounded-xl overflow-hidden border border-zinc-800 hover:border-vz-lime hover:shadow-lg hover:shadow-vz-lime/10 hover:-translate-y-1 transition-all duration-200"
    >
      <div className="aspect-video bg-zinc-900 overflow-hidden relative">
        <img
          src={displayImage}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <span className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full bg-vz-navy/90 backdrop-blur text-vz-lime">
          {game.price > 0 ? `€${Number(game.price).toFixed(2)}` : t("common.free")}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-white truncate group-hover:text-vz-lime transition-colors">
          {displayName}
        </h3>
        {game.genres && game.genres.trim() !== "" && (
          <span className="text-xs text-zinc-500 truncate block mt-1">
            {game.genres.split(",").slice(0, 2).map(localizeGenre).join(" · ")}
          </span>
        )}
      </div>
    </Link>
  );
}