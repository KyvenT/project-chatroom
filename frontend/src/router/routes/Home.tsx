import { css } from "@emotion/react";

const styles = css({
  minHeight: "100%",
  display: "flex",
  backgroundColor: "yellow"
})

function Home() {

  return (
    <div css={styles}>
      <h1>Project Chatroom</h1>
    </div>
  )
}

export default Home;
