import { css, useTheme } from "@emotion/react";
import { useState } from "react";
import Modal, { ModalCloseButton } from "../../Modal";
import { fieldStyles, formModalStyles } from "../../../styles/modalForm";
import { useFolderActions } from "../../../hooks/useFolders";

const formStyles = css({
  display: "flex",
  flexDirection: "column",
});

interface NewFolderModalProps {
  open: boolean;
  onClose: () => void;
  // moved into the new folder once it is created
  moveChatroom?: { chatroomId: string; title: string };
}

export const NewFolderModal = ({
  open,
  onClose,
  moveChatroom,
}: NewFolderModalProps) => {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const {
    createFolder,
    moveChatroom: moveToFolder,
    isCreating,
  } = useFolderActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const folder = await createFolder(trimmed);
      if (moveChatroom) moveToFolder(moveChatroom.chatroomId, folder.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Modal
      modalStyles={formModalStyles(theme, "400px")}
      open={open}
      onClose={onClose}
    >
      <form css={formStyles} onSubmit={handleSubmit}>
        <div className="header">
          <h2>New folder</h2>
          <p className="subtitle">
            Folders organize chatrooms in your sidebar.
            {moveChatroom && (
              <>
                {" "}
                <strong>{moveChatroom.title}</strong> will be moved into it.
              </>
            )}
          </p>
        </div>
        <div className="body">
          <div className="field">
            <label htmlFor="folderName">Name</label>
            <input
              id="folderName"
              css={fieldStyles(theme)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work"
              maxLength={30}
              autoComplete="off"
              autoFocus
              required
            />
            {error && <p className="errorText">{error}</p>}
          </div>
        </div>
        <div className="footer">
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
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create folder"}
            </button>
          </div>
        </div>
      </form>
      <ModalCloseButton onClose={onClose} label="Close new folder" />
    </Modal>
  );
};
