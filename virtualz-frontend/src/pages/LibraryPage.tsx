import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getLibrary, updateLibraryStatus, removeFromLibrary } from "../services/libraryApi";
import { useAuth } from "../context/AuthContext";
import LibraryItemCard from "../components/LibraryItemCard";
import type { LibraryItem, LibraryStatus } from "@/types/api";

/**
 * Valori reali validati dal backend (BacklogRequest.java @Pattern) —
 * minuscoli. Le label tradotte (vedi library.status.* nei file i18n)
 * possono restare in italiano/maiuscolo nell'interfaccia, ma il valore
 * effettivo scambiato con l'API deve essere esattamente questo.
 *
 * Tipizzato come readonly LibraryStatus[] (non semplice string[]) così
 * TypeScript verifica che ogni voce combaci col tipo union usato da
 * getLibrary/updateLibraryStatus, invece di una stringa qualsiasi.
 */
const STATUSES: readonly LibraryStatus[] = ["wishlist", "playing", "finished", "abandoned"];

/**
 * Verifica se un valore grezzo (es. dalla query string dell'URL) è uno
 * status di libreria valido.
 *
 * Serve perché LibrarySearch.status (definito in routes/library.tsx) è
 * tipizzato come `string` generico, non come LibraryStatus: chiunque può
 * visitare /library?status=qualcosa nell'URL. Senza questo controllo, un
 * valore non valido verrebbe passato così com'è a getLibrary() — questo
 * guard lo intercetta lato client, riportando la vista a "tutti" invece
 * di propagare un filtro inservibile al backend.
 *
 * @param value - valore grezzo da validare (può essere undefined se il
 *   parametro status non è presente nell'URL).
 * @returns true se value è uno dei quattro status validi (il type guard
 *   permette a TypeScript di restringere il tipo a LibraryStatus dove usato).
 */
function isValidStatus(value: string | undefined): value is LibraryStatus {
  return !!value && (STATUSES as readonly string[]).includes(value);
}

/**
 * LibraryPage — unica pagina "Libreria" (backlog + wishlist insieme),
 * con filtro per stato tramite query string (?status=...), gestito da
 * TanStack Router (vedi routes/library.tsx, validateSearch).
 *
 * Il filtro è mostrato come barra di tab sotto il titolo (stile
 * "Tutti / Lista dei desideri / In corso / Finito / Abbandonato"),
 * non più come <select> a tendina né come pagina separata: la wishlist
 * è semplicemente uno dei quattro stati filtrabili qui.
 *
 * Route protetta: routes/library.tsx reindirizza a /login se manca il
 * token, quindi in condizioni normali `user` da useAuth() non dovrebbe
 * mai essere null qui — la guard sotto resta comunque per onestà verso
 * TypeScript (che non può sapere della protezione a livello di routing)
 * e come rete di sicurezza in caso di stati intermedi del context.
 */
export default function LibraryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const search = useSearch({ from: "/library" });
  const navigate = useNavigate();

  const statusFilter = isValidStatus(search.status) ? search.status : "";
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carica le voci di backlog dell'utente, filtrate per stato se
   * statusFilter è impostato (altrimenti richiede tutte le voci).
   * Ricreata (useCallback) solo quando cambiano user, statusFilter o t,
   * così l'effetto sotto non ricarica ad ogni render.
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

  /**
   * Cambia lo stato di una voce di backlog (es. da "wishlist" a "playing")
   * e ricarica la lista per riflettere il cambiamento.
   *
   * @param entryId - id della VOCE di backlog, non del gioco collegato —
   *   vedi nota in LibraryItemCard.tsx sul perché questa distinzione è
   *   importante (usare game.id qui modificherebbe la voce sbagliata).
   * @param newStatus - nuovo stato da assegnare alla voce.
   */
  async function handleStatusChange(entryId: number, newStatus: LibraryStatus) {
    if (!user) return;
    await updateLibraryStatus(user.id, entryId, newStatus);
    fetchItems();
  }

  /**
   * Rimuove una voce dal backlog dell'utente e ricarica la lista.
   *
   * @param entryId - id della VOCE di backlog da rimuovere (non del gioco).
   */
  async function handleRemove(entryId: number) {
    if (!user) return;
    await removeFromLibrary(user.id, entryId);
    fetchItems();
  }

  /**
   * Aggiorna il filtro stato nella query string dell'URL tramite
   * TanStack Router, invece di tenerlo solo in stato locale: così il
   * filtro attivo resta condiviso/bookmarkabile via URL.
   *
   * @param value - stato selezionato dalla tab, o stringa vuota per
   *   "tutti" (rimuove il parametro dall'URL invece di impostarlo vuoto).
   */
  function handleStatusFilterChange(value: string) {
    if (value) {
      navigate({ to: "/library", search: { status: value } });
    } else {
      navigate({ to: "/library", search: {} });
    }
  }

  // Tab del filtro, nell'ordine richiesto: Tutti, Lista dei desideri,
  // In corso, Finito, Abbandonato.
  const tabs: { value: string; label: string }[] = [
    { value: "", label: t("library.all") },
    { value: "wishlist", label: t("library.wishlistSection") },
    { value: "playing", label: t("library.status.playing") },
    { value: "finished", label: t("library.status.finished") },
    { value: "abandoned", label: t("library.status.abandoned") },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-white mb-6">{t("library.title")}</h1>

      {/* Barra di tab per il filtro di stato, sotto il titolo — sostituisce
          il vecchio <select> a tendina. La ricerca testuale è stata
          rimossa: l'endpoint /backlog/search non esiste nel backend
          ArcheType-LBP. */}
      <div className="border-b border-zinc-800 mb-6">
        <nav className="flex flex-wrap gap-6 text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.value || "all"}
              onClick={() => handleStatusFilterChange(tab.value)}
              className={`pb-3 -mb-px border-b-2 transition-colors ${
                statusFilter === tab.value
                  ? "border-vz-lime text-vz-lime font-semibold"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
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
