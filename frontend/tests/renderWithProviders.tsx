import { ThemeProvider } from "@emotion/react";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { theme } from "../src/styles/theme";

export const renderWithProviders = (
  ui: ReactElement,
  { route = "/" }: { route?: string } = {},
) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>,
  );
