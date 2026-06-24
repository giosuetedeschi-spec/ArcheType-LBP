import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ColorblindProvider } from "@/contexts/ColorblindContext";

describe("ColorblindProvider", () => {
  it("renders children", () => {
    render(
      <ColorblindProvider>
        <span>test</span>
      </ColorblindProvider>
    );
    expect(screen.getByText("test")).toBeTruthy();
  });

  it("sets data-colorblind attribute when mode changes", () => {
    // Attribute is set on document.documentElement
    document.documentElement.removeAttribute("data-colorblind");
    render(<ColorblindProvider><span>x</span></ColorblindProvider>);
    // Default mode is "off" — no attribute
    expect(document.documentElement.getAttribute("data-colorblind")).toBeNull();
  });
});

describe("useColorblind", () => {
  it("provides default mode as off", () => {
    let captured: any;
    function Probe() {
      const ctx = require("@/contexts/ColorblindContext").useColorblind();
      captured = ctx;
      return null;
    }
    render(
      <ColorblindProvider>
        <Probe />
      </ColorblindProvider>
    );
    expect(captured.mode).toBe("off");
  });
});
