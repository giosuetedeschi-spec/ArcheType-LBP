import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { friendsApi, userApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n/I18nContext";
import { UserPlus, UserMinus, Check, X, Loader2, Users } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Amici — VirtualZ" },
      { name: "description", content: "Gestisci amici e richieste di amicizia." },
    ],
  }),
  component: FriendsPage,
});

const USER_ID = 1;

type FriendEntry = {
  friendId: number;
  username: string;
  avatarUrl?: string;
  status: string;
  createdAt: string;
};

type UserSearchResult = {
  id: number;
  username: string;
  avatarUrl?: string;
};

function FriendsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"friends" | "pending">("friends");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const { data: friends, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends", USER_ID],
    queryFn: () => friendsApi.list(USER_ID),
  });

  const { data: pending, isLoading: loadingPending } = useQuery({
    queryKey: ["friendsPending", USER_ID],
    queryFn: () => friendsApi.pending(USER_ID),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["userSearch", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const users = await userApi.list();
      return users.filter(
        (u: UserSearchResult) =>
          u.id !== USER_ID && u.username.toLowerCase().includes(search.toLowerCase())
      );
    },
    enabled: search.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: (friendId: number) => friendsApi.add(USER_ID, friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendsPending"] });
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
      setShowAdd(false);
      setSearch("");
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ friendId, action }: { friendId: number; action: string }) =>
      friendsApi.update(USER_ID, friendId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendsPending"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (friendId: number) => friendsApi.remove(USER_ID, friendId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });

  const isLoading = loadingFriends || loadingPending;

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-brand" />
            <h1 className="text-2xl font-bold sm:text-3xl">Amici</h1>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-brand inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <UserPlus className="h-4 w-4" />
            Aggiungi
          </button>
        </div>

        {/* Tabs */}
        <div className="card-surface flex gap-1 p-1.5">
          <button
            onClick={() => setTab("friends")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "friends" ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-surface-2"
            }`}
          >
            {`Amici (${friends?.length ?? 0})`}
          </button>
          <button
            onClick={() => setTab("pending")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "pending" ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-surface-2"
            }`}
          >
            {`Richieste (${pending?.length ?? 0})`}
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        )}

        {/* Friends list */}
        {!isLoading && tab === "friends" && (
          <div className="space-y-3">
            {friends?.length ? (
              friends.map((f: FriendEntry) => (
                <FriendCard key={f.friendId} friend={f} onRemove={() => removeMutation.mutate(f.friendId)} />
              ))
            ) : (
              <div className="card-surface p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">Nessun amico. Aggiungi qualcuno!</p>
              </div>
            )}
          </div>
        )}

        {/* Pending list */}
        {!isLoading && tab === "pending" && (
          <div className="space-y-3">
            {pending?.length ? (
              pending.map((f: FriendEntry) => (
                <PendingCard
                  key={f.friendId}
                  friend={f}
                  onAccept={() => actionMutation.mutate({ friendId: f.friendId, action: "accept" })}
                  onReject={() => actionMutation.mutate({ friendId: f.friendId, action: "reject" })}
                />
              ))
            ) : (
              <div className="card-surface p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">Nessuna richiesta in sospeso.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add friend modal */}
      {showAdd && (
        <AddFriendModal
          search={search}
          onSearch={setSearch}
          results={searchResults ?? []}
          adding={addMutation.isPending}
          onAdd={(id) => addMutation.mutate(id)}
          onClose={() => { setShowAdd(false); setSearch(""); }}
        />
      )}
    </AppLayout>
  );
}

function AddFriendModal({
  search,
  onSearch,
  results,
  adding,
  onAdd,
  onClose,
}: {
  search: string;
  onSearch: (v: string) => void;
  results: UserSearchResult[];
  adding: boolean;
  onAdd: (id: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card-surface w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Aggiungi amico</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Cerca per username..."
          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
          autoFocus
        />
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {results.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-md bg-surface-2 p-2">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-brand/20 text-sm font-bold text-brand">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{u.username}</span>
              </div>
              <button
                onClick={() => onAdd(u.id)}
                disabled={adding}
                className="rounded-md border border-brand/40 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/10 disabled:opacity-50"
              >
                {adding ? "..." : "Aggiungi"}
              </button>
            </div>
          ))}
          {search.length >= 2 && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Nessun risultato.</p>
          )}
          {search.length < 2 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Scrivi almeno 2 caratteri.</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium hover:bg-surface-3"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}

function FriendCard({ friend, onRemove }: { friend: FriendEntry; onRemove: () => void }) {
  const statusColor =
    friend.status === "online"
      ? "var(--status-playing)"
      : friend.status === "away"
      ? "var(--color-accent)"
      : friend.status === "busy"
      ? "var(--color-destructive)"
      : "var(--muted-foreground)";

  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-brand)] text-sm font-bold text-brand-foreground overflow-hidden">
        {friend.avatarUrl ? (
          <img src={friend.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          friend.username.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{friend.username}</p>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: statusColor }} />
          <span className="text-xs capitalize text-muted-foreground">{friend.status}</span>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="rounded-md border border-border p-2 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
        title="Rimuovi"
      >
        <UserMinus className="h-4 w-4" />
      </button>
    </div>
  );
}

function PendingCard({
  friend,
  onAccept,
  onReject,
}: {
  friend: FriendEntry;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-medium">
        {friend.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{friend.username}</p>
        <p className="text-xs text-muted-foreground">Vuole essere tuo amico</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="rounded-md border border-brand/40 p-2 text-brand hover:bg-brand/10"
          title="Accetta"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={onReject}
          className="rounded-md border border-destructive/40 p-2 text-destructive hover:bg-destructive/10"
          title="Rifiuta"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
