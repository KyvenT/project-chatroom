import { css } from "@emotion/react";

const styles = css({
  minHeight: "100%",
  display: "flex",
  backgroundColor: "yellow"
})

function Auth() {

  return (
    <div css={styles}>
      <p>Login</p>
    </div>
  )
}

export default Auth;
