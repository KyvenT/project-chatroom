import { css, useTheme, type Theme } from "@emotion/react";
import NewChatButton from "./NewChatroomBtnAndModal";
import { Link, useParams } from "react-router";
import type { Chatroom, SidebarFolder } from "../../types/REST-types/Chatroom";
import { Ellipsis, FolderPlus, HomeIcon, Settings } from "lucide-react";
import Button, { iconBtnStyles } from "../Button";
import { useState } from "react";
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

  // a chatroom whose folder isn't known (e.g. just deleted) shows under Chats
  const folderIds = new Set(folders.map((folder) => folder.id));
  const inFolder = (folderId: string) =>
    chatrooms.filter((c) => c.folderId === folderId);
  const unfiled = chatrooms.filter(
    (c) => !c.folderId || !folderIds.has(c.folderId),
  );

  return (
    <div css={[sidebarStyles(theme), colors(theme)]}>
      <div className="topSection">
        <Link to="/chat" className="homeBtn" css={iconBtnStyles(theme)}>
          <HomeIcon className="homeIcon" size="1.25rem" />
        </Link>
        <Link to="/settings" css={iconBtnStyles(theme)}>
          <Settings size="1.25rem" />
        </Link>
      </div>
      <div className="chatrooms">
        {folders.map((folder) => (
          <SidebarSection
            key={folder.id}
            id={folder.id}
            title={folder.name}
            chatrooms={inFolder(folder.id)}
            activeChatroomId={chatroomId}
            collapsed={isCollapsed(folder.id)}
            onToggle={() => toggleCollapsed(folder.id)}
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
        <SidebarSection
          id={CHATS_SECTION_ID}
          title="Chats"
          chatrooms={unfiled}
          activeChatroomId={chatroomId}
          collapsed={isCollapsed(CHATS_SECTION_ID)}
          onToggle={() => toggleCollapsed(CHATS_SECTION_ID)}
          onDropChatroom={isGuest ? undefined : (id) => moveChatroom(id, null)}
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
