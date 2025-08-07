import { css } from "@emotion/react";
import { Link } from "react-router";

const styles = css({
  minHeight: "100%",
  display: "flex",
  backgroundColor: "yellow"
})

function Home() {

  return (
    <div css={styles}>
      <h1>Project Chatroom</h1>
      <Link to="/login" css={{ textDecoration: "none", color: "black" }}>
        Go to Auth Page
      </Link>
      <Link to="/chat" css={{ textDecoration: "none", color: "black", marginLeft: "10px" }}>
        Go to Chat Page
      </Link>
    </div>
  )
}

export default Home;
