import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import Button from "../../../components/Button";
import { Loader2, Pin, Plus } from "lucide-react";
import {
  customMutation,
  type MutationArgs,
} from "../../../utils/customMutation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../hooks/useStores";
import { type PinnedGroup } from "../../../types/REST-types/Chatroom";
import { customQuery } from "../../../utils/customQuery";
import { mq } from "../../../styles/breakpoints";
import { PinnedChatroomsList } from "../../../components/chat-home/pinnedChatroomsList";
import { PinChatroomsModal } from "../../../components/chat-home/pinChatroomsModal";
import type { ConfirmationResponse } from "../../../types/REST-types/Invite";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../../env";

const styles = css(
  mq({
    height: "100%",
    padding: "4px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    overflowY: "scroll",

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
      height: "auto",
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
      display: "inline",
      fontWeight: "400",
      fontSize: "1.25rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    ".edit-title-btn": {
      display: "inline",
      minHeight: 0,
      aspectRatio: 1,
      padding: "auto 4px",
    },
  }),
);

const colors = (theme: Theme) =>
  css(
    mq({
      backgroundColor: theme.colors.black,
      color: theme.colors.white,
      scrollbarColor: `transparent transparent`,
      "&:hover": {
        scrollbarColor: `${theme.colors.white} transparent`,
      },

      ".pinned-group": {
        color: theme.colors.white,
      },

      ".pinned-group:hover": {
        backgroundColor: theme.colors.black,
      },

      ".title": {
        color: theme.colors.white,
      },
    }),
  );

const ChatHome = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const [openedPinGroupId, setOpenedPinGroupId] = useState<string | null>(null);
  const [pinnedGroups, setPinnedGroups] = useState<PinnedGroup[]>([]);

  const { data, refetch, isLoading, isError, error } = useQuery({
    queryKey: ["pinnedChatrooms", user.userId],
    queryFn: () =>
      customQuery<PinnedGroup[]>({
        fetchUrl: `${API_URL}/api/pinned/me`,
      }),
    enabled: !!user.token,
    staleTime: 0,
  });

  useEffect(() => {
    if (data) setPinnedGroups(data);
  }, [data]);

  const { mutate } = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: customMutation,
    onSuccess: () => refetch(),
  });

  const handleAddPinnedGroupClick: () => void = () => {
    mutate({
      fetchUrl: `${API_URL}/api/pinned`,
      method: "POST",
    });
  };

  const handleEditBtnClick = useCallback((pinnedGroupId: string) => {
    setOpenedPinGroupId(pinnedGroupId);
  }, []);

  const openedPinGroup =
    pinnedGroups.find((group) => group.id === openedPinGroupId) || null;

  if (isLoading) {
    return (
      <div css={[styles, colors(theme)]}>
        <p>Loading...</p>
        <Loader2 />
      </div>
    );
  }

  if (isError) {
    return (
      <div css={[styles, colors(theme)]}>
        <p>Failed to load pinned groups: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div css={[styles, colors(theme)]}>
        <div className="pinned-groups">
          {pinnedGroups?.map((pinnedGroup) => (
            <div key={pinnedGroup.id} className="pinned-group">
              <div className="pinned-group-title-section">
                <h3 className="pinned-group-name">{pinnedGroup.name}</h3>
              </div>
              <div className="pinned-group-carousel">
                <PinnedChatroomsList pinnedGroup={pinnedGroup} />
                <Button
                  className="pinned-chatroom edit-pinned-chatrooms-btn"
                  variant="icon"
                  onClick={() => handleEditBtnClick(pinnedGroup.id)}
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
        {openedPinGroupId && openedPinGroup && (
          <PinChatroomsModal
            open={openedPinGroupId !== null}
            onClose={() => setOpenedPinGroupId(null)}
            pinnedGroup={openedPinGroup}
            setPinnedGroups={setPinnedGroups}
          />
        )}
      </div>
    </>
  );
};

export default ChatHome;
