import { css, useTheme } from "@emotion/react";
import { useState } from "react";
import Modal, { ModalCloseButton } from "../Modal";
import { fieldStyles, formModalStyles } from "../../styles/modalForm";
import { usePinnedGroupActions } from "../../hooks/usePinnedGroups";

const formStyles = css({
  display: "flex",
  flexDirection: "column",
});

interface NewPinGroupModalProps {
  open: boolean;
  onClose: () => void;
  // pinned into the new group once it is created
  pinChatroom?: { chatroomId: string; title: string };
}

export const NewPinGroupModal = ({
  open,
  onClose,
  pinChatroom,
}: NewPinGroupModalProps) => {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { createGroup, setPinned, isCreating } = usePinnedGroupActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const group = await createGroup(trimmed);
      if (pinChatroom) setPinned(group.id, pinChatroom, true);
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
          <h2>New group</h2>
          <p className="subtitle">
            {pinChatroom ? (
              <>
                Groups keep pinned chatrooms together on your home page.{" "}
                <strong>{pinChatroom.title}</strong> will be pinned to it.
              </>
            ) : (
              "Groups keep pinned chatrooms together on your home page."
            )}
          </p>
        </div>
        <div className="body">
          <div className="field">
            <label htmlFor="pinGroupName">Name</label>
            <input
              id="pinGroupName"
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
              {isCreating ? "Creating..." : "Create group"}
            </button>
          </div>
        </div>
      </form>
      <ModalCloseButton onClose={onClose} label="Close new group" />
    </Modal>
  );
};
