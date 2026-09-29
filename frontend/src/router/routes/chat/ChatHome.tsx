import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import Button from "../../../components/Button";
import { Loader2, Plus, SquarePen } from "lucide-react";
import { useAuthStore } from "../../../hooks/useStores";
import { mq } from "../../../styles/breakpoints";
import { PinnedChatroomsList } from "../../../components/chat-home/PinnedChatroomsList";
import { PinChatroomsModal } from "../../../components/chat-home/PinChatroomsModal";
import { NewPinGroupModal } from "../../../components/chat-home/NewPinGroupModal";
import { usePinnedGroups } from "../../../hooks/usePinnedGroups";
import { useState } from "react";

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
      // flex instead of the icon button's grid, whose rows stretch to fill
      // the square and push the icon and text apart
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      textAlign: "center",

      p: {
        margin: 0,
      },

      ".btn-icon": {
        flexShrink: 0,
        width: "2.25rem",
        height: "2.25rem",
      },
    },

    ".pinned-group": {
      width: "100%",
      padding: "4px",
    },

    ".emptyState": {
      maxWidth: "480px",
      padding: "24px 4px 12px",

      h3: {
        fontSize: "1.25rem",
        fontWeight: 600,
        marginBottom: "6px",
      },

      p: {
        fontSize: "0.95rem",
        lineHeight: 1.5,
      },
    },

    ".emptyGroup": {
      flex: 1,
      alignSelf: "center",
      padding: "8px",
      fontSize: "0.9rem",
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

      ".emptyState p, .emptyGroup": {
        color: theme.colors.light_grey,
      },
    }),
  );

const ChatHome = () => {
  const theme = useTheme();
  const isGuest = useAuthStore((state) => state.user.isGuest);
  const [openedPinGroupId, setOpenedPinGroupId] = useState<string | null>(null);
  const [newGroupOpen, setNewGroupOpen] = useState(false);

  const { data: pinnedGroups, isLoading, isError, error } = usePinnedGroups();

  const openedPinGroup =
    pinnedGroups?.find((group) => group.id === openedPinGroupId) || null;

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
        {pinnedGroups?.length === 0 && (
          <div className="emptyState">
            <h3>Nothing pinned yet</h3>
            <p>
              {isGuest
                ? "Sign up for an account to pin chatrooms here."
                : "Create a group, then pin chatrooms to it to see their latest messages here. You can also pin a chatroom from the pin button next to it in the sidebar."}
            </p>
          </div>
        )}
        <div className="pinned-groups">
          {pinnedGroups?.map((pinnedGroup) => (
            <div key={pinnedGroup.id} className="pinned-group">
              <div className="pinned-group-title-section">
                <h3 className="pinned-group-name">{pinnedGroup.name}</h3>
              </div>
              <div className="pinned-group-carousel">
                {pinnedGroup.chatrooms.length > 0 ? (
                  <PinnedChatroomsList pinnedGroup={pinnedGroup} />
                ) : (
                  <p className="emptyGroup">
                    No chatrooms in this group yet. Use "Edit group" to pin
                    some.
                  </p>
                )}
                <Button
                  className="pinned-chatroom edit-pinned-chatrooms-btn"
                  variant="icon"
                  onClick={() => setOpenedPinGroupId(pinnedGroup.id)}
                >
                  <SquarePen className="btn-icon" />
                  <p>Edit group</p>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!isGuest && (
          <Button
            className="pinned-chatroom edit-pinned-chatrooms-btn"
            variant="icon"
            onClick={() => setNewGroupOpen(true)}
          >
            <Plus className="btn-icon" />
            <p>New group</p>
          </Button>
        )}
        {openedPinGroup && (
          <PinChatroomsModal
            open={!!openedPinGroup}
            onClose={() => setOpenedPinGroupId(null)}
            pinnedGroup={openedPinGroup}
          />
        )}
        {newGroupOpen && (
          <NewPinGroupModal
            open={newGroupOpen}
            onClose={() => setNewGroupOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default ChatHome;
