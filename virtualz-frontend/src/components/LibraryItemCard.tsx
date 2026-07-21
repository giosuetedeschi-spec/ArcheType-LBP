import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import type { LibraryItem, LibraryStatus } from "@/types/api";
import GameCoverPlaceholder from "./GameCoverPlaceholder";

// Valori reali dello status, come validati dal backend (vedi
// BacklogRequest.java @Pattern) — minuscoli, non quelli che si potrebbero
// immaginare guardando solo le label visualizzate all'utente.
const STATUS_COLORS: Record<LibraryStatus, string> = {
  wishlist: "bg-vz-pink/20 text-vz-pink",
  playing: "bg-blue-500/20 text-blue-300",
  finished: "bg-vz-lime/20 text-vz-lime",
  abandoned: "bg-slate-700/40 text-slate-400",
};

interface LibraryItemCardProps {
  /**
   * Voce di libreria da mostrare. Usa il tipo LibraryItem reale (da
   * @/types/api, quello effettivamente restituito da getLibrary()), non
   * un'interfaccia locale: item.game è di tipo LibraryGameSummary (solo
   * id/name/headerImageUrl/developer), un sottoinsieme di Game — non il
   * tipo Game completo.
   */
  item: LibraryItem;
  onStatusChange: (itemId: number, newStatus: LibraryStatus) => void;
  onRemove: (itemId: number) => void;
}

/**
 * Mostra una voce della libreria utente (backlog).
 *
 * Card a dimensione fissa (w-[488px] h-[122px]): copertina a tutta altezza
 * sulla sinistra, informazioni e bottoni impilati sulla destra. Il
 * contenitore è `relative` perché il cuore dello stato "wishlist" è
 * posizionato `absolute` rispetto alla card stessa (senza `relative` qui,
 * il cuore finisce ancorato al primo antenato posizionato più esterno e
 * viene tagliato via da `overflow-hidden` — è così che si era rotto).
 * Per lo stato "wishlist" il badge di stato viene nascosto e sostituito
 * dal cuore, invece di mostrare entrambi.
 *
 * NOTA rimossa durante la migrazione TSX: la versione .jsx precedente
 * leggeva un campo `item.inactivityWarning` per mostrare un banner
 * "stai abbandonando questo gioco?". TypeScript conferma (con il tipo
 * LibraryItem reale, non un'interfaccia locale inventata) che questo
 * campo NON esiste nella risposta del backend ArcheType-LBP: la UI del
 * banner era già codice morto prima di questa migrazione, non poteva mai
 * attivarsi. Rimossa qui insieme al codice che la calcolava; se in futuro
 * il backend implementerà questo campo, va reintrodotta ripartendo dal
 * tipo LibraryItem aggiornato (mai da un'interfaccia locale scollegata
 * dalla risposta reale dell'API, come accadeva prima).
 */
export default function LibraryItemCard({ item, onStatusChange, onRemove }: LibraryItemCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isWishlisted = item.status === "wishlist";

  // IMPORTANTE: passiamo sempre item.id (l'id della VOCE di backlog),
  // mai item.game.id — il backend identifica/modifica le voci per il
  // proprio id, non per il gameId collegato. Passare game.id qui
  // modificherebbe/cancellerebbe la voce sbagliata.
  return (
    <div className="relative bg-vz-charcoal rounded-xl border border-slate-800 overflow-hidden flex gap-2 p-2 w-[488px] h-[122px]">
      {/* Copertina — self-stretch la fa crescere in altezza fino a
          combaciare con la colonna di destra. Con la card a dimensione
          fissa la copertina ha sempre la stessa altezza in ogni vista/
          stato, invece di dipendere da quanto contenuto ha la colonna
          di destra. */}
      <div
        onClick={(e) => { e.stopPropagation(); navigate({ to: "/games/$id", params: { id: String(item.game.id) } }); }}
        className="w-28 flex-shrink-0 self-stretch cursor-pointer group"
      >
        {item.game.headerImageUrl ? (
          <img
            src={item.game.headerImageUrl}
            alt={item.game.name}
            className="w-full h-full object-cover rounded-lg bg-slate-900 group-hover:opacity-80 transition-opacity"
            loading="lazy"
          />
        ) : (
          <GameCoverPlaceholder
            name={item.game.name}
            seed={item.game.id}
            className="w-full h-full rounded-lg group-hover:opacity-80 transition-opacity"
          />
        )}
      </div>

      {/* Info + azioni, colonna destra — dimensione fissa (350x104) così
          resta identica in ogni vista/stato, indipendentemente da quanti
          bottoni/badge mostra una determinata voce. */}
      <div className="w-[350px] h-[104px] flex flex-col justify-between">
        <div>
          <h3
            onClick={(e) => { e.stopPropagation(); navigate({ to: "/games/$id", params: { id: String(item.game.id) } }); }}
            className="font-semibold text-white truncate pr-8 cursor-pointer hover:text-vz-lime transition-colors"
          >
            {item.game.name}
          </h3>
          {!isWishlisted && (
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
              {t(`library.status.${item.status}`)}
            </span>
          )}
        </div>

        {/* Azioni di cambio stato — quali bottoni mostrare dipende dallo stato attuale */}
        <div className="flex flex-wrap gap-2 mt-2">
          {isWishlisted && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "playing"); }}
              className="text-xs px-3 py-1 rounded-full bg-vz-lime text-vz-navy font-semibold"
            >
              {t("library.markAsInProgress")}
            </button>
          )}
          {item.status === "playing" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "finished"); }}
                className="text-xs px-3 py-1 rounded-full border border-vz-lime text-vz-lime"
              >
                {t("library.markAsFinished")}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "abandoned"); }}
                className="text-xs px-3 py-1 rounded-full border border-slate-600 text-slate-400"
              >
                {t("library.markAsAbandoned")}
              </button>
            </>
          )}
          {item.status === "abandoned" && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "playing"); }}
              className="text-xs px-3 py-1 rounded-full border border-blue-400 text-blue-300"
            >
              {t("library.markAsInProgress")}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
            className="text-xs px-3 py-1 rounded-full text-slate-500 hover:text-vz-pink"
          >
            {t("library.remove")}
          </button>
        </div>
      </div>

      {/* Cuore in alto a destra al posto del badge "In lista dei desideri" —
          icona SVG (non più il glifo emoji ♥, troppo piccolo e dipendente
          dal font di sistema) per un risultato più simile a un logo. */}
      {isWishlisted && (
        <Heart
          aria-label={t("library.status.wishlist")}
          className="absolute top-2 right-2 w-6 h-6 text-vz-pink"
          fill="currentColor"
          strokeWidth={0}
        />
      )}
    </div>
  );
}
