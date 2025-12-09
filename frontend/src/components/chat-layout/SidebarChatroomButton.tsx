import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import { NavLink } from "react-router";
import useToggle from "../../hooks/useToggle";
import Button from "../Button";
import { UserRoundPlus } from "lucide-react";
import useAuthContext from "../../hooks/useAuthContext";
import { InviteModal } from "./InviteModal";
import type { Chatroom } from "../../types/REST-types/Chatroom";
import type React from "react";
import { useChatroomsStore } from "../../hooks/useStores";
import { useMutation } from "@tanstack/react-query";
import { verifiedMutation } from "../../hooks/useCustomMutation";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import { useEffect } from "react";

interface SidebarChatroomButtonProps {
  isActive?: boolean;
  chatroom: Chatroom;
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
    fontSize: "1.25rem",
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

const dynamicStyles = (
  theme: Theme,
  isActive: boolean,
  isDraggedOver: boolean
) =>
  css({
    div: {
      backgroundColor: isActive ? theme.colors.white : "inherit",
      borderColor: isDraggedOver
        ? "green"
        : isActive
        ? theme.colors.white
        : "transparent",
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
  chatroom,
}: SidebarChatroomButtonProps) => {
  const {
    chatroomId,
    chatroomIndex,
    unreadMessages,
    chatroom: { ownerId, privacy, title },
  } = chatroom;
  const theme = useTheme();
  const { user } = useAuthContext();
  const [isHovered, setHovered] = useToggle(false);
  const [inviteModalOpen, setInviteModalOpen] = useToggle(false);
  const [isDraggedOver, setIsDraggedOver] = useToggle(false);
  const swapChatroomOrder = useChatroomsStore(
    (state) => state.swapChatroomOrder
  );
  const { mutate, isSuccess, isError } = useMutation({
    mutationFn: verifiedMutation<ConfirmationResponse>,
    onSuccess: () => console.log("chatrooms swapped"),
    onError: () => console.log("chatroom swap error"),
  });

  const canInvite: boolean = !!(
    (ownerId === user.userId || privacy !== "INVITE_ONLY") &&
    user.isGuest === false
  );

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        firstChatroom: chatroom,
      })
    );
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggedOver(true);
  };

  const handleDragOverEnd = () => {
    setIsDraggedOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    const data = event.dataTransfer.getData("application/json");
    const { firstChatroom } = JSON.parse(data);
    console.log("origin chatroom:", firstChatroom.chatroomId);
    console.log("target chatroom:", chatroomId, " ", chatroomIndex);

    // do swap update here
    swapChatroomOrder(firstChatroom, chatroom);
    /*
    mutate({
      fetchUrl: "http://localhost:3000/api/chatrooms/reorder",
      user,
      method: "PATCH",
      reqBody: {
        firstChatroomId: firstChatroom.chatroomId,
        secondChatroomId: chatroomId,
      },
    });
    */
  };

  useEffect(() => {
    if (isSuccess) console.log("swapped");
  }, [isSuccess]);

  useEffect(() => {
    if (isError) console.log("swap error");
  }, [isError]);

  return (
    <>
      <li
        css={[styles, dynamicStyles(theme, isActive, isDraggedOver)]}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragOverEnd}
        onDrop={handleDrop}
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <NavLink className="chatroomLink" to={"/chat/" + chatroomId}>
            {title}
          </NavLink>
          {unreadMessages > 0 && (
            <span className="unreadBadge">{unreadMessages}</span>
          )}
          {isHovered && canInvite && (
            <Button
              onClick={() => setInviteModalOpen()}
              variant="icon"
              otherStyles={inviteBtnStyles(theme, isActive)}
              aria-label="Open member invite modal"
            >
              {<UserRoundPlus size="1.25rem" />}
            </Button>
          )}
        </div>
      </li>
      {inviteModalOpen && (
        <InviteModal
          inviteModalOpen={inviteModalOpen}
          chatroomId={chatroomId}
          title={title}
          onClose={() => setInviteModalOpen(false)}
          user={user}
          canInvite={canInvite}
        />
      )}
    </>
  );
};

export default SidebarChatroomButton;
