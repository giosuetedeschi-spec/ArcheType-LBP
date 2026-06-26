import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { gameApi, userGameApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n/I18nContext";
import { Heart, ShoppingCart, Loader2 } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — ArcheType" },
      { name: "description", content: "Your wishlist of games to buy." },
    ],
  }),
  component: WishlistPage,
});

// ponytail: single-user until auth lands
const USER_ID = 1;

function WishlistPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: games } = useQuery({
    queryKey: ["games"],
    queryFn: () => gameApi.list(),
  });

  const { data: libraryEntries } = useQuery({
    queryKey: ["userGames", USER_ID],
    queryFn: () => userGameApi.list(USER_ID),
  });

  const removeMutation = useMutation({
    mutationFn: (gameId: number) => userGameApi.remove(USER_ID, gameId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userGames"] }),
  });

  const wishlistGameIds = useMemo(
    () => (libraryEntries ?? []).filter((e) => e.status === "wishlist").map((e) => e.gameId),
    [libraryEntries],
  );

  const wishlistGames = useMemo(
    () => (games ?? []).filter((g: any) => wishlistGameIds.includes(g.id)),
    [games, wishlistGameIds],
  );

  const isLoading = !games || !libraryEntries;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("wishlist.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground italic">{t("wishlist.yesMaster")}</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      )}

      {!isLoading && wishlistGames.length === 0 && (
        <div className="card-surface grid place-items-center gap-3 p-12 text-center">
          <Heart className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("library.empty")}</p>
          <Link to="/catalog" className="btn-brand px-4 py-2 text-sm">
            {t("library.exploreCatalog")}
          </Link>
        </div>
      )}

      {!isLoading && wishlistGames.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistGames.map((game: any) => (
            <WishlistCard
              key={game.id}
              game={game}
              onRemove={() => removeMutation.mutate(game.id)}
              onBuy={() => window.open(`https://store.steampowered.com/app/${game.steamAppId}/`, "_blank")}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function WishlistCard({
  game,
  onRemove,
  onBuy,
}: {
  game: { id: number; steamAppId: number; name: string; headerImageUrl?: string; developer?: string; genres?: string; rating?: number; price?: number };
  onRemove: () => void;
  onBuy: () => void;
}) {
  const { t } = useI18n();
  const coverStyle = game.headerImageUrl
    ? { backgroundImage: `url(${game.headerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)" };

  return (
    <div className="card-surface overflow-hidden flex flex-col">
      <div className="relative h-28" style={coverStyle}>
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
        <h3 className="absolute bottom-2 left-3 right-3 font-display text-sm font-bold text-white drop-shadow truncate">
          {game.name}
        </h3>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="text-xs text-muted-foreground">
          {game.developer}
        </div>

        {game.genres && (
          <div className="mt-1 flex flex-wrap gap-1">
            {game.genres.split(",").slice(0, 2).map((g) => (
              <span key={g} className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {g.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-brand">
            {game.price == null || game.price === 0
              ? t("common.free")
              : t("common.price", { price: game.price.toFixed(2) })}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onRemove}
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
              title="Remove from wishlist"
            >
              <Heart className="h-3.5 w-3.5" />
            </button>
            <a
              href={`https://store.steampowered.com/app/${game.steamAppId}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-[#1b2838] p-1.5 text-white hover:bg-[#2a475e]"
              title={t("wishlist.steamLink")}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
