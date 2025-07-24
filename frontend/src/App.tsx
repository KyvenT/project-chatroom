/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";

const styles = css({
  minHeight: "100%",
  display: "flex",
  backgroundColor: "yellow"
})

function App() {

  return (
    <div css={styles}>
      <p>Hello</p>
    </div>
  )
}

export default App
