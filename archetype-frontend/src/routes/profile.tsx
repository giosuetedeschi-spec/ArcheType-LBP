import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { userApi, statsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n/I18nContext";
import { User, Mail, Calendar, Trophy, Clock, Heart, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profilo — ArcheType" },
      { name: "description", content: "Il tuo profilo gamer, statistiche e preferenze." },
    ],
  }),
  component: ProfilePage,
});

const USER_ID = 1;

const STATUS_OPTIONS = ["online", "offline", "busy", "away"] as const;
const STATUS_COLORS: Record<string, string> = {
  online: "var(--status-playing)",
  offline: "var(--muted-foreground)",
  busy: "var(--color-destructive)",
  away: "var(--color-accent)",
};

function ProfilePage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", USER_ID],
    queryFn: () => userApi.get(USER_ID),
  });

  const { data: stats } = useQuery({
    queryKey: ["stats", USER_ID],
    queryFn: () => statsApi.get(USER_ID),
  });

  const updateMutation = useMutation({
    mutationFn: (body: { avatarUrl?: string; status?: string; bio?: string }) =>
      userApi.update(USER_ID, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setEditing(false);
    },
  });

  if (userLoading || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </AppLayout>
    );
  }

  const gameGenres = Object.entries(stats?.gamesByGenre ?? {}).sort((a, b) => b[1] - a[1]);
  const maxGenre = Math.max(...gameGenres.map(([, c]) => c), 1);

  const STATUS_PALETTE = [
    "var(--status-playing)",
    "var(--status-finished)",
    "var(--status-wishlist)",
    "var(--color-brand)",
    "var(--color-accent)",
    "oklch(0.75 0.16 200)",
    "oklch(0.80 0.15 120)",
    "oklch(0.70 0.18 300)",
    "oklch(0.78 0.17 50)",
    "oklch(0.68 0.18 25)",
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header card */}
        <div className="card-surface p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-brand)] text-3xl font-bold text-brand-foreground overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: STATUS_COLORS[user.status ?? "offline"] }}
                />
                <span className="text-sm capitalize text-muted-foreground">
                  {t(`profile.status.${user.status ?? "offline"}`)}
                </span>
              </div>
              {user.createdAt && (
                <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Edit button */}
            <button
              onClick={() => setEditing(true)}
              className="btn-brand px-4 py-2 text-sm"
            >
              {t("profile.edit") || "Edit Profile"}
            </button>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mt-5 rounded-lg bg-surface-2 p-4">
              <p className="text-sm text-muted-foreground">{user.bio}</p>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Trophy className="h-4 w-4" />} label="Total" value={stats?.totalGames ?? 0} tone="brand" />
          <StatCard icon={<Clock className="h-4 w-4" />} label="Playing" value={stats?.playingCount ?? 0} tone="playing" />
          <StatCard icon={<Heart className="h-4 w-4" />} label="Wishlist" value={stats?.wishlistCount ?? 0} tone="wishlist" />
          <StatCard icon={<User className="h-4 w-4" />} label="Finished" value={stats?.finishedCount ?? 0} tone="finished" />
        </div>

        {/* Genre distribution */}
        <div className="card-surface p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Games by Genre</h2>
          {gameGenres.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ol className="space-y-2">
              {gameGenres.slice(0, 8).map(([genre, count], i) => (
                <li key={genre} className="flex items-center gap-3">
                  <span className="w-5 text-right text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{genre}</span>
                      <span className="font-bold text-foreground">{count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / maxGenre) * 100}%`,
                          background: STATUS_PALETTE[i % STATUS_PALETTE.length],
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Quick links */}
        <div className="flex gap-3">
          <Link to="/library" className="btn-brand flex-1 px-4 py-2.5 text-sm text-center">
            My Library
          </Link>
          <Link to="/wishlist" className="flex-1 rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm text-center font-medium hover:bg-surface-3">
            Wishlist
          </Link>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <ProfileEditModal
          user={user}
          saving={updateMutation.isPending}
          onSave={(body) => updateMutation.mutate(body)}
          onClose={() => setEditing(false)}
        />
      )}
    </AppLayout>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  const colorMap: Record<string, string> = {
    brand: "var(--brand)",
    playing: "var(--status-playing)",
    wishlist: "var(--status-wishlist)",
    finished: "var(--status-finished)",
  };
  return (
    <div className="card-surface p-4 text-center">
      <div className="flex items-center justify-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold" style={{ color: colorMap[tone] }}>{value}</div>
    </div>
  );
}

function ProfileEditModal({
  user,
  saving,
  onSave,
  onClose,
}: {
  user: { username: string; email: string; avatarUrl?: string; status?: string; bio?: string };
  saving: boolean;
  onSave: (body: { avatarUrl?: string; status?: string; bio?: string }) => void;
  onClose: () => void;
}) {
  const [bio, setBio] = useState(user.bio ?? "");
  const [status, setStatus] = useState(user.status ?? "online");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card-surface w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Edit Profile</h2>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avatar URL</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm resize-none"
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/500</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium hover:bg-surface-3"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ bio, status, avatarUrl })}
            disabled={saving}
            className="btn-brand flex-1 px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
