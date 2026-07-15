import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { Game } from "@/types/api";
import GameCoverPlaceholder from "./GameCoverPlaceholder";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { t } = useTranslation();

  // Fallback for missing or empty game names
  const displayName = game.name && game.name.trim() !== "" ? game.name : "Untitled Game";

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
      className="group bg-vz-charcoal rounded-xl overflow-hidden border border-slate-800/50 border-l-0 hover:shadow-lg hover:shadow-vz-lime/10 hover:-translate-y-1 transition-all duration-200 transform-gpu"
    >
      <div className="aspect-[92/43] bg-slate-900 overflow-hidden relative">
        {game.headerImageUrl ? (
          <img
            src={game.headerImageUrl}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <GameCoverPlaceholder name={displayName} seed={game.id} className="w-full h-full" />
        )}
        {game.mature && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full bg-red-500/90 backdrop-blur text-white">
            18+
          </span>
        )}
        <span className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full bg-vz-navy/90 backdrop-blur text-vz-lime">
          {game.price > 0 ? `€${Number(game.price).toFixed(2)}` : t("common.free")}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-white truncate group-hover:text-vz-lime transition-colors">
          {displayName}
        </h3>
        {game.genres && game.genres.trim() !== "" && (
          <span className="text-xs text-slate-500 truncate block mt-1">
            {game.genres.split(",").slice(0, 2).map(localizeGenre).join(" · ")}
          </span>
        )}
      </div>
    </Link>
  );
}