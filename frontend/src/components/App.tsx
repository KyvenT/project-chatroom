import { css, Global, ThemeProvider } from "@emotion/react";
import Router from "../router/router";
import AuthContextProvider from "../contexts/AuthContextProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WebSocketContextProvider from "../contexts/WebSocketContextProvider";

const theme = {
  colors: {
    dark_grey: "#424242",
    light_grey: "#C9C9C9",
    white: "#FEFFEA",
    black: "#181F1C",
    grey: "#A3A3A3",
  },
};

const globalStyles = css({
  "*": {
    boxSizing: "border-box",
    margin: 0,
    fontFamily: "Arial, sans-serif",
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
