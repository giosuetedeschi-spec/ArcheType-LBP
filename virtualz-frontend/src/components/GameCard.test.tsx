import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Game } from "@/types/api";
import GameCard from "./GameCard";

// GameCard renders a TanStack Router <Link>, which needs a live router
// context. For a unit test of GameCard's own fallback/formatting logic we
// don't need real navigation, so we stub Link down to a plain <a>.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, params: _params, ...props }: any) => <a {...props}>{children}</a>,
}));

const baseGame: Game = {
  id: 1,
  steamAppId: 100,
  name: "Half-Life 3",
  releaseDate: "2026-01-01",
  developer: "Valve",
  publisher: "Valve",
  price: 19.99,
  rating: 4.5,
  genres: "Action,Sci-fi,Shooter",
  description: "desc",
  headerImageUrl: "https://example.com/hl3.jpg",
  windows: true,
  mac: false,
  linux: false,
  mature: false,
  estimatedOwners: 5000000,
  colorR: null,
  colorG: null,
  colorB: null,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("GameCard", () => {
  it("renders the game name and price", () => {
    render(<GameCard game={baseGame} />);
    expect(screen.getByText("Half-Life 3")).toBeInTheDocument();
    expect(screen.getByText("€19.99")).toBeInTheDocument();
  });

  it("shows only the first two genres, joined with a middle dot", () => {
    render(<GameCard game={baseGame} />);
    expect(screen.getByText("Action · Sci-fi")).toBeInTheDocument();
  });

  it("falls back to 'Untitled Game' when the name is empty", () => {
    render(<GameCard game={{ ...baseGame, name: "   " }} />);
    expect(screen.getByText("Untitled Game")).toBeInTheDocument();
  });

  it("falls back to the animated gradient placeholder when headerImageUrl is missing", () => {
    render(<GameCard game={{ ...baseGame, headerImageUrl: null }} />);
    const placeholder = screen.getByRole("img", { name: "Half-Life 3" });
    expect(placeholder.tagName).toBe("DIV");
  });

  it("shows 'Free' instead of a price when price is 0", () => {
    render(<GameCard game={{ ...baseGame, price: 0 }} />);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.queryByText("€0.00")).not.toBeInTheDocument();
  });

  it("does not render a genres line when genres is null", () => {
    render(<GameCard game={{ ...baseGame, genres: null }} />);
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });
});
