import { useChatroomsStore } from "../../hooks/useStores";
import Modal, { ModalCloseButton } from "../Modal";
import Button from "../Button";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import type { PinnedGroup } from "../../types/REST-types/Chatroom";
import { usePinnedGroupActions } from "../../hooks/usePinnedGroups";
import { ConfirmModal } from "../ConfirmModal";
import { Check, Pin, PinOff, SquarePen, X } from "lucide-react";
import { useRef, useState } from "react";
import { fieldStyles, formModalStyles } from "../../styles/modalForm";

interface pinChatroomsModalProps {
  open: boolean;
  onClose: () => void;
  pinnedGroup: PinnedGroup;
}

const styles = (theme: Theme) =>
  css(formModalStyles(theme, "480px"), {
    ".titleRow": {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      minHeight: "2.25rem",

      h2: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },

      input: {
        flex: 1,
        minWidth: 0,
        fontSize: "1.1rem",
        fontWeight: 500,
      },
    },

    ".titleBtn": {
      flex: "0 0 auto",
      width: "2rem",
      height: "2rem",
      padding: "7px",
    },

    ".listRowTitle": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    ".listRowAction": {
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
  });

export const PinChatroomsModal = ({
  open,
  onClose,
  pinnedGroup,
}: pinChatroomsModalProps) => {
  const theme = useTheme();
  const [enableTitleEdit, setEnableTitleEdit] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const { setPinned, renameGroup, deleteGroup, error } =
    usePinnedGroupActions();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleChatroomPin = (
    chatroomId: string,
    chatroomTitle: string,
    pin: boolean,
  ) => {
    setPinned(pinnedGroup.id, { chatroomId, title: chatroomTitle }, pin);
  };

  const handleDeleteGroup = () => {
    setConfirmDeleteOpen(false);
    deleteGroup(pinnedGroup.id);
    onClose();
  };

  const pinnedSet = new Set(pinnedGroup.chatrooms.map((c) => c.chatroomId));

  const pinnedChatrooms = chatrooms.filter((c) => pinnedSet.has(c.chatroomId));
  const unpinnedChatrooms = chatrooms.filter(
    (c) => !pinnedSet.has(c.chatroomId),
  );

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const name = titleInputRef.current?.value.trim();
    if (name && name !== pinnedGroup.name) renameGroup(pinnedGroup.id, name);
    setEnableTitleEdit(false);
  };

  return (
    <Modal modalStyles={styles(theme)} open={open} onClose={onClose}>
      <div className="header">
        <p className="eyebrow">Group</p>
        {enableTitleEdit ? (
          <form className="titleRow" onSubmit={handleSaveName}>
            <input
              css={fieldStyles(theme)}
              type="text"
              placeholder={pinnedGroup.name}
              maxLength={30}
              defaultValue={pinnedGroup.name}
              ref={titleInputRef}
              aria-label="Pinned group name"
              autoFocus
            />
            <Button
              variant="icon"
              type="submit"
              className="titleBtn"
              aria-label="Save group name"
            >
              <Check />
            </Button>
            <Button
              variant="icon"
              type="button"
              className="titleBtn"
              aria-label="Cancel editing group name"
              onClick={() => setEnableTitleEdit(false)}
            >
              <X />
            </Button>
          </form>
        ) : (
          <div className="titleRow">
            <h2>{pinnedGroup.name}</h2>
            <Button
              variant="icon"
              type="button"
              className="titleBtn"
              aria-label="Edit pinned group name"
              onClick={() => setEnableTitleEdit(true)}
            >
              <SquarePen />
            </Button>
          </div>
        )}
      </div>

      <div className="body">
        <div className="field">
          <p className="sectionLabel">Pinned</p>
          <ul className="list">
            {pinnedChatrooms.length === 0 ? (
              <li className="listEmpty">
                No pinned chatrooms yet. Pin one from the list below.
              </li>
            ) : (
              pinnedChatrooms.map((chatroom) => (
                <li key={chatroom.chatroomId}>
                  <button
                    type="button"
                    className="listRow"
                    onClick={() =>
                      handleChatroomPin(
                        chatroom.chatroomId,
                        chatroom.chatroom.title,
                        false,
                      )
                    }
                  >
                    <span className="listRowTitle">
                      {chatroom.chatroom.title}
                    </span>
                    <span className="listRowAction">
                      <PinOff size="0.9rem" /> Unpin
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="field">
          <p className="sectionLabel">Your chatrooms</p>
          <ul className="list">
            {unpinnedChatrooms.length === 0 ? (
              <li className="listEmpty">All of your chatrooms are pinned.</li>
            ) : (
              unpinnedChatrooms.map((chatroom) => (
                <li key={chatroom.chatroomId}>
                  <button
                    type="button"
                    className="listRow"
                    onClick={() =>
                      handleChatroomPin(
                        chatroom.chatroomId,
                        chatroom.chatroom.title,
                        true,
                      )
                    }
                  >
                    <span className="listRowTitle">
                      {chatroom.chatroom.title}
                    </span>
                    <span className="listRowAction">
                      <Pin size="0.9rem" /> Pin
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          {error && <p className="errorText">{error.message}</p>}
        </div>
      </div>

      <div className="footer">
        <button
          type="button"
          className="btn btnDanger"
          onClick={() => setConfirmDeleteOpen(true)}
        >
          Delete group
        </button>
        <div className="footerEnd">
          <button type="button" className="btn btnPrimary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
      <ModalCloseButton onClose={onClose} label="Close pinned group" />
      {confirmDeleteOpen && (
        <ConfirmModal
          open={confirmDeleteOpen}
          title="Delete group?"
          confirmLabel="Delete group"
          danger
          onConfirm={handleDeleteGroup}
          onCancel={() => setConfirmDeleteOpen(false)}
        >
          <strong>{pinnedGroup.name}</strong> will be removed from your home
          page. Its chatrooms are only unpinned, not deleted or left.
        </ConfirmModal>
      )}
    </Modal>
  );
};
