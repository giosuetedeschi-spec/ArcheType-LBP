import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameStatus } from "./games-data";

interface LibraryEntry {
  gameId: number;
  status: GameStatus;
  hoursPlayed: number;
  addedAt: number;
}

interface LibraryState {
  entries: Record<number, LibraryEntry>;
  setStatus: (gameId: number, status: GameStatus | null) => void;
  setHours: (gameId: number, hours: number) => void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
      entries: {},
      setStatus: (gameId, status) =>
        set((s) => {
          const next = { ...s.entries };
          if (status === null) {
            delete next[gameId];
          } else {
            next[gameId] = {
              gameId,
              status,
              hoursPlayed: next[gameId]?.hoursPlayed ?? 0,
              addedAt: next[gameId]?.addedAt ?? Date.now(),
            };
          }
          return { entries: next };
        }),
      setHours: (gameId, hours) =>
        set((s) => {
          const e = s.entries[gameId];
          if (!e) return s;
          return { entries: { ...s.entries, [gameId]: { ...e, hoursPlayed: hours } } };
        }),
    }),
    { name: "steamstats-library" }
  )
);
