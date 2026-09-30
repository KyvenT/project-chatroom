import { css, useTheme, type Theme } from "@emotion/react";
import NewChatButton from "./NewChatroomBtnAndModal";
import { Link, useParams } from "react-router";
import type { Chatroom, SidebarFolder } from "../../types/REST-types/Chatroom";
import {
  Ellipsis,
  FolderPlus,
  HomeIcon,
  Search,
  Settings,
  X,
} from "lucide-react";
import Button, { iconBtnStyles } from "../Button";
import { useRef, useState } from "react";
import { matchesQuery, normalizeQuery } from "../../utils/search";
import { useAuthStore } from "../../hooks/useStores";
import { useFolderActions, useFolders } from "../../hooks/useFolders";
import { useCollapsedIds } from "../../hooks/useCollapsedIds";
import { SidebarSection } from "./SidebarSection";
import { NewFolderModal } from "./folders/NewFolderModal";
import { EditFolderModal } from "./folders/EditFolderModal";
import { mq } from "../../styles/breakpoints";

const sidebarStyles = (theme: Theme) =>
  css(
    mq({
      height: "100%",
      display: "flex",
      flexDirection: "column",
      flex: "0 0 auto",
      width: ["80%", "50%", "280px", "280px", "280px"],

      ".topSection": {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        height: "56px",
        padding: "0 12px",
        borderBottom: `1px solid ${theme.colors.border}`,
      },

      ".homeBtn": {
        padding: "0",
      },

      ".searchBar": {
        padding: "10px 10px 0",
      },

      ".searchField": {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        height: "2.1rem",
        padding: "0 4px 0 10px",
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.black,
        transition: "border-color 0.15s ease",

        "&:focus-within": {
          borderColor: theme.colors.accent,
        },

        input: {
          flex: 1,
          minWidth: 0,
          height: "100%",
          border: 0,
          outline: "none",
          background: "none",
          color: theme.colors.white,
          fontSize: "0.85rem",

          "&::placeholder": { color: theme.colors.light_grey },
          // the browser's own clear button; ours matches the theme
          "&::-webkit-search-cancel-button": { display: "none" },
        },
      },

      ".searchIcon": {
        flex: "0 0 auto",
        color: theme.colors.light_grey,
      },

      ".clearSearch": {
        flex: "0 0 auto",
        width: "1.6rem",
        height: "1.6rem",
        display: "grid",
        placeItems: "center",
        padding: 0,
        border: 0,
        borderRadius: theme.radius.sm,
        background: "none",
        color: theme.colors.light_grey,
        cursor: "pointer",

        "&:hover": {
          color: theme.colors.white,
          backgroundColor: theme.colors.grey,
        },
      },

      ".noResults": {
        padding: "12px 6px",
        fontSize: "0.85rem",
        color: theme.colors.light_grey,
        overflowWrap: "anywhere",
      },

      ".visuallyHidden": {
        position: "absolute",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
      },

      ".chatrooms": {
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "8px 10px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      },
    }),
  );

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    borderRight: `1px solid ${theme.colors.border}`,

    ".topSection a": {
      width: "2.25rem",
      height: "2.25rem",
    },

    ".chatrooms": {
      scrollbarColor: `transparent transparent`,
    },

    ".chatrooms:hover": {
      scrollbarColor: `${theme.colors.borderStrong} transparent`,
    },
  });

type SidebarProps = {
  chatrooms: Chatroom[] | undefined;
};

const CHATS_SECTION_ID = "chats";

const Sidebar = ({ chatrooms = [] }: SidebarProps) => {
  const theme = useTheme();
  const { chatroomId } = useParams();
  const isGuest = useAuthStore((state) => state.user.isGuest);
  const { data: folders = [] } = useFolders();
  const { moveChatroom } = useFolderActions();
  const { isCollapsed, toggleCollapsed } = useCollapsedIds(
    "collapsedSidebarSections",
  );
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [editedFolder, setEditedFolder] = useState<SidebarFolder | null>(null);

  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // a chatroom whose folder isn't known (e.g. just deleted) shows under Chats
  const folderIds = new Set(folders.map((folder) => folder.id));
  const inFolder = (folderId: string) =>
    chatrooms.filter((c) => c.folderId === folderId);
  const unfiled = chatrooms.filter(
    (c) => !c.folderId || !folderIds.has(c.folderId),
  );

  // Searching shows chatrooms whose title matches, and folders whose name
  // matches (with all their chatrooms) or that hold a matching chatroom.
  // Sections are expanded while searching so matches aren't hidden.
  const query = normalizeQuery(search);
  const searching = query !== "";
  const titleMatches = (c: Chatroom) => matchesQuery(c.chatroom.title, query);
  const shownFolders = folders
    .map((folder) => {
      const all = inFolder(folder.id);
      const nameMatches = matchesQuery(folder.name, query);
      return {
        folder,
        chatrooms: nameMatches ? all : all.filter(titleMatches),
        shown: nameMatches || all.some(titleMatches),
      };
    })
    .filter((f) => f.shown);
  const shownUnfiled = unfiled.filter(titleMatches);
  const resultCount =
    shownFolders.length +
    shownFolders.reduce((sum, f) => sum + f.chatrooms.length, 0) +
    shownUnfiled.length;
  const noResults =
    searching && shownFolders.length === 0 && shownUnfiled.length === 0;

  return (
    <div css={[sidebarStyles(theme), colors(theme)]}>
      <div className="topSection">
        <Link
          to="/chat"
          className="homeBtn"
          css={iconBtnStyles(theme)}
          aria-label="Home"
          title="Home"
        >
          <HomeIcon className="homeIcon" size="1.25rem" />
        </Link>
        <Link
          to="/settings"
          css={iconBtnStyles(theme)}
          aria-label="Settings"
          title="Settings"
        >
          <Settings size="1.25rem" />
        </Link>
      </div>
      <div className="searchBar">
        <div className="searchField">
          <Search className="searchIcon" size="0.95rem" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && search) {
                e.preventDefault();
                setSearch("");
              }
            }}
            placeholder="Search chats and folders"
            aria-label="Search chatrooms and folders"
            aria-controls="sidebar-chatrooms"
            autoComplete="off"
            spellCheck={false}
          />
          {search && (
            <button
              type="button"
              className="clearSearch"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                searchInputRef.current?.focus();
              }}
            >
              <X size="0.9rem" />
            </button>
          )}
        </div>
        <p className="visuallyHidden" role="status" aria-live="polite">
          {searching
            ? `${resultCount} result${resultCount === 1 ? "" : "s"}`
            : ""}
        </p>
      </div>
      <div className="chatrooms" id="sidebar-chatrooms">
        {noResults && (
          <p className="noResults">
            No chats or folders match “{search.trim()}”
          </p>
        )}
        {shownFolders.map(({ folder, chatrooms: folderChatrooms }) => (
          <SidebarSection
            key={folder.id}
            id={folder.id}
            title={folder.name}
            chatrooms={folderChatrooms}
            activeChatroomId={chatroomId}
            collapsed={!searching && isCollapsed(folder.id)}
            onToggle={() => !searching && toggleCollapsed(folder.id)}
            highlight={query}
            onDropChatroom={(id) => moveChatroom(id, folder.id)}
            emptyText="Drag chatrooms here"
            actionsOnHover
            actions={
              <Button
                variant="icon"
                aria-label={`Edit folder ${folder.name}`}
                title="Edit folder"
                onClick={() => setEditedFolder(folder)}
              >
                <Ellipsis size="1rem" />
              </Button>
            }
          />
        ))}
        {(!searching || shownUnfiled.length > 0) && (
          <SidebarSection
            id={CHATS_SECTION_ID}
            title="Chats"
            chatrooms={shownUnfiled}
            activeChatroomId={chatroomId}
            collapsed={!searching && isCollapsed(CHATS_SECTION_ID)}
            onToggle={() => !searching && toggleCollapsed(CHATS_SECTION_ID)}
            highlight={query}
            onDropChatroom={
              isGuest ? undefined : (id) => moveChatroom(id, null)
            }
            emptyText={
              chatrooms.length > 0
                ? "Every chatroom is in a folder"
                : "No chatrooms yet"
            }
            actions={
              <>
                {!isGuest && (
                  <Button
                    variant="icon"
                    aria-label="Create folder"
                    title="New folder"
                    onClick={() => setNewFolderOpen(true)}
                  >
                    <FolderPlus size="1rem" />
                  </Button>
                )}
                <NewChatButton />
              </>
            }
          />
        )}
      </div>
      {newFolderOpen && (
        <NewFolderModal
          open={newFolderOpen}
          onClose={() => setNewFolderOpen(false)}
        />
      )}
      {editedFolder && (
        <EditFolderModal
          open={!!editedFolder}
          onClose={() => setEditedFolder(null)}
          folder={editedFolder}
          chatroomCount={inFolder(editedFolder.id).length}
        />
      )}
    </div>
  );
};

export default Sidebar;
