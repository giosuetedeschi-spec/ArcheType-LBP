interface StarRatingProps {
  value: number;
  /** Se presente, le stelle diventano cliccabili (form di scrittura). */
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}

const STARS = [1, 2, 3, 4, 5];

/** Voto utente 1-5 stelle — sola lettura o interattivo in base a onChange. */
export default function StarRating({ value, onChange, size = "sm" }: StarRatingProps) {
  const textSize = size === "md" ? "text-2xl" : "text-base";
  const interactive = Boolean(onChange);

  return (
    <div className={`flex gap-0.5 ${textSize}`} role={interactive ? "radiogroup" : undefined}>
      {STARS.map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          aria-label={`${n} stelle`}
          className={`leading-none ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"} ${
            n <= value ? "text-vz-lime" : "text-zinc-700"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
