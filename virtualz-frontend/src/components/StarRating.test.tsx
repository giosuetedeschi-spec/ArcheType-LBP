import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarRating from "./StarRating";

describe("StarRating", () => {
  it("renders 5 stars", () => {
    render(<StarRating value={3} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("is read-only (buttons disabled, no radiogroup role) when onChange is not provided", () => {
    render(<StarRating value={3} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.every((b) => b.hasAttribute("disabled"))).toBe(true);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("is interactive when onChange is provided", () => {
    render(<StarRating value={3} onChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.every((b) => !b.hasAttribute("disabled"))).toBe(true);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  it("calls onChange with the clicked star's value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} />);

    await user.click(screen.getByLabelText("4 stelle"));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("does not call onChange when read-only", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={2} />);

    // buttons are disabled, so a click can't fire onChange (there is none anyway)
    await user.click(screen.getByLabelText("4 stelle"));

    expect(onChange).not.toHaveBeenCalled();
  });
});
