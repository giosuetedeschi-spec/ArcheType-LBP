interface GameCoverPlaceholderProps {
  /** Nome del gioco, usato sia per l'etichetta accessibile sia per l'iniziale mostrata */
  name: string;
  /** Valore stabile (es. game id) per rendere angolo/velocità sempre uguali per lo stesso gioco */
  seed?: number | string;
  className?: string;
}

// Hash piccolo e deterministico: stesso seed -> stesso numero, sempre. Serve
// solo a variare angolo/velocità tra un gioco e l'altro senza che il
// gradiente "salti" ad ogni re-render (Math.random() lo farebbe).
function hashSeed(seed: number | string): number {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Sostituto animato dell'header image quando `headerImageUrl` è null (data
 * quality del dataset Steam, issue #101 — vedi docs/FEATURE_STATUS.md).
 * Usa le CSS custom properties della palette (--color-vz-*) invece di colori
 * fissi, quindi eredita automaticamente gli override delle modalità
 * colorblind definiti in index.css.
 */
export default function GameCoverPlaceholder({ name, seed, className = "" }: GameCoverPlaceholderProps) {
  const h = hashSeed(seed ?? name);
  const angle = h % 360;
  const duration = 8 + (h % 6); // 8-13s: giochi diversi non pulsano in sincrono

  return (
    <div
      role="img"
      aria-label={name}
      className={`relative flex items-center justify-center overflow-hidden bg-vz-charcoal ${className}`}
      style={{
        background: `linear-gradient(${angle}deg, var(--color-vz-navy) 0%, var(--color-vz-pink) 35%, var(--color-vz-lime) 70%, var(--color-vz-navy-deep) 100%)`,
        backgroundSize: "300% 300%",
        animation: `gradient-pan ${duration}s ease-in-out infinite`,
      }}
    >
      <span aria-hidden="true" className="font-display font-bold text-white/20 text-4xl select-none">
        {name?.trim()?.[0]?.toUpperCase() || "?"}
      </span>
    </div>
  );
}
