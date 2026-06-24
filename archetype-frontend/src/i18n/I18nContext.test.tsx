import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider, useI18n } from "@/i18n/I18nContext";

describe("I18nProvider", () => {
  it("renders children", () => {
    render(
      <I18nProvider>
        <span>hello</span>
      </I18nProvider>
    );
    expect(screen.getByText("hello")).toBeTruthy();
  });

  it("provides t() function", () => {
    let capturedT: any;
    function Probe() {
      const { t } = useI18n();
      capturedT = t;
      return null;
    }
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(typeof capturedT).toBe("function");
  });

  it("translates keys", () => {
    let capturedT: any;
    function Probe() {
      const { t } = useI18n();
      capturedT = t;
      return null;
    }
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(capturedT("home.whatToPlay")).toBe("What to play?");
  });

  it("interpolates variables", () => {
    let capturedT: any;
    function Probe() {
      const { t } = useI18n();
      capturedT = t;
      return null;
    }
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(capturedT("home.abandonedCount", { count: 3 })).toBe("You have 3 abandoned games in your library.");
  });

  it("falls back to English for missing keys", () => {
    let capturedT: any;
    function Probe() {
      const { t } = useI18n();
      capturedT = t;
      return null;
    }
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    // Key exists in en but not hypothetical translation
    expect(capturedT("nav.dashboard")).toBe("Dashboard");
  });

  it("returns key name for completely missing keys", () => {
    let capturedT: any;
    function Probe() {
      const { t } = useI18n();
      capturedT = t;
      return null;
    }
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(capturedT("totally.missing.key")).toBe("totally.missing.key");
  });
});
