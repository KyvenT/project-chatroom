import { describe, expect, it } from "vitest";
import { buildTheme, defaultColors, withAlpha } from "../../src/styles/theme";
import { contrastRatio } from "../../src/utils/contrast";

describe("buildTheme", () => {
  it("uses the default colors without overrides", () => {
    expect(buildTheme().colors.accent).toBe(defaultColors.accent);
  });

  it("applies valid overrides and derives tints from them", () => {
    const { colors } = buildTheme({ accent: "#ff0000", danger: "#00ff00" });

    expect(colors.accent).toBe("#ff0000");
    expect(colors.accentSoft).toBe("rgba(255, 0, 0, 0.14)");
    expect(colors.dangerSoft).toBe("rgba(0, 255, 0, 0.12)");
  });

  it("ignores invalid or unknown overrides", () => {
    const { colors } = buildTheme({
      accent: "red",
      nope: "#123456",
    } as Record<string, string>);

    expect(colors.accent).toBe(defaultColors.accent);
    expect(colors).not.toHaveProperty("nope");
  });
});

describe("withAlpha", () => {
  it("converts hex to rgba", () => {
    expect(withAlpha("#0e1015", 0.6)).toBe("rgba(14, 16, 21, 0.6)");
  });
});

describe("contrastRatio", () => {
  it("matches the WCAG extremes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("doesn't depend on argument order", () => {
    expect(contrastRatio("#e9ebf1", "#0e1015")).toBeCloseTo(
      contrastRatio("#0e1015", "#e9ebf1"),
    );
  });
});
