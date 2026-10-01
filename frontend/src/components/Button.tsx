import {
  css,
  useTheme,
  type SerializedStyles,
} from "@emotion/react";
import type React from "react";
import { iconBtnStyles } from "../styles/iconButton";

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
