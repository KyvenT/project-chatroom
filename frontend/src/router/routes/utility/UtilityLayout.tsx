import { css, useTheme, type Theme } from "@emotion/react";
import { Outlet } from "react-router";

const styles = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.dark_grey,
    height: "100dvh",
  });

export const UtilityLayout = () => {
  const theme = useTheme();

  return (
    <div css={styles(theme)}>
      <Outlet />
    </div>
  );
};
