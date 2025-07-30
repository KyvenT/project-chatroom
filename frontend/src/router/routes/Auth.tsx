import { css } from "@emotion/react";
import { Link } from "react-router";

const styles = css({
  minHeight: "100%",
  display: "flex",
  backgroundColor: "yellow"
})

function Auth() {

  return (
    <div css={styles}>
      <p>Login</p>
      <Link to="/" css={{ textDecoration: "none", color: "black" }}>
        Go to Home Page
      </Link>
      <Link to="/chat" css={{ textDecoration: "none", color: "black", marginLeft: "10px" }}>
        Go to Chat Page
      </Link>
    </div>
  )
}

export default Auth;
