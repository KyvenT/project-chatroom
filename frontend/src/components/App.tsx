import { css, Global, ThemeProvider } from "@emotion/react";
import Router from "../router/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WebSocketContextProvider from "../contexts/WebSocketContextProvider";
import { useEffect } from "react";
import { fetchRefresh } from "../utils/fetchRefresh";
import { handleWSAuth } from "../ws-router/out-going-ws-messages/auth";
import { useAuthStore } from "../hooks/useStores";

const theme = {
  colors: {
    dark_grey: "#2f2f2f",
    light_grey: "#bcbcbc",
    white: "#f1f1f1",
    black: "#0a0a0a",
    grey: "#525252",
  },
};

const globalStyles = css({
  "*": {
    boxSizing: "border-box",
    margin: 0,
    fontFamily: "Inter, sans-serif",
  },

  "*::before, *::after": {
    boxSizing: "border-box",
  },
});

const queryClient = new QueryClient();

function App() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const autoSignIn = async () => {
      const { ok } = await fetchRefresh();
      if (!ok) {
        console.log("No valid refresh token, user remains logged out");
        return;
      }
      if (ok) handleWSAuth(user.token);
    };

    autoSignIn();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketContextProvider>
        <ThemeProvider theme={theme}>
          <Global styles={globalStyles} />
          <Router />
        </ThemeProvider>
      </WebSocketContextProvider>
    </QueryClientProvider>
  );
}

export default App;
