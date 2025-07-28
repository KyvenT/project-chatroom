import { css, Global, ThemeProvider } from "@emotion/react";
import Router from "../router/router";

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
    <ThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      <Router />
    </ThemeProvider>
  )
}

export default App
