import { css, useTheme, type Theme } from "@emotion/react";
import { Link, Outlet } from "react-router";
import { mq } from "../../../styles/breakpoints";

const styles = css(
  mq({
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    ".homeLink": {
      textDecoration: "none",
      color: "black",
      position: "absolute",
      top: "10px",
      left: "10px",
      fontSize: "1.2rem",
    },

    ".authContainer": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
  })
);

const colors = (theme: Theme) => ({
  backgroundColor: theme.colors.light_grey,
  color: theme.colors.dark_grey,
});

function AuthLayout() {
  const theme = useTheme();

  return (
    <div css={[styles, colors(theme)]}>
      <Link to="/" className="homeLink">
        Go to Landing
      </Link>
      <div className="authContainer">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
