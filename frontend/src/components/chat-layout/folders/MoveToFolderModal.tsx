import { css, useTheme, type Theme } from "@emotion/react";
import { Check, FolderPlus } from "lucide-react";
import { useState } from "react";
import Modal, { ModalCloseButton } from "../../Modal";
import { formModalStyles } from "../../../styles/modalForm";
import { useFolderActions, useFolders } from "../../../hooks/useFolders";
import { useChatroomsStore } from "../../../hooks/useStores";
import { NewFolderModal } from "./NewFolderModal";

const styles = (theme: Theme) =>
  css(formModalStyles(theme, "400px"), {
    ".header h2": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    ".optionRow": {
      justifyContent: "flex-start",
    },

    ".radio": {
      flex: "0 0 auto",
      width: "1.1rem",
      height: "1.1rem",
      display: "grid",
      placeItems: "center",
      borderRadius: "50%",
      border: `1px solid ${theme.colors.borderStrong}`,
      color: theme.colors.onAccent,
    },

    ".selected .radio": {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },

    ".optionName": {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    ".newFolderRow": {
      color: theme.colors.light_grey,
      "&:hover": { color: theme.colors.white },
    },
  });

interface MoveToFolderModalProps {
  open: boolean;
  onClose: () => void;
  chatroom: { chatroomId: string; title: string };
}

// Pick the one sidebar folder a chatroom lives in, or none (Chats)
export const MoveToFolderModal = ({
  open,
  onClose,
  chatroom,
}: MoveToFolderModalProps) => {
  const theme = useTheme();
  const { data: folders } = useFolders();
  const { moveChatroom, error } = useFolderActions();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const currentFolderId = useChatroomsStore(
    (state) =>
      state.chatrooms.find((c) => c.chatroomId === chatroom.chatroomId)
        ?.folderId ?? null,
  );

  const options = [
    { id: null, name: "No folder (Chats)" },
    ...(folders ?? []).map((folder) => ({ id: folder.id, name: folder.name })),
  ];

  return (
    <>
      <Modal modalStyles={styles(theme)} open={open} onClose={onClose}>
        <div className="header">
          <p className="eyebrow">Move to folder</p>
          <h2>{chatroom.title}</h2>
        </div>
        <div className="body">
          <div className="field">
            <p className="sectionLabel" id="folderOptionsLabel">
              Folder
            </p>
            <ul
              className="list"
              role="radiogroup"
              aria-labelledby="folderOptionsLabel"
            >
              {options.map((option) => {
                const selected = option.id === currentFolderId;
                return (
                  <li key={option.id ?? "none"}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`listRow optionRow${selected ? " selected" : ""}`}
                      onClick={() =>
                        moveChatroom(chatroom.chatroomId, option.id)
                      }
                    >
                      <span className="radio">
                        {selected && <Check size="0.75rem" strokeWidth={3} />}
                      </span>
                      <span className="optionName">{option.name}</span>
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  className="listRow optionRow newFolderRow"
                  onClick={() => setNewFolderOpen(true)}
                >
                  <FolderPlus size="1.1rem" />
                  New folder
                </button>
              </li>
            </ul>
            {error && <p className="errorText">{error.message}</p>}
          </div>
        </div>
        <div className="footer">
          <div className="footerEnd">
            <button type="button" className="btn btnPrimary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
        <ModalCloseButton onClose={onClose} label="Close move to folder" />
      </Modal>
      {newFolderOpen && (
        <NewFolderModal
          open={newFolderOpen}
          onClose={() => setNewFolderOpen(false)}
          moveChatroom={chatroom}
        />
      )}
    </>
  );
};
