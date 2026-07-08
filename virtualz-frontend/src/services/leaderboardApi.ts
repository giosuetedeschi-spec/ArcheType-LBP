import api from "./api";
import type { LeaderboardParams, LeaderboardResponse } from "@/types/api";

/**
 * @param params userId di chi guarda + scope ("global"|"friends") + metric ("hours"|"games"|"friends")
 * @returns la classifica paginata, con myEntry = posizione di userId
 */
export async function getLeaderboard(params: LeaderboardParams): Promise<LeaderboardResponse> {
  const { data } = await api.get<LeaderboardResponse>("/leaderboard", { params });
  return data;
}
