import { describe, it, expect, beforeEach } from "vitest";
import { useLibrary } from "@/lib/library-store";

describe("useLibrary store", () => {
  beforeEach(() => {
    // Reset store state
    useLibrary.setState({ entries: {} });
    localStorage.clear();
  });

  it("starts with empty entries", () => {
    const entries = useLibrary.getState().entries;
    expect(Object.keys(entries)).toHaveLength(0);
  });

  it("adds a game to library", () => {
    const { setStatus } = useLibrary.getState();
    setStatus(1, "playing");
    const entry = useLibrary.getState().entries[1];
    expect(entry).toBeDefined();
    expect(entry.status).toBe("playing");
    expect(entry.gameId).toBe(1);
  });

  it("updates game status", () => {
    const { setStatus } = useLibrary.getState();
    setStatus(1, "playing");
    setStatus(1, "finished");
    const entry = useLibrary.getState().entries[1];
    expect(entry.status).toBe("finished");
  });

  it("removes game from library", () => {
    const { setStatus } = useLibrary.getState();
    setStatus(1, "wishlist");
    setStatus(1, null);
    const entry = useLibrary.getState().entries[1];
    expect(entry).toBeUndefined();
  });

  it("updates hours", () => {
    const { setStatus, setHours } = useLibrary.getState();
    setStatus(1, "playing");
    setHours(1, 42);
    const entry = useLibrary.getState().entries[1];
    expect(entry.hoursPlayed).toBe(42);
    expect(entry.addedAt).toBeDefined();
  });
});
