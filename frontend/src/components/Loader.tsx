import { css, keyframes, useTheme } from "@emotion/react";
import { mq } from "../styles/breakpoints";
import type { Theme } from "@emotion/react";

const loaderStyles = (theme: Theme) =>
  css(
    mq({
      display: "inline-block",
      width: "20px",
      height: "20px",
      border: "3px solid transparent",
      borderTop: `3px solid ${theme.colors.white}`,
      borderRadius: "50%",
    }),
  );

const spin = keyframes({
  to: { transform: "rotate(360deg)" },
});

const loaderAnimation = css({
  animation: `${spin} 1.3s infinite linear`,
});

export const Loader = () => {
  const theme = useTheme();

  return <span css={[loaderStyles(theme), loaderAnimation]}></span>;
};
