import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { getLibrary, updateLibraryStatus, removeFromLibrary } from "../services/libraryApi";
import { useAuth } from "../context/AuthContext";
import LibraryItemCard from "../components/LibraryItemCard";
import SearchBar from "../components/SearchBar";
import type { LibraryItem, LibraryStatus } from "@/types/api";

/**
 * Valori reali validati dal backend (BacklogRequest.java @Pattern) —
 * minuscoli. Le label tradotte (vedi library.status.* nei file i18n)
 * possono restare in italiano/maiuscolo nell'interfaccia, ma il valore
 * effettivo scambiato con l'API deve essere esattamente questo.
 */
const STATUSES: readonly LibraryStatus[] = ["wishlist", "playing", "finished", "abandoned"];

/**
 * Verifica se un valore grezzo è uno status di libreria valido.
 */
function isValidStatus(value: string | undefined): value is LibraryStatus {
  return !!value && (STATUSES as readonly string[]).includes(value);
}

export default function LibraryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const search = useSearch({ from: "/library" });
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const statusFilter = isValidStatus(search.status) ? search.status : "";
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listRef] = useAutoAnimate();

  // Filtraggio client-side sicuro anche per nomi nulli/undefined
  const filteredItems = items.filter((item) =>
    (item.game?.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim())
  );

  /**
   * Carica le voci di backlog dell'utente, filtrate per stato.
   */
  const fetchItems = useCallback(async () => {
    if (!user) return;
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
  }, [user, statusFilter, t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleStatusChange(entryId: number, newStatus: LibraryStatus) {
    if (!user) return;
    await updateLibraryStatus(user.id, entryId, newStatus);
    fetchItems();
  }

  async function handleRemove(entryId: number) {
    if (!user) return;
    await removeFromLibrary(user.id, entryId);
    fetchItems();
  }

  function handleStatusFilterChange(value: string) {
    if (value) {
      navigate({ to: "/library", search: { status: value } });
    } else {
      navigate({ to: "/library", search: {} });
    }
  }

  const tabs: { value: string; label: string }[] = [
    { value: "", label: t("library.all") },
    { value: "wishlist", label: t("library.wishlistSection") },
    { value: "playing", label: t("library.status.playing") },
    { value: "finished", label: t("library.status.finished") },
    { value: "abandoned", label: t("library.status.abandoned") },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Contenitore flex: Titolo a sinistra, Barra di ricerca a destra (35% di larghezza) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-display font-bold text-white">
          {t("library.title")}
        </h1>

        <div className="w-full sm:w-[35%]">
          <SearchBar 
            value={searchTerm} 
            onChange={setSearchTerm} 
            className="mb-0"
          />
        </div>
      </div>

      {/* Barra delle tab per il filtro di stato */}
      <div className="border-b border-slate-800 mb-6">
        <nav className="flex flex-wrap justify-center gap-12 text-base">
          {tabs.map((tab) => (
            <button
              key={tab.value || "all"}
              onClick={() => handleStatusFilterChange(tab.value)}
              className={`pb-4 -mb-px border-b-2 font-medium transition-colors ${
                statusFilter === tab.value
                  ? "border-vz-lime text-vz-lime font-semibold"
                  : "border-transparent text-slate-300 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading && <p className="text-slate-400">{t("common.loading")}</p>}
      {error && <p className="text-vz-pink">{error}</p>}
      
      {!loading && !error && filteredItems.length === 0 && (
        <p className="text-slate-400">
          {searchTerm 
            ? "Nessun gioco trovato con questo nome." 
            : statusFilter === "wishlist" 
              ? t("library.emptyWishlist") 
              : t("library.emptyBacklog")
          }
        </p>
      )}

      {/* Griglia giochi filtrati */}
      <div ref={listRef} className="grid sm:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
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