import { css, useTheme } from "@emotion/react";
import { mq } from "../../../styles/breakpoints";
import type { Theme } from "@emotion/react";

const styles = (theme: Theme) =>
  css(
    mq({
      ".container": {
        width: "90%",
        backgroundColor: theme.colors.grey,
        padding: "12px",
        margin: "auto",
      },
    })
  );

export const SettingsPage = () => {
  const theme = useTheme();

  return (
    <div css={styles(theme)}>
      <div className="container">
        <h1 className="title">Settings</h1>
      </div>
    </div>
  );
};
