import { describe, it, expect } from "vitest";

describe("API types", () => {
  it("GameFilterRequest builds correct params", () => {
    const req = {
      search: "counter",
      genre: "Action",
      minPrice: 0,
      maxPrice: 30,
      minRating: 4,
      sortBy: "rating",
      sortDir: "desc",
      page: 0,
      size: 20,
    };
    const params = new URLSearchParams();
    if (req.search) params.set("name", req.search);
    if (req.genre) params.set("genre", req.genre);
    if (req.minPrice != null) params.set("minPrice", String(req.minPrice));
    if (req.maxPrice != null) params.set("maxPrice", String(req.maxPrice));
    if (req.minRating != null) params.set("minRating", String(req.minRating));
    if (req.sortBy) params.set("sortBy", req.sortBy);
    if (req.sortDir) params.set("sortDir", req.sortDir);
    if (req.page != null) params.set("page", String(req.page));
    if (req.size != null) params.set("size", String(req.size));

    const url = `/api/games/filter?${params.toString()}`;
    expect(url).toContain("name=counter");
    expect(url).toContain("genre=Action");
    expect(url).toContain("minPrice=0");
    expect(url).toContain("maxPrice=30");
    expect(url).toContain("minRating=4");
    expect(url).toContain("sortBy=rating");
    expect(url).toContain("sortDir=desc");
    expect(url).toContain("page=0");
    expect(url).toContain("size=20");
  });

  it("GameFilterRequest omits undefined params", () => {
    const req = { search: "test", page: 0, size: 20 };
    const params = new URLSearchParams();
    if (req.search) params.set("name", req.search);
    if ((req as any).genre) params.set("genre", (req as any).genre);
    if (req.page != null) params.set("page", String(req.page));
    if (req.size != null) params.set("size", String(req.size));

    const url = `/api/games/filter?${params.toString()}`;
    expect(url).toContain("name=test");
    expect(url).not.toContain("genre=");
    expect(url).toContain("page=0");
  });
});
