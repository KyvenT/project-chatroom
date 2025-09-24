import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import { NavLink } from "react-router";
import useToggle from "../../hooks/useToggle";
import Button from "../Button";
import { UserRoundPlus } from "lucide-react";
import useAuthContext from "../../hooks/useAuthContext";
import { InviteModal } from "./InviteModal";
import type { ChatroomPrivacy } from "../../types/REST-types/Chatroom";

interface SidebarChatroomButtonProps {
  isActive?: boolean;
  chatroomId: string;
  unreadMessages: number;
  children: string;
  privacy: ChatroomPrivacy;
  ownerId: string;
}

const styles = css({
  position: "relative",
  width: "100%",

  div: {
    width: "100%",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    height: "2rem",
    borderStyle: "solid",
    borderWidth: "3px",
  },

  ".chatroomLink": {
    flex: 1,
    textDecoration: "none",
    userSelect: "none",
  },

  ".unreadBadge": {
    position: "absolute",
    top: 0,
    right: 0,
    aspectRatio: 1,
    borderRadius: "50%",
    fontSize: "1rem",
    width: "1rem",
    textAlign: "center",
    userSelect: "none",
  },

  "#inviteForm": {
    display: "flex",
    width: "100%",
  },

  "#inviteForm input": {
    flex: 1,
  },
});

const dynamicStyles = (theme: Theme, isActive: boolean) =>
  css({
    div: {
      backgroundColor: isActive ? theme.colors.white : "inherit",
      borderColor: isActive ? theme.colors.white : "transparent",
    },

    "div:hover": {
      backgroundColor: isActive ? theme.colors.light_grey : theme.colors.grey,
    },

    ".chatroomLink": {
      color: isActive ? theme.colors.black : theme.colors.light_grey,
      "&:hover": {
        color: isActive ? theme.colors.black : theme.colors.white,
      },
    },

    ".unreadBadge": {
      backgroundColor: "red",
      color: theme.colors.white,
    },
  });

const inviteBtnStyles = (theme: Theme, isActive: boolean) =>
  css({
    color: isActive ? theme.colors.grey : theme.colors.dark_grey,
    aspectRatio: 1,
    height: "100%",
    textAlign: "center",

    "&:hover": {
      color: isActive ? theme.colors.black : theme.colors.white,
    },
  });

export interface inviteFormInput {
  username: string;
}

const SidebarChatroomButton = ({
  isActive = false,
  children,
  chatroomId,
  unreadMessages,
  ownerId,
  privacy,
}: SidebarChatroomButtonProps) => {
  const theme = useTheme();
  const { user } = useAuthContext();
  const [isHovered, setHovered] = useToggle(false);
  const [inviteModalOpen, setInviteModalOpen] = useToggle();

  const canInvite: boolean = !!(
    (ownerId === user.userId || privacy !== "INVITE_ONLY") &&
    user.isGuest === false
  );

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
          {unreadMessages > 0 && (
            <span className="unreadBadge">{unreadMessages}</span>
          )}
          {isHovered && canInvite && (
            <Button
              onClick={() => setInviteModalOpen()}
              variant="icon"
              otherStyles={inviteBtnStyles(theme, isActive)}
            >
              {<UserRoundPlus size={"1.25rem"} />}
            </Button>
          )}
        </div>
      </li>
      <InviteModal
        inviteModalOpen={inviteModalOpen}
        chatroomId={chatroomId}
        title={children}
        onClose={() => setInviteModalOpen(false)}
        user={user}
        canInvite={canInvite}
      />
    </>
  );
};

export default SidebarChatroomButton;
