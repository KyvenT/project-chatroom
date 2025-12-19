import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import Button from "../../../components/Button";
import { Pin, Plus, SquarePen } from "lucide-react";
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
import { useCallback, useEffect, useState } from "react";

const styles = css(
  mq({
    height: "100%",
    padding: "4px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    overflowY: "auto",

    ul: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },

    ".pinned-group-carousel": {
      width: "100%",
      height: "80%",
      display: "flex",
    },

    h6: {
      fontSize: "1rem",
      fontWeight: "300",
    },

    ".edit-pinned-chatrooms-btn": {
      fontSize: "1rem",
      textWrap: "wrap",
      width: ["33%", "10%"],
      aspectRatio: 1,

      ".btn-icon": {
        width: "2.25rem",
        height: "2.25rem",
      },
    },

    ".pinned-group": {
      width: "100%",
      padding: "4px",
    },

    ".pinned-groups": {
      display: "flex",
      flexDirection: "column",
      width: "100%",
    },

    ".title": {
      fontSize: "1.75rem",
      fontWeight: "500",
    },

    ".pinned-group-name": {
      fontWeight: "400",
      fontSize: "1.25rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    ".pinned-group-title-section": {
      display: "flex",
      alignItems: "center",
    },

    ".edit-title-btn": {
      minHeight: 0,
      aspectRatio: 1,
    },
  })
);

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,

    ".pinned-group": {
      color: theme.colors.white,
    },

    ".pinned-group:hover": {
      backgroundColor: theme.colors.black,
    },

    ".title": {
      color: theme.colors.white,
    },
  });

const ChatHome = () => {
  const theme = useTheme();
  const { user } = useAuthContext();
  const [openPinModal, setOpenPinModal] = useToggle(false);
  const [openedPinGroup, setOpenedPinGroup] = useState<PinnedGroup | null>(
    null
  );
  const [enableTitleEdit, setEnableTitleEdit] = useState<string>("");
  const [hoveredPinGroup, setHoveredPinGroup] = useState<string>("");
  const [pinnedGroups, setPinnedGroups] = useState<PinnedGroup[]>([]);

  const { data, refetch } = useQuery({
    queryKey: ["pinnedChatrooms", user.userId],
    queryFn: () =>
      verifiedQuery<PinnedGroup[]>({
        fetchUrl: "http://localhost:3000/api/pinned/me",
        user,
      }),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) setPinnedGroups(data);
  }, [data]);

  const { mutate } = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: verifiedMutation,
    onSuccess: () => refetch(),
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
  };

  const handleEditPinnedGroupName = (pinnedGroupId: string, name: string) => {
    mutate({
      fetchUrl: `http://localhost:3000/api/pinned/${pinnedGroupId}`,
      method: "PATCH",
      user,
      reqBody: {
        name,
      },
    });
    setPinnedGroups((prev) =>
      prev?.map((pinnedGroup) => {
        if (pinnedGroup.id === pinnedGroupId) {
          return { ...pinnedGroup, name };
        }
        return pinnedGroup;
      })
    );
  };

  const handleEditBtnClick = useCallback((pinnedGroup: PinnedGroup) => {
    setOpenedPinGroup(pinnedGroup);
    setOpenPinModal(true);
  }, []);

  return (
    <>
      <div css={[styles, colors(theme)]}>
        <h2 className="title">Pinned Chats</h2>
        <div className="pinned-groups">
          {pinnedGroups?.map((pinnedGroup) => (
            <div
              key={pinnedGroup.id}
              className="pinned-group"
              onMouseOver={() => setHoveredPinGroup(pinnedGroup.id)}
              onMouseLeave={() => setHoveredPinGroup("")}
            >
              <div className="pinned-group-title-section">
                {enableTitleEdit === pinnedGroup.id ? (
                  <input
                    type="text"
                    key={pinnedGroup.id}
                    placeholder={pinnedGroup.name}
                    maxLength={20}
                    defaultValue={pinnedGroup.name}
                  ></input>
                ) : (
                  <h3 className="pinned-group-name">{pinnedGroup.name}</h3>
                )}

                {hoveredPinGroup === pinnedGroup.id && (
                  <Button
                    variant="icon"
                    type="button"
                    onClick={() => {
                      setEnableTitleEdit((prev) =>
                        prev ? "" : pinnedGroup.id
                      );
                    }}
                    className="edit-title-btn"
                  >
                    <SquarePen size="1rem" />
                  </Button>
                )}
              </div>
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
        </div>

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
      </div>
    </>
  );
};

export default ChatHome;
