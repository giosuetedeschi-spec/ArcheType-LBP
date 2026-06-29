import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export default function GameCard({ game }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/games/${game.id}`}
      className="group bg-vz-charcoal rounded-xl overflow-hidden border border-zinc-800 hover:border-vz-lime hover:shadow-lg hover:shadow-vz-lime/10 hover:-translate-y-1 transition-all duration-200"
    >
      <div className="aspect-video bg-zinc-900 overflow-hidden relative">
        {game.headerImageUrl ? (
          <img
            src={game.headerImageUrl}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm p-2 text-center">
            {game.name}
          </div>
        )}
        <span className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full bg-vz-navy/90 backdrop-blur text-vz-lime">
          {game.price > 0 ? `€${Number(game.price).toFixed(2)}` : t("common.free")}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-white truncate group-hover:text-vz-lime transition-colors">
          {game.name}
        </h3>
        {game.genres && (
          <span className="text-xs text-zinc-500 truncate block mt-1">
            {game.genres.split(",").slice(0, 2).join(" · ")}
          </span>
        )}
      </div>
    </Link>
  );
}
