import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";

const styles = css({
  minHeight: "100dvh",
  width: "100%",
  margin: 0,
  padding: 0,
  display: "flex",
})

const colors = (theme: Theme) => ({
  backgroundColor: theme.colors.light_grey,
});

function Chat() {
  const theme = useTheme();
  return (
    <div css={[styles, colors(theme)]}>
      <p>Chat</p>
    </div>
  )
}

export default Chat;
