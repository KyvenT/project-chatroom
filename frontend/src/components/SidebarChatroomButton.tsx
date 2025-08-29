import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import type React from "react";
import { NavLink } from "react-router";

interface SidebarChatroomButtonProps {
  isActive?: boolean;
  chatroomId: string;
  children: React.ReactNode;
}

const styles = css({
  width: "100%",

  div: {
    width: "100%",
    padding: "4px",
    borderRadius: "4px",
  },

  ".chatroomLink": {
    display: "block",
    textDecoration: "none",
  },
});

const dynamicStyles = (theme: Theme, isActive: boolean) =>
  css({
    div: {
      backgroundColor: isActive ? theme.colors.white : "inherit",
    },

    "div:hover": {
      backgroundColor: theme.colors.grey,
    },

    ".chatroomLink": {
      color: isActive ? theme.colors.black : theme.colors.white,
    },
  });

const SidebarChatroomButton = ({
  isActive = false,
  children,
  chatroomId,
}: SidebarChatroomButtonProps) => {
  const theme = useTheme();

  return (
    <li css={[styles, dynamicStyles(theme, isActive)]}>
      <div>
        <NavLink className="chatroomLink" to={"/chat/" + chatroomId}>
          {children}
        </NavLink>
      </div>
    </li>
  );
};

export default SidebarChatroomButton;
