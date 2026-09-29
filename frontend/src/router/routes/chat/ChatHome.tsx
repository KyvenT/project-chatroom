import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import Button from "../../../components/Button";
import { ChevronDown, Loader2, Plus, SquarePen } from "lucide-react";
import { useAuthStore } from "../../../hooks/useStores";
import { mq } from "../../../styles/breakpoints";
import { PinnedChatroomsList } from "../../../components/chat-home/PinnedChatroomsList";
import { PinChatroomsModal } from "../../../components/chat-home/PinChatroomsModal";
import { NewPinGroupModal } from "../../../components/chat-home/NewPinGroupModal";
import { useHomeGroups } from "../../../hooks/useHomeGroups";
import { NewFolderModal } from "../../../components/chat-layout/folders/NewFolderModal";
import { Link } from "react-router";
import { useState } from "react";
import { useCollapsedIds } from "../../../hooks/useCollapsedIds";

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

    ".syncNote": {
      padding: "4px",
      fontSize: "0.85rem",
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

    ".collapse-btn": {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      maxWidth: "100%",
      padding: "4px 8px 4px 4px",
      border: 0,
      borderRadius: "6px",
      backgroundColor: "transparent",
      color: "inherit",
      font: "inherit",
      cursor: "pointer",
    },

    ".chevron": {
      flex: "0 0 auto",
      transition: "transform 0.15s ease",
    },

    ".chevron.collapsed": {
      transform: "rotate(-90deg)",
    },

    ".pinned-count": {
      flex: "0 0 auto",
      fontSize: "0.75rem",
      fontWeight: 600,
      padding: "1px 7px",
      borderRadius: "999px",
    },

    ".pinned-group-title-section": {
      margin: 0,
      fontSize: "inherit",
      fontWeight: "inherit",
    },

    ".pinned-group-name": {
      minWidth: 0,
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

      ".emptyState p, .emptyGroup, .syncNote": {
        color: theme.colors.light_grey,
      },

      ".collapse-btn": {
        "&:hover": {
          backgroundColor: theme.colors.grey,
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.colors.accent}`,
          outlineOffset: "2px",
        },
      },

      ".chevron, .pinned-count": {
        color: theme.colors.light_grey,
      },

      ".pinned-count": {
        backgroundColor: theme.colors.grey,
      },
    }),
  );

const ChatHome = () => {
  const theme = useTheme();
  const isGuest = useAuthStore((state) => state.user.isGuest);
  const [openedPinGroupId, setOpenedPinGroupId] = useState<string | null>(null);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const { isCollapsed, toggleCollapsed } =
    useCollapsedIds("collapsedPinGroups");

  const {
    synced,
    groups: pinnedGroups,
    isLoading,
    isError,
    error,
  } = useHomeGroups();
  const groupWord = synced ? "folder" : "group";

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
        <p>
          Failed to load {synced ? "folders" : "pinned groups"}:{" "}
          {error?.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <div css={[styles, colors(theme)]}>
        {synced && (
          <p className="syncNote">
            Showing your sidebar folders.{" "}
            <Link to="/settings">Change in settings</Link>
          </p>
        )}
        {pinnedGroups?.length === 0 && (
          <div className="emptyState">
            <h3>{synced ? "No folders yet" : "Nothing pinned yet"}</h3>
            <p>
              {isGuest
                ? "Sign up for an account to pin chatrooms here."
                : synced
                  ? "Create a folder to see the latest messages of its chatrooms here. Folders you make here also appear in the sidebar."
                  : "Create a group, then pin chatrooms to it to see their latest messages here. You can also pin a chatroom from the pin button next to it in the sidebar."}
            </p>
          </div>
        )}
        <div className="pinned-groups">
          {pinnedGroups?.map((pinnedGroup) => (
            <div key={pinnedGroup.id} className="pinned-group">
              <h3 className="pinned-group-title-section">
                <button
                  type="button"
                  className="collapse-btn"
                  aria-expanded={!isCollapsed(pinnedGroup.id)}
                  aria-controls={`pinned-group-${pinnedGroup.id}`}
                  onClick={() => toggleCollapsed(pinnedGroup.id)}
                >
                  <ChevronDown
                    className={
                      isCollapsed(pinnedGroup.id)
                        ? "chevron collapsed"
                        : "chevron"
                    }
                    size="1.25rem"
                    aria-hidden="true"
                  />
                  <span className="pinned-group-name">{pinnedGroup.name}</span>
                  <span
                    className="pinned-count"
                    aria-label={`${pinnedGroup.chatrooms.length} ${synced ? "chatrooms" : "pinned"}`}
                  >
                    {pinnedGroup.chatrooms.length}
                  </span>
                </button>
              </h3>
              {!isCollapsed(pinnedGroup.id) && (
                <div
                  className="pinned-group-carousel"
                  id={`pinned-group-${pinnedGroup.id}`}
                >
                  {pinnedGroup.chatrooms.length > 0 ? (
                    <PinnedChatroomsList pinnedGroup={pinnedGroup} />
                  ) : (
                    <p className="emptyGroup">
                      No chatrooms in this {groupWord} yet. Use "Edit{" "}
                      {groupWord}" to add some.
                    </p>
                  )}
                  <Button
                    className="pinned-chatroom edit-pinned-chatrooms-btn"
                    variant="icon"
                    onClick={() => setOpenedPinGroupId(pinnedGroup.id)}
                  >
                    <SquarePen className="btn-icon" />
                    <p>Edit {groupWord}</p>
                  </Button>
                </div>
              )}
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
            <p>New {groupWord}</p>
          </Button>
        )}
        {openedPinGroup && (
          <PinChatroomsModal
            open={!!openedPinGroup}
            onClose={() => setOpenedPinGroupId(null)}
            pinnedGroup={openedPinGroup}
          />
        )}
        {newGroupOpen &&
          (synced ? (
            <NewFolderModal
              open={newGroupOpen}
              onClose={() => setNewGroupOpen(false)}
            />
          ) : (
            <NewPinGroupModal
              open={newGroupOpen}
              onClose={() => setNewGroupOpen(false)}
            />
          ))}
      </div>
    </>
  );
};

export default ChatHome;
