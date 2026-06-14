import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { ALL_GENRES, ALL_TAGS, ALL_PLATFORMS } from "@/lib/games-data";

export interface CatalogFilters {
  search: string;
  genres: string[];
  tags: string[];
  platforms: string[];
  priceMax: number;
  minRating: number;
  freeOnly: boolean;
  sort: "popular" | "rating" | "price-asc" | "price-desc" | "year-desc";
}

export const DEFAULT_FILTERS: CatalogFilters = {
  search: "",
  genres: [],
  tags: [],
  platforms: [],
  priceMax: 70,
  minRating: 0,
  freeOnly: false,
  sort: "popular",
};

export function CatalogFiltersBar({
  filters,
  onChange,
  resultCount,
}: {
  filters: CatalogFilters;
  onChange: (f: CatalogFilters) => void;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const update = <K extends keyof CatalogFilters>(k: K, v: CatalogFilters[K]) =>
    onChange({ ...filters, [k]: v });
  const toggle = (key: "genres" | "tags" | "platforms", value: string) => {
    const arr = filters[key];
    update(key, arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };
  const activeCount =
    filters.genres.length + filters.tags.length + filters.platforms.length +
    (filters.freeOnly ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + (filters.priceMax < 70 ? 1 : 0);

  return (
    <>
      {/* Search + sort bar */}
      <div className="card-surface mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Cerca un gioco, sviluppatore o tag…"
            className="w-full rounded-md border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value as CatalogFilters["sort"])}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="popular">Popolari</option>
            <option value="rating">Miglior voto</option>
            <option value="price-asc">Prezzo crescente</option>
            <option value="price-desc">Prezzo decrescente</option>
            <option value="year-desc">Più recenti</option>
          </select>
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm font-medium hover:bg-surface-3 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtri
            {activeCount > 0 && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-xs text-brand-foreground">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active chips */}
      {activeCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{resultCount} risultati ·</span>
          {[...filters.genres.map((v) => ["genres" as const, v]), ...filters.tags.map((v) => ["tags" as const, v]), ...filters.platforms.map((v) => ["platforms" as const, v])].map(([key, value]) => (
            <Chip key={`${key}-${value}`} onRemove={() => toggle(key as "genres" | "tags" | "platforms", value)}>{value}</Chip>
          ))}
          {filters.freeOnly && <Chip onRemove={() => update("freeOnly", false)}>Gratis</Chip>}
          {filters.minRating > 0 && <Chip onRemove={() => update("minRating", 0)}>≥ {filters.minRating} voto</Chip>}
          {filters.priceMax < 70 && <Chip onRemove={() => update("priceMax", 70)}>≤ {filters.priceMax} €</Chip>}
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="ml-2 text-xs font-medium text-brand hover:underline"
          >
            Pulisci tutto
          </button>
        </div>
      )}

      <div className={`${open ? "block" : "hidden"} lg:hidden`}>
        <FiltersPanel filters={filters} update={update} toggle={toggle} />
      </div>
    </>
  );
}

export function FiltersSidebar({
  filters,
  onChange,
}: {
  filters: CatalogFilters;
  onChange: (f: CatalogFilters) => void;
}) {
  const update = <K extends keyof CatalogFilters>(k: K, v: CatalogFilters[K]) =>
    onChange({ ...filters, [k]: v });
  const toggle = (key: "genres" | "tags" | "platforms", value: string) => {
    const arr = filters[key];
    update(key, arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };
  return (
    <aside className="hidden lg:block">
      <FiltersPanel filters={filters} update={update} toggle={toggle} />
    </aside>
  );
}

function FiltersPanel({
  filters,
  update,
  toggle,
}: {
  filters: CatalogFilters;
  update: <K extends keyof CatalogFilters>(k: K, v: CatalogFilters[K]) => void;
  toggle: (key: "genres" | "tags" | "platforms", value: string) => void;
}) {
  return (
    <div className="card-surface sticky top-24 flex flex-col gap-5 p-4 text-sm">
      <Section title="Generi">
        <div className="flex flex-wrap gap-1.5">
          {ALL_GENRES.map((g) => (
            <Toggle key={g} active={filters.genres.includes(g)} onClick={() => toggle("genres", g)}>
              {g}
            </Toggle>
          ))}
        </div>
      </Section>

      <Section title="Piattaforme">
        <div className="grid grid-cols-3 gap-1.5">
          {ALL_PLATFORMS.map((p) => (
            <Toggle key={p} active={filters.platforms.includes(p)} onClick={() => toggle("platforms", p)}>
              {p === "windows" ? "Windows" : p === "mac" ? "macOS" : "Linux"}
            </Toggle>
          ))}
        </div>
      </Section>

      <Section title="Prezzo massimo">
        <input
          type="range"
          min={0}
          max={70}
          step={1}
          value={filters.priceMax}
          onChange={(e) => update("priceMax", Number(e.target.value))}
          className="w-full accent-[color:var(--brand)]"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>0 €</span>
          <span className="font-semibold text-foreground">{filters.priceMax} €</span>
          <span>70 €</span>
        </div>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.freeOnly}
            onChange={(e) => update("freeOnly", e.target.checked)}
            className="h-4 w-4 accent-[color:var(--brand)]"
          />
          Solo giochi gratis
        </label>
      </Section>

      <Section title="Voto minimo">
        <div className="flex flex-wrap gap-1.5">
          {[0, 60, 70, 80, 90].map((r) => (
            <Toggle key={r} active={filters.minRating === r} onClick={() => update("minRating", r)}>
              {r === 0 ? "Tutti" : `${r}+`}
            </Toggle>
          ))}
        </div>
      </Section>

      <Section title="Tag">
        <div className="flex flex-wrap gap-1.5">
          {ALL_TAGS.map((t) => (
            <Toggle key={t} active={filters.tags.includes(t)} onClick={() => toggle("tags", t)}>
              {t}
            </Toggle>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-surface-2 text-muted-foreground hover:border-brand/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
      {children}
      <button onClick={onRemove} className="hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
