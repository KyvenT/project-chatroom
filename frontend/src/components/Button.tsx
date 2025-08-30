import { css, useTheme, type SerializedStyles, type Theme } from "@emotion/react"
import type React from "react"


export const iconBtnStyles = (theme: Theme) => css({
  border: 0,
  backgroundColor: "inherit",
  color: theme.colors.white,
  display: "grid",
  placeItems: "center",
  borderRadius: "5px",
  cursor: "pointer",
  userSelect: "none",

  "&:hover": {
    color: theme.colors.grey,
  },
})

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "icon";
}

const Button = ({variant="default", children, ...props}: ButtonProps) => {
    const theme = useTheme();

    let styles: SerializedStyles = css({})
    if (variant === "icon") styles = iconBtnStyles(theme);

    return <button css={styles} {...props}>{children}</button>
}

export default Button;