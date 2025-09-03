import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import { NavLink } from "react-router";
import useToggle from "../hooks/useToggle";
import Button from "./Button";
import { UserRoundPlus } from "lucide-react";
import Modal from "./Modal";

interface SidebarChatroomButtonProps {
  isActive?: boolean;
  chatroomId: string;
  children: string;
}

const styles = css({
  width: "100%",

  div: {
    width: "100%",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    height: "2rem",
  },

  ".chatroomLink": {
    flex: 1,
    textDecoration: "none",
    userSelect: "none",
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

const inviteBtnStyles = (theme: Theme) =>
  css({
    color: theme.colors.light_grey,
    aspectRatio: 1,
    height: "100%",

    "&:hover": {
      color: theme.colors.black,
    },
  });

const SidebarChatroomButton = ({
  isActive = false,
  children,
  chatroomId,
}: SidebarChatroomButtonProps) => {
  const theme = useTheme();
  const [isHovered, setHovered] = useToggle(false);
  const [inviteModalOpen, setInviteModalOpen] = useToggle();

  return (
    <>
      <li css={[styles, dynamicStyles(theme, isActive)]}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <NavLink className="chatroomLink" to={"/chat/" + chatroomId}>
            {children}
          </NavLink>
          {isHovered && (
            <Button
              onClick={() => setInviteModalOpen()}
              variant="icon"
              otherStyles={inviteBtnStyles(theme)}
            >
              {<UserRoundPlus />}
            </Button>
          )}
        </div>
      </li>
      <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)}>
        <h3>Invite to {children}</h3>
        <button className="close-btn" onClick={() => setInviteModalOpen(false)}>
          X
        </button>
      </Modal>
    </>
  );
};

export default SidebarChatroomButton;
