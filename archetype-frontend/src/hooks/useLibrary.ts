import { useMemo } from "react";
import { userGameApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const USER_ID = 1; // ponytail: single-user until auth lands

interface LibraryEntry {
  gameId: number;
  status: string;
  hoursPlayed?: number;
}

export function useLibrary() {
  const { data: entries } = useQuery({
    queryKey: ["userGames", USER_ID],
    queryFn: () => userGameApi.list(USER_ID),
  });

  //ponytail: derived map memo — no Zustand, single source of truth
  const entryMap = useMemo(() => {
    const map: Record<number, LibraryEntry> = {};
    (entries ?? []).forEach((e: LibraryEntry) => { map[e.gameId] = e; });
    return map;
  }, [entries]);

  return { entries: entryMap, rawEntries: entries ?? [] };
}
