import { css, useTheme, type Theme } from "@emotion/react";
import { Outlet } from "react-router";
import { mq } from "../../../styles/breakpoints";

const styles = css(
  mq({
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    ".authContainer": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
  }),
);

const colors = (theme: Theme) => ({
  backgroundColor: theme.colors.light_grey,
  color: theme.colors.dark_grey,
});

function AuthLayout() {
  const theme = useTheme();

  return (
    <div css={[styles, colors(theme)]}>
      <div className="authContainer">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
