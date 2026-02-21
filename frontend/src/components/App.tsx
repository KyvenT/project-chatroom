import { css, Global, ThemeProvider } from "@emotion/react";
import Router from "../router/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRefreshToken } from "../utils/useRefreshToken";
import { useAuthStore } from "../hooks/useStores";
import { closeWs, startWSConnection } from "../ws-router/ws";
import { sendWSMessage } from "../ws-router/sender";

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
      const { ok } = await useRefreshToken();
      if (!ok) {
        console.log("No valid refresh token, user remains logged out");
        return;
      }
    };

    autoSignIn();
  }, []);

  useEffect(() => {
    if (!user.token) {
      console.log("User not logged in, not establishing WebSocket connection");
      return;
    }
    startWSConnection();
    console.log("WebSocket connection established, sending auth message");
    sendWSMessage({ type: "auth", token: user.token });

    return () => {
      closeWs();
    };
  }, [user.token]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Global styles={globalStyles} />
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
