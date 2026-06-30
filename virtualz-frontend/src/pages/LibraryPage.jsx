import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getLibrary, updateLibraryStatus, removeFromLibrary } from "../services/libraryApi";
import { useAuth } from "../context/AuthContext";
import LibraryItemCard from "../components/LibraryItemCard";

// Valori reali validati dal backend (BacklogRequest.java @Pattern) —
// minuscoli. Le label tradotte (vedi library.status.* nei file i18n)
// possono restare in italiano/maiuscolo nell'interfaccia, ma il valore
// effettivo scambiato con l'API deve essere esattamente questo.
const STATUSES = ["wishlist", "playing", "finished", "abandoned"];

// LibraryPage — backlog personale dell'utente, con filtro per stato
// tramite query string (?status=...), gestito da TanStack Router
// (vedi routes/library.tsx, validateSearch).
export default function LibraryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const search = useSearch({ from: "/library" });
  const navigate = useNavigate();

  const statusFilter = search.status || "";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica le voci di backlog, filtrate per stato se impostato
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLibrary(user.id, statusFilter || undefined);
      setItems(result || []);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [user.id, statusFilter, t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // entryId = id della VOCE di backlog (non del gioco) — vedi nota in
  // LibraryItemCard.jsx su perché questa distinzione è importante.
  async function handleStatusChange(entryId, newStatus) {
    await updateLibraryStatus(user.id, entryId, newStatus);
    fetchItems();
  }

  async function handleRemove(entryId) {
    await removeFromLibrary(user.id, entryId);
    fetchItems();
  }

  // Aggiorna il filtro stato nella query string dell'URL (TanStack Router)
  function handleStatusFilterChange(value) {
    if (value) {
      navigate({ to: "/library", search: { status: value } });
    } else {
      navigate({ to: "/library", search: {} });
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-white mb-6">{t("library.title")}</h1>

      {/* Filtro per stato — la ricerca testuale è stata rimossa: l'endpoint
          /backlog/search non esiste nel backend ArcheType-LBP */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="bg-vz-charcoal border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-vz-lime"
        >
          <option value="">{t("library.all")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`library.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-zinc-400">{t("common.loading")}</p>}
      {error && <p className="text-vz-pink">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-zinc-400">
          {statusFilter === "wishlist" ? t("library.emptyWishlist") : t("library.emptyBacklog")}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <LibraryItemCard
            key={item.id}
            item={item}
            onStatusChange={handleStatusChange}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
