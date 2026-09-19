import {
  css,
  useTheme,
  type SerializedStyles,
  type Theme,
} from "@emotion/react";
import type React from "react";

export const iconBtnStyles = (theme: Theme) =>
  css({
    border: 0,
    backgroundColor: "inherit",
    color: theme.colors.light_grey,
    display: "grid",
    placeItems: "center",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    userSelect: "none",
    transition: "color 0.15s ease, background-color 0.15s ease",

    "&:hover": {
      color: theme.colors.white,
      backgroundColor: theme.colors.grey,
    },
  });

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "icon";
  otherStyles?: SerializedStyles;
}

const Button = ({
  variant = "default",
  otherStyles,
  children,
  ...props
}: ButtonProps) => {
  const theme = useTheme();

  let styles: SerializedStyles = css({});
  if (variant === "icon") styles = iconBtnStyles(theme);

  return (
    <button css={[styles, otherStyles]} {...props}>
      {children}
    </button>
  );
};

export default Button;
