import { useState } from "react";

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  variant?: "lime" | "slate";
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<AvatarProps["variant"]>, string> = {
  lime: "bg-vz-lime text-vz-navy",
  slate: "bg-slate-700 text-white",
};

/**
 * Avatar — foto profilo utente (users.avatar_url) con fallback su cerchio
 * a iniziale quando l'URL manca o fallisce a caricare (onError, es. hotlink
 * morto). Usato ovunque compaia un utente: Leaderboard, Friends, Profile.
 */
export default function Avatar({ username, avatarUrl, size = 40, variant = "slate", className = "" }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const dimension = `${size}px`;

  if (avatarUrl && !errored) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        onError={() => setErrored(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold font-display shrink-0 ${VARIANT_CLASSES[variant]} ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
}
