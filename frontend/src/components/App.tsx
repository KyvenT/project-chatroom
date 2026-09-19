import { css, Global, ThemeProvider } from "@emotion/react";
import Router from "../router/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRefreshToken } from "../utils/useRefreshToken";
import { useAuthStore } from "../hooks/useStores";
import { closeWs, startWSConnection } from "../ws-router/ws";
import { theme } from "../styles/theme";

const globalStyles = (t: typeof theme) =>
  css({
    "*": {
      boxSizing: "border-box",
      margin: 0,
      scrollbarWidth: "thin",
      scrollbarColor: `${t.colors.borderStrong} transparent`,
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },

    "*::before, *::after": {
      boxSizing: "border-box",
    },

    body: {
      backgroundColor: t.colors.black,
      color: t.colors.white,
      fontSize: "15px",
      lineHeight: 1.5,
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },

    a: {
      color: t.colors.accentHover,
      textDecoration: "none",
      "&:hover": { textDecoration: "underline" },
    },

    "input, textarea, select, button": {
      font: "inherit",
    },

    "button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible":
      {
        outline: `2px solid ${t.colors.accent}`,
        outlineOffset: "2px",
      },

    "::selection": {
      backgroundColor: t.colors.accentSoft,
    },
  });

const queryClient = new QueryClient();

function App() {
  const handleSignIn = useAuthStore((state) => state.handleSignIn);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const autoSignIn = async () => {
      const result = await useRefreshToken();
      if (!result.ok) {
        console.log("No valid refresh token, user remains logged out");
        return;
      }
      handleSignIn(result);
    };

    autoSignIn();
  }, []);

  useEffect(() => {
    if (user.token) {
      startWSConnection();
    }
    return () => {
      closeWs();
    };
  }, [user.userId]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Global styles={globalStyles(theme)} />
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
