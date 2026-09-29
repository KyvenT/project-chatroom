import { ThemeProvider } from "@emotion/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useMemo } from "react";
import { MemoryRouter } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "../../src/router/routes/utility/Settings";
import { useThemeStore } from "../../src/hooks/useThemeStore";
import { buildTheme, defaultColors } from "../../src/styles/theme";

// builds the theme from the store, like App does
const ThemedSettings = () => {
  const overrides = useThemeStore((state) => state.overrides);
  const theme = useMemo(() => buildTheme(overrides), [overrides]);
  return (
    <ThemeProvider theme={theme}>
      <SettingsPage />
    </ThemeProvider>
  );
};

const renderSettings = () =>
  render(
    <MemoryRouter>
      <ThemedSettings />
    </MemoryRouter>,
  );

describe("SettingsPage colors", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.show ??= vi.fn();
    HTMLDialogElement.prototype.showModal ??= vi.fn();
    HTMLDialogElement.prototype.close ??= vi.fn();
  });

  beforeEach(() => {
    localStorage.clear();
    useThemeStore.getState().resetAll();
  });

  it("changes a color from its picker and saves it in the browser", () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText("Accent"), {
      target: { value: "#ff8800" },
    });

    expect(useThemeStore.getState().overrides.accent).toBe("#ff8800");
    expect(JSON.parse(localStorage.getItem("themeColors")!)).toEqual({
      accent: "#ff8800",
    });
    expect(screen.getByLabelText("Accent hex value")).toHaveValue("#ff8800");
  });

  it("only applies a typed hex value once it is complete", () => {
    renderSettings();
    const hex = screen.getByLabelText("Panels hex value");

    fireEvent.change(hex, { target: { value: "#12" } });
    expect(useThemeStore.getState().overrides.dark_grey).toBeUndefined();
    expect(hex).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(hex, { target: { value: "#123456" } });
    expect(useThemeStore.getState().overrides.dark_grey).toBe("#123456");
  });

  it("resets a single color to its default", () => {
    useThemeStore.getState().setColor("success", "#00ff00");
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: /Reset Success/ }));

    expect(useThemeStore.getState().overrides).toEqual({});
    expect(screen.getByLabelText("Success")).toHaveValue(defaultColors.success);
  });

  it("warns when text becomes hard to read", () => {
    renderSettings();
    expect(screen.queryByText(/Hard to read/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Text"), {
      target: { value: "#1a1d26" },
    });

    expect(
      screen.getAllByText(/Hard to read against Background/).length,
    ).toBeGreaterThan(0);
  });

  it("resets every color after confirming", () => {
    useThemeStore.getState().setColor("accent", "#ff8800");
    useThemeStore.getState().setColor("black", "#000000");
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: "Reset all" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Reset colors", hidden: true }),
    );

    expect(useThemeStore.getState().overrides).toEqual({});
    expect(screen.getByRole("button", { name: "Reset all" })).toBeDisabled();
  });
});
