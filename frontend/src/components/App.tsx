import { css, Global, ThemeProvider } from "@emotion/react";
import Router from "../router/router";
import AuthContextProvider from "../contexts/AuthContextProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WebSocketContextProvider from "../contexts/WebSocketContextProvider";

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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <WebSocketContextProvider>
          <ThemeProvider theme={theme}>
            <Global styles={globalStyles} />
            <Router />
          </ThemeProvider>
        </WebSocketContextProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  );
}

export default App;
