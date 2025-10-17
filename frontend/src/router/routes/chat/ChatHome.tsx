import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import { useChatroomsStore } from "../../../hooks/useStores";
import Button from "../../../components/Button";
import { Pin, Plus } from "lucide-react";
import {
  verifiedMutation,
  type MutationArgs,
} from "../../../hooks/useCustomMutation";
import { useMutation, useQuery } from "@tanstack/react-query";
import useAuthContext from "../../../hooks/useAuthContext";
import { type PinnedGroup } from "../../../types/REST-types/Chatroom";
import { verifiedQuery } from "../../../hooks/useCustomQuery";
import { mq } from "../../../styles/breakpoints";
import { PinnedChatroomsList } from "../../../components/chat-home/pinnedChatroomsList";
import useToggle from "../../../hooks/useToggle";
import { PinChatroomsModal } from "../../../components/chat-home/pinChatroomsModal";
import type { ConfirmationResponse } from "../../../types/REST-types/Invite";
import { useEffect, useState } from "react";

const styles = css(
  mq({
    height: "100%",
    padding: "4px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",

    ".pinned-chatroom": {
      padding: "8px",
      borderRadius: "8px",
      width: ["50%", "33%", "25%", "15%", "12.5%"],
      cursor: "pointer",
      aspectRatio: 1,

      div: {
        width: "100%",
      },
    },

    ul: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },

    ".pinned-group-carousel": {
      display: "flex",
      gap: "10px",
      overflowX: "auto",
    },

    h6: {
      fontSize: "1rem",
      fontWeight: "300",
    },

    ".edit-pinned-chatrooms-btn": {
      fontSize: "1rem",
      textWrap: "wrap",
      width: ["50%", "10%"],

      ".btn-icon": {
        width: "2.25rem",
        height: "2.25rem",
      },
    },

    ".pinned-group": {
      padding: "4px",
    },

    ".title": {
      fontSize: "1.75rem",
      fontWeight: "500",
    },

    ".pinned-group-name": {
      fontWeight: "400",
      fontSize: "1.25rem",
    },
  }),
);

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,

    ".pinned-chatroom": {
      color: theme.colors.white,
      border: `1px solid ${theme.colors.dark_grey}`,
      backgroundColor: theme.colors.grey,
    },

    ".pinned-chatroom:hover": {
      borderColor: theme.colors.white,
    },

    ".pinned-group": {
      color: theme.colors.white,
    },

    ".pinned-group:hover": {
      backgroundColor: theme.colors.dark_grey,
    },

    ".title": {
      color: theme.colors.white,
    },
  });

const ChatHome = () => {
  const theme = useTheme();
  const { user, isLoggedIn } = useAuthContext();
  const [openPinModal, setOpenPinModal] = useToggle(false);
  const [openedPinGroup, setOpenedPinGroup] = useState<PinnedGroup | null>(
    null,
  );
  // TODO: add pinned/favourite chatrooms in backend,
  // add table with userId and chatroomIds
  // also add special case value for active chatroom when at ChatHome
  // to receive messages for all pinned chatrooms

  const { data: pinnedGroups, refetch } = useQuery({
    queryKey: ["pinnedChatrooms", !!isLoggedIn],
    queryFn: () =>
      verifiedQuery<PinnedGroup[]>({
        fetchUrl: "http://localhost:3000/api/pinned/me",
        user,
      }),
    staleTime: Infinity,
  });

  const { data, mutate } = useMutation<
    ConfirmationResponse,
    Error,
    MutationArgs
  >({
    mutationFn: verifiedMutation,
  });

  useEffect(() => {
    if (!openPinModal) setOpenedPinGroup(null);
  }, [openPinModal]);

  const handleAddPinnedGroupClick = () => {
    mutate({
      fetchUrl: "http://localhost:3000/api/pinned",
      method: "POST",
      user,
    });
    refetch();
  };

  const handleEditBtnClick = (pinnedGroup: PinnedGroup) => {
    setOpenedPinGroup(pinnedGroup);
    setOpenPinModal(true);
  };

  return (
    <>
      <div css={[styles, colors(theme)]}>
        <h2 className="title">Pinned Chatroom Groups</h2>
        {pinnedGroups?.map((pinnedGroup) => (
          <div key={pinnedGroup.id} className="pinned-group">
            <h3 className="pinned-group-name">{pinnedGroup.name}</h3>
            <div className="pinned-group-carousel">
              <PinnedChatroomsList pinnedGroup={pinnedGroup} />
              <Button
                className="pinned-chatroom edit-pinned-chatrooms-btn"
                variant="icon"
                onClick={() => handleEditBtnClick(pinnedGroup)}
              >
                <Pin className="btn-icon" />
                <p>Edit pinned chatrooms</p>
              </Button>
            </div>
          </div>
        ))}

        <Button
          className="pinned-chatroom edit-pinned-chatrooms-btn"
          variant="icon"
          onClick={handleAddPinnedGroupClick}
        >
          <Plus className="btn-icon" />
          Add new chatroom group
        </Button>
        {openPinModal && openedPinGroup && (
          <PinChatroomsModal
            open={openPinModal}
            onClose={() => setOpenPinModal(false)}
            pinnedGroup={openedPinGroup}
          />
        )}

        <li className="pinned-chatroom">
          <div>
            <h4>Sample Chatroom</h4>
            <ul>
              <li>
                <p>Message 1</p>
                <p>Message 2</p>
                <p>Message 3</p>
                <p>Message 4</p>
                <p>Message 5</p>
              </li>
            </ul>
          </div>
        </li>
      </div>
    </>
  );
};

export default ChatHome;
