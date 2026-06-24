// Static filter options (extensible, to be replaced by API-driven data later)

export const ALL_GENRES = [
  "Action",
  "RPG",
  "Strategy",
  "Indie",
  "Adventure",
  "Simulation",
  "Shooter",
  "Puzzle",
  "Racing",
  "Sports",
  "Horror",
  "Platformer",
  "Roguelike",
  "MMO",
  "Sandbox",
] as const;

export const ALL_TAGS = [
  "Singleplayer",
  "Multiplayer",
  "Co-op",
  "Open World",
  "Story Rich",
  "Atmospheric",
  "Pixel Art",
  "Difficult",
  "Relaxing",
  "Sci-fi",
  "Fantasy",
  "Horror",
  "Cyberpunk",
  "Retro",
  "Turn-Based",
] as const;

export const ALL_PLATFORMS = ["windows", "mac", "linux"] as const;
