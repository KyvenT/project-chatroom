import { css, Global, ThemeProvider } from "@emotion/react";
import Router from "../router/router";
import AuthContextProvider from "../contexts/AuthContextProvider";

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

function App() {
  return (
    <AuthContextProvider>
      <ThemeProvider theme={theme}>
        <Global styles={globalStyles} />
        <Router />
      </ThemeProvider>
    </AuthContextProvider>
  )
}

export default App
