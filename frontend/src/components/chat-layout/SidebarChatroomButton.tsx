import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import { NavLink } from "react-router";
import useToggle from "../../hooks/useToggle";
import Button from "../Button";
import { UserRoundPlus } from "lucide-react";
import { useAuthStore } from "../../hooks/useStores";
import { InviteModal } from "./InviteModal";
import type { Chatroom } from "../../types/REST-types/Chatroom";
import type React from "react";
import { useChatroomsStore } from "../../hooks/useStores";
import { useMutation } from "@tanstack/react-query";
import { customMutation } from "../../utils/customMutation";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import { useEffect } from "react";
import { API_URL } from "../../env";

interface SidebarChatroomButtonProps {
  isActive?: boolean;
  chatroom: Chatroom;
}

const styles = css({
  position: "relative",
  width: "100%",

  div: {
    width: "100%",
    padding: "0 8px 0 10px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    height: "2.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    transition: "background-color 0.12s ease",
  },

  ".chatroomLink": {
    flex: 1,
    textDecoration: "none",
    userSelect: "none",
    fontSize: "0.95rem",
    lineHeight: "2.25rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  ".unreadBadge": {
    minWidth: "1.25rem",
    height: "1.25rem",
    padding: "0 6px",
    borderRadius: "999px",
    fontSize: "0.7rem",
    fontWeight: 600,
    lineHeight: "1.25rem",
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
  isDraggedOver: boolean,
) =>
  css({
    div: {
      backgroundColor: isActive ? theme.colors.accentSoft : "transparent",
      borderColor: isDraggedOver ? theme.colors.accent : "transparent",
    },

    "div:hover": {
      backgroundColor: isActive ? theme.colors.accentSoft : theme.colors.grey,
    },

    ".chatroomLink": {
      color: isActive ? theme.colors.white : theme.colors.light_grey,
      fontWeight: isActive ? 600 : 400,
      "&:hover": {
        color: theme.colors.white,
        textDecoration: "none",
      },
    },

    ".unreadBadge": {
      backgroundColor: theme.colors.accent,
      color: theme.colors.onAccent,
    },
  });

const inviteBtnStyles = (theme: Theme) =>
  css({
    color: theme.colors.light_grey,
    aspectRatio: 1,
    height: "1.75rem",
    textAlign: "center",

    "&:hover": {
      color: theme.colors.white,
      backgroundColor: theme.colors.borderStrong,
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
  const user = useAuthStore((state) => state.user);

  const [isHovered, setHovered] = useToggle(false);
  const [inviteModalOpen, setInviteModalOpen] = useToggle(false);
  const [isDraggedOver, setIsDraggedOver] = useToggle(false);
  const swapChatroomOrder = useChatroomsStore(
    (state) => state.swapChatroomOrder,
  );
  const { mutate, isSuccess, isError } = useMutation({
    mutationFn: customMutation<ConfirmationResponse>,
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
      }),
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

    mutate({
      fetchUrl: `${API_URL}/api/chatrooms/reorder`,
      method: "PATCH",
      reqBody: {
        firstChatroomId: firstChatroom.chatroomId,
        secondChatroomId: chatroomId,
      },
    });

    handleDragOverEnd();
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
          {(isActive || isHovered) && canInvite && (
            <Button
              onClick={() => setInviteModalOpen()}
              variant="icon"
              otherStyles={inviteBtnStyles(theme)}
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
