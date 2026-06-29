import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { gameApi, userGameApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n/I18nContext";
import { Star, ArrowLeft, Trash2, Loader2, ShoppingCart, Heart, Clock } from "lucide-react";

export const Route = createFileRoute("/game/$id")({
  component: GamePage,
  notFoundComponent: () => (
    <AppLayout>
      <p className="text-center text-muted-foreground">Game not found.</p>
    </AppLayout>
  ),
});

const USER_ID = 1; // ponytail: single-user mode until auth lands

function GamePage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const gameId = Number(id);

  const { data: game, isLoading, error } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => gameApi.get(gameId),
  });

  const { data: libraryEntries } = useQuery({
    queryKey: ["userGames", USER_ID],
    queryFn: () => userGameApi.list(USER_ID),
  });

  const setStatusMutation = useMutation({
    mutationFn: (status: string | null) =>
      status === null
        ? userGameApi.remove(USER_ID, gameId)
        : userGameApi.setStatus(USER_ID, gameId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userGames"] }),
  });

  const setHoursMutation = useMutation({
    mutationFn: (hours: number) =>
      userGameApi.setHours(USER_ID, gameId, hours),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userGames"] }),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </AppLayout>
    );
  }

  if (error || !game) throw notFound();

  const entry = libraryEntries?.find((e) => e.gameId === gameId);
  const genres = game.genres?.split(",").map((g) => g.trim()).filter(Boolean) ?? [];
  const inWishlist = entry?.status === "wishlist";

  const coverStyle = game.headerImageUrl
    ? { backgroundImage: `url(${game.headerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)" };

  return (
    <AppLayout>
      <Link to="/catalog" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("game.back")}
      </Link>

      <div className="card-surface overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-56 sm:h-72" style={coverStyle}>
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div>
            {/* Genres + Year + Developer */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {genres.map((g) => (
                <span key={g} className="rounded bg-surface-2 px-2 py-0.5">{g}</span>
              ))}
              {game.releaseDate && <span>· {game.releaseDate} · {game.developer}</span>}
            </div>

            {/* Title */}
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{game.name}</h1>

            {/* Description */}
            {game.description && (
              <p className="mt-4 max-w-2xl text-muted-foreground">{game.description}</p>
            )}

            {/* Stats Row */}
            <div className="mt-6 flex flex-wrap items-center gap-6">
              {/* Rating */}
              {game.rating != null && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-display text-2xl font-bold">{game.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">/ 5.0</span>
                </div>
              )}

              {/* Price */}
              <div className="text-xl font-bold text-brand">
                {game.price == null || game.price === 0
                  ? t("common.free")
                  : t("common.price", { price: game.price.toFixed(2) })}
              </div>

              {/* Buy on Steam */}
              <a
                href={`https://store.steampowered.com/app/${game.steamAppId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#1b2838] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a475e]"
              >
                <ShoppingCart className="h-4 w-4" />
                {t("catalog.buyOnSteam")}
              </a>
            </div>
          </div>

          {/* Sidebar: Library Actions */}
          <aside className="card-surface h-fit p-5">
            <h3 className="mb-3 font-display text-lg font-semibold">{t("game.myLibrary")}</h3>

            {/* Status Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {(["wishlist", "playing", "finished", "abandoned"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusMutation.mutate(s)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    entry?.status === s
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-surface-2 hover:border-brand/60"
                  }`}
                >
                  {t(`game.status.${s}`)}
                </button>
              ))}
            </div>

            {/* Wishlist Toggle */}
            <button
              onClick={() => setStatusMutation.mutate(inWishlist ? null : "wishlist")}
              className={`mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                inWishlist
                  ? "border-wishlist bg-wishlist/10 text-wishlist"
                  : "border-border bg-surface-2 hover:border-wishlist/60"
              }`}
            >
              <Heart className={`h-3 w-3 ${inWishlist ? "fill-wishlist" : ""}`} />
              {inWishlist ? t("game.removeFromWishlist") : t("game.addToWishlist")}
            </button>

            {/* Played Hours */}
            {entry && (
              <>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("game.playedHours")}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={0}
                    value={entry.hoursPlayed}
                    onChange={(e) => setHoursMutation.mutate(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Remove */}
            {entry && (
              <button
                onClick={() => setStatusMutation.mutate(null)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" /> {t("game.remove")}
              </button>
            )}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
