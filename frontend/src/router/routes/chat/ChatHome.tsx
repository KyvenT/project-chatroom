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
import type { PinnedGroup } from "../../../types/REST-types/Chatroom";
import { useCollapsedIds } from "../../../hooks/useCollapsedIds";

const styles = (theme: Theme) =>
  css(
    mq({
      height: "100%",
      padding: ["16px 12px", "20px 24px"],
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      overflowY: "auto",
      backgroundColor: theme.colors.black,
      color: theme.colors.white,

      ".pinned-groups": {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
      },

      ".pinned-group": {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minWidth: 0,
      },

      ".pinned-group-title-section": {
        margin: 0,
        fontSize: "inherit",
        fontWeight: "inherit",
      },

      ".collapse-btn": {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        maxWidth: "100%",
        padding: "4px 10px 4px 4px",
        marginLeft: "-4px",
        border: 0,
        borderRadius: theme.radius.sm,
        backgroundColor: "transparent",
        color: "inherit",
        font: "inherit",
        cursor: "pointer",

        "&:hover": { backgroundColor: theme.colors.dark_grey },
        "&:focus-visible": {
          outline: `2px solid ${theme.colors.accent}`,
          outlineOffset: "2px",
        },
      },

      ".chevron": {
        flex: "0 0 auto",
        color: theme.colors.light_grey,
        transition: "transform 0.15s ease",
      },

      ".chevron.collapsed": {
        transform: "rotate(-90deg)",
      },

      ".pinned-group-name": {
        minWidth: 0,
        fontSize: "1.1rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },

      ".pinned-count": {
        flex: "0 0 auto",
        padding: "1px 8px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: theme.colors.light_grey,
        backgroundColor: theme.colors.grey,
      },

      ".pinned-group-carousel": {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      },

      ".edit-group-btn": {
        flex: "0 0 auto",
        width: "4.5rem",
        height: "4.5rem",
        // lines up with the cards, not the scrollbar space under them
        marginBottom: "8px",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        fontSize: "0.85rem",
        fontWeight: 500,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.dark_grey,

        "&:hover": {
          borderColor: theme.colors.borderStrong,
        },
      },

      ".emptyGroup": {
        flex: "0 1 480px",
        minHeight: "120px",
        display: "grid",
        placeItems: "center",
        padding: "16px",
        marginBottom: "8px",
        textAlign: "center",
        fontSize: "0.9rem",
        color: theme.colors.light_grey,
        border: `1px dashed ${theme.colors.borderStrong}`,
        borderRadius: theme.radius.lg,
      },

      ".new-group-btn": {
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 16px",
        fontSize: "0.9rem",
        fontWeight: 500,
        border: `1px dashed ${theme.colors.borderStrong}`,
        borderRadius: theme.radius.md,

        "&:hover": {
          color: theme.colors.white,
          borderColor: theme.colors.accent,
          backgroundColor: theme.colors.accentSoft,
        },
      },

      ".emptyState": {
        maxWidth: "480px",
        padding: "8px 0",

        h3: {
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "6px",
        },

        p: {
          fontSize: "0.95rem",
          lineHeight: 1.5,
          color: theme.colors.light_grey,
        },
      },

      ".syncNote": {
        fontSize: "0.85rem",
        color: theme.colors.light_grey,
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
    reorderGroup,
  } = useHomeGroups();
  const groupWord = synced ? "folder" : "group";

  const editButton = (pinnedGroup: PinnedGroup) => (
    <Button
      className="edit-group-btn"
      variant="icon"
      aria-label={`Edit ${groupWord} ${pinnedGroup.name}`}
      onClick={() => setOpenedPinGroupId(pinnedGroup.id)}
    >
      <SquarePen size="1.5rem" aria-hidden="true" />
      <span>Edit</span>
    </Button>
  );

  const openedPinGroup =
    pinnedGroups?.find((group) => group.id === openedPinGroupId) || null;

  if (isLoading) {
    return (
      <div css={styles(theme)}>
        <p>Loading...</p>
        <Loader2 />
      </div>
    );
  }

  if (isError) {
    return (
      <div css={styles(theme)}>
        <p>
          Failed to load {synced ? "folders" : "pinned groups"}:{" "}
          {error?.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <div css={styles(theme)}>
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
              {!isCollapsed(pinnedGroup.id) &&
                (pinnedGroup.chatrooms.length > 0 ? (
                  <PinnedChatroomsList
                    pinnedGroup={pinnedGroup}
                    id={`pinned-group-${pinnedGroup.id}`}
                    onReorder={(ids) => reorderGroup(pinnedGroup.id, ids)}
                  >
                    {editButton(pinnedGroup)}
                  </PinnedChatroomsList>
                ) : (
                  <div
                    className="pinned-group-carousel"
                    id={`pinned-group-${pinnedGroup.id}`}
                  >
                    <p className="emptyGroup">
                      No chatrooms in this {groupWord} yet. Use the edit button
                      to add some.
                    </p>
                    {editButton(pinnedGroup)}
                  </div>
                ))}
            </div>
          ))}
        </div>

        {!isGuest && (
          <Button
            className="new-group-btn"
            variant="icon"
            onClick={() => setNewGroupOpen(true)}
          >
            <Plus size="1.1rem" aria-hidden="true" />
            New {groupWord}
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
