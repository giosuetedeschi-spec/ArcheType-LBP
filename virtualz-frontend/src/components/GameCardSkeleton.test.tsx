import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import GameCardSkeleton from "./GameCardSkeleton";

describe("GameCardSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<GameCardSkeleton />);
    expect(container.firstChild).not.toBeNull();
  });
});
