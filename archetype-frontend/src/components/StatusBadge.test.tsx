import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders wishlist status", () => {
    render(<StatusBadge status="wishlist" />);
    expect(screen.getByText("Wishlist")).toBeTruthy();
  });

  it("renders playing status", () => {
    render(<StatusBadge status="playing" />);
    expect(screen.getByText("Playing")).toBeTruthy();
  });

  it("renders finished status", () => {
    render(<StatusBadge status="finished" />);
    expect(screen.getByText("Finished")).toBeTruthy();
  });

  it("renders abandoned status", () => {
    render(<StatusBadge status="abandoned" />);
    expect(screen.getByText("Abandoned")).toBeTruthy();
  });
});
