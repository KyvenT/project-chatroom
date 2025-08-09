import { css, Global, ThemeProvider } from "@emotion/react";
import Router from "../router/router";
import AuthContextProvider from "../contexts/AuthContextProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const theme = {
  colors: {
    dark_grey: "#393E41",
    light_grey: "#CEBEBE",
    white: "#ECE2D0",
    brown: "#BA5A31",
    orange: "#F26419"
  }
}

const globalStyles = css({
  '*': {
    boxSizing: "border-box",
    margin: 0,
    fontFamily: "Arial, sans-serif",
  },
})

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <ThemeProvider theme={theme}>
          <Global styles={globalStyles} />
          <Router />
        </ThemeProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  )
}

export default App
