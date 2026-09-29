import { css, useTheme } from "@emotion/react";
import { useState } from "react";
import Modal, { ModalCloseButton } from "../../Modal";
import { ConfirmModal } from "../../ConfirmModal";
import { fieldStyles, formModalStyles } from "../../../styles/modalForm";
import { useFolderActions } from "../../../hooks/useFolders";
import type { SidebarFolder } from "../../../types/REST-types/Chatroom";

const formStyles = css({
  display: "flex",
  flexDirection: "column",
});

interface EditFolderModalProps {
  open: boolean;
  onClose: () => void;
  folder: SidebarFolder;
  chatroomCount: number;
}

export const EditFolderModal = ({
  open,
  onClose,
  folder,
  chatroomCount,
}: EditFolderModalProps) => {
  const theme = useTheme();
  const [name, setName] = useState(folder.name);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { renameFolder, deleteFolder } = useFolderActions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== folder.name) renameFolder(folder.id, trimmed);
    onClose();
  };

  const handleDelete = () => {
    setConfirmDeleteOpen(false);
    deleteFolder(folder.id);
    onClose();
  };

  return (
    <Modal
      modalStyles={formModalStyles(theme, "400px")}
      open={open}
      onClose={onClose}
    >
      <form css={formStyles} onSubmit={handleSubmit}>
        <div className="header">
          <p className="eyebrow">Folder</p>
          <h2>Edit folder</h2>
        </div>
        <div className="body">
          <div className="field">
            <label htmlFor="editFolderName">Name</label>
            <input
              id="editFolderName"
              css={fieldStyles(theme)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoComplete="off"
              autoFocus
              required
            />
          </div>
        </div>
        <div className="footer">
          <button
            type="button"
            className="btn btnDanger"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Delete folder
          </button>
          <div className="footerEnd">
            <button
              type="button"
              className="btn btnSecondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btnPrimary"
              disabled={!name.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </form>
      <ModalCloseButton onClose={onClose} label="Close edit folder" />
      {confirmDeleteOpen && (
        <ConfirmModal
          open={confirmDeleteOpen}
          title="Delete folder?"
          confirmLabel="Delete folder"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        >
          <strong>{folder.name}</strong> will be removed from your sidebar.
          {chatroomCount > 0 &&
            ` Its ${chatroomCount === 1 ? "chatroom moves" : `${chatroomCount} chatrooms move`} back to Chats.`}
        </ConfirmModal>
      )}
    </Modal>
  );
};
