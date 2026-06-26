import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/loading")({
  component: LoadingPage,
});

function LoadingPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
      void navigate({ to: "/" });
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleEnter = () => {
    void navigate({ to: "/" });
  };

  return (
    <div
      className="relative grid min-h-screen place-items-center overflow-hidden bg-background"
      onClick={handleEnter}
      style={{ cursor: "pointer" }}
    >
      {/* Animated orbs background */}
      <div className="orbs-layer" aria-hidden="true">
        <div className="orb orb-brand" style={{ top: "-10%", left: "-5%" }} />
        <div className="orb orb-accent" style={{ bottom: "-10%", right: "-5%" }} />
        <div
          className="orb"
          style={{
            background: "var(--color-status-wishlist)",
            width: "200px",
            height: "200px",
            top: "50%",
            left: "50%",
            opacity: "0.04",
            animation: "orbDrift 22s ease-in-out infinite",
            animationDelay: "-8s",
          }}
        />
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        {/* Logo glow */}
        <div className="glow grid h-20 w-20 place-items-center rounded-2xl bg-[image:var(--gradient-brand)]">
          <Gamepad2 className="h-10 w-10 text-brand-foreground" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-brand">Steam</span>
          <span className="text-accent">Stats</span>
        </h1>

        {/* Tagline */}
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          La tua collezione gaming, finalmente organizzata.
        </p>

        {/* Progress bar */}
        <div className="w-64 max-w-full">
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-[image:var(--gradient-brand)]"
              style={{
                width: `${progress}%`,
                transition: "width 2.5s ease-out",
              }}
            />
          </div>
        </div>

        {/* Enter button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEnter();
          }}
          className="mt-4 btn-brand inline-flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all hover:scale-105"
        >
          Entra
        </button>

        <p className="text-xs text-muted-foreground">Click per continuare</p>
      </div>
    </div>
  );
}
