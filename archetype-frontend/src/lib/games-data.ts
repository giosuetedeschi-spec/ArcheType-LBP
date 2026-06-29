export type GameStatus = "playing" | "finished" | "abandoned" | "wishlist";

export interface Game {
  id: number;
  name: string;
  developer: string;
  publisher: string;
  releaseYear: number;
  price: number;
  genres: string[];
  tags: string[];
  platforms: ("windows" | "mac" | "linux")[];
  rating: number; // 0-100
  shortDescription: string;
  cover: string; // gradient seed
}

const GENRES = ["Action", "RPG", "Strategy", "Indie", "Adventure", "Simulation", "Shooter", "Puzzle", "Racing", "Sports"];
const TAGS = ["Singleplayer", "Multiplayer", "Co-op", "Open World", "Story Rich", "Atmospheric", "Pixel Art", "Difficult", "Relaxing", "Sci-fi", "Fantasy", "Horror"];

const titles = [
  ["Neon Drift", "Action", "Racer"],
  ["Hollow Realms", "RPG", "Fantasy"],
  ["Stellar Forge", "Strategy", "Sci-fi"],
  ["Pixel Wanderer", "Indie", "Pixel Art"],
  ["Crimson Tide Tactics", "Strategy", "Difficult"],
  ["Echoes of Aether", "Adventure", "Story Rich"],
  ["Farmstead Days", "Simulation", "Relaxing"],
  ["Void Hunter", "Shooter", "Sci-fi"],
  ["Mind Loop", "Puzzle", "Atmospheric"],
  ["Velocity X", "Racing", "Multiplayer"],
  ["Goal Kings 26", "Sports", "Multiplayer"],
  ["Shadow Marches", "RPG", "Open World"],
  ["Bunker 77", "Horror", "Atmospheric"],
  ["Cog & Spire", "Indie", "Puzzle"],
  ["Galaxy Brokers", "Strategy", "Sci-fi"],
  ["Sunfall Saga", "RPG", "Story Rich"],
  ["Frostline", "Survival", "Difficult"],
  ["Tinker Town", "Simulation", "Co-op"],
  ["Riftborn", "Action", "Fantasy"],
  ["Cassette Quest", "Adventure", "Pixel Art"],
  ["Apex Circuit", "Racing", "Singleplayer"],
  ["Nebula Drifters", "Shooter", "Co-op"],
  ["Court of Mirrors", "Puzzle", "Story Rich"],
  ["Iron Brigade Reborn", "Action", "Multiplayer"],
];

const devs = ["Lumen Studios", "Pixel Anvil", "Void Octopus", "Nightingale Games", "Bright Forge", "Quantum Otter", "Atlas Interactive", "Sable Labs"];

export const GAMES: Game[] = titles.map((t, i) => {
  const genre = t[1];
  const tag = t[2];
  const seed = (i * 137) % 360;
  return {
    id: i + 1,
    name: t[0],
    developer: devs[i % devs.length],
    publisher: devs[(i + 3) % devs.length],
    releaseYear: 2018 + (i % 8),
    price: i % 5 === 0 ? 0 : Math.round((4.99 + (i * 3.17) % 55) * 100) / 100,
    genres: [GENRES.includes(genre) ? genre : "Indie"].concat(i % 3 === 0 ? ["Indie"] : []),
    tags: [tag, TAGS[(i * 5) % TAGS.length], TAGS[(i * 7 + 2) % TAGS.length]].filter((v, idx, a) => a.indexOf(v) === idx),
    platforms: (i % 4 === 0 ? ["windows", "mac", "linux"] : i % 2 === 0 ? ["windows", "mac"] : ["windows"]) as Game["platforms"],
    rating: 55 + ((i * 13) % 45),
    shortDescription: `An immersive ${genre.toLowerCase()} experience blending ${tag.toLowerCase()} atmosphere with tight, modern gameplay.`,
    cover: `linear-gradient(135deg, oklch(0.45 0.18 ${seed}), oklch(0.30 0.15 ${(seed + 60) % 360}))`,
  };
});

export const ALL_GENRES = Array.from(new Set(GAMES.flatMap(g => g.genres))).sort();
export const ALL_TAGS = Array.from(new Set(GAMES.flatMap(g => g.tags))).sort();
export const ALL_PLATFORMS = ["windows", "mac", "linux"] as const;
