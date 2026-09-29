import { useChatroomsStore } from "../../hooks/useStores";
import Modal, { ModalCloseButton } from "../Modal";
import Button from "../Button";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import type { PinnedGroup } from "../../types/REST-types/Chatroom";
import { useHomeGroups } from "../../hooks/useHomeGroups";
import { useFolders } from "../../hooks/useFolders";
import { ConfirmModal } from "../ConfirmModal";
import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pin,
  PinOff,
  SquarePen,
  X,
} from "lucide-react";
import { useDragReorder } from "../../hooks/useDragReorder";
import { shiftId } from "../../utils/reorder";
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

    ".pinnedRow": {
      cursor: "grab",
      paddingLeft: "6px",

      "&.dragging": { opacity: 0.4 },
      // a line where the dragged chatroom will land
      "&.dropBefore": { boxShadow: `0 -2px 0 0 ${theme.colors.accent}` },
      "&.dropAfter": { boxShadow: `0 2px 0 0 ${theme.colors.accent}` },
    },

    ".grip": {
      flex: "0 0 auto",
      color: theme.colors.light_grey,
    },

    ".pinnedRow .listRowTitle": {
      flex: 1,
    },

    ".rowButtons": {
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      gap: "2px",
    },

    ".moveBtn": {
      width: "1.75rem",
      height: "1.75rem",
      padding: 0,

      "&:disabled": {
        opacity: 0.35,
        cursor: "default",
        backgroundColor: "transparent",
      },
    },

    ".unpinBtn": {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      marginLeft: "4px",
      padding: "4px 8px",
      fontSize: "0.8rem",
    },

    ".currentFolder": {
      marginRight: "6px",
      fontStyle: "italic",
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
  const {
    synced,
    setPinned,
    renameGroup,
    deleteGroup,
    reorderGroup,
    actionError: error,
  } = useHomeGroups();
  const { data: folders } = useFolders();
  const folderName = (folderId: string | null) =>
    folders?.find((f) => f.id === folderId)?.name;
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

  // in the group's own order, which can be changed by dragging
  const pinnedChatrooms = pinnedGroup.chatrooms;
  const pinnedIds = pinnedChatrooms.map((c) => c.chatroomId);
  const unpinnedChatrooms = chatrooms.filter(
    (c) => !pinnedSet.has(c.chatroomId),
  );

  const reorder = (ids: string[]) => reorderGroup(pinnedGroup.id, ids);
  const { itemProps, containerProps, itemState } = useDragReorder({
    ids: pinnedIds,
    axis: "y",
    onReorder: reorder,
  });

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const name = titleInputRef.current?.value.trim();
    if (name && name !== pinnedGroup.name) renameGroup(pinnedGroup.id, name);
    setEnableTitleEdit(false);
  };

  return (
    <Modal modalStyles={styles(theme)} open={open} onClose={onClose}>
      <div className="header">
        <p className="eyebrow">{synced ? "Folder" : "Group"}</p>
        {enableTitleEdit ? (
          <form className="titleRow" onSubmit={handleSaveName}>
            <input
              css={fieldStyles(theme)}
              type="text"
              placeholder={pinnedGroup.name}
              maxLength={30}
              defaultValue={pinnedGroup.name}
              ref={titleInputRef}
              aria-label={synced ? "Folder name" : "Pinned group name"}
              autoFocus
            />
            <Button
              variant="icon"
              type="submit"
              className="titleBtn"
              aria-label={synced ? "Save folder name" : "Save group name"}
            >
              <Check />
            </Button>
            <Button
              variant="icon"
              type="button"
              className="titleBtn"
              aria-label={
                synced
                  ? "Cancel editing folder name"
                  : "Cancel editing group name"
              }
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
              aria-label={
                synced ? "Edit folder name" : "Edit pinned group name"
              }
              onClick={() => setEnableTitleEdit(true)}
            >
              <SquarePen />
            </Button>
          </div>
        )}
      </div>

      <div className="body">
        {synced && (
          <p className="hint">
            Synced with your sidebar folders. A chatroom can be in one folder,
            so adding one here moves it out of its current folder.
          </p>
        )}
        <div className="field">
          <p className="sectionLabel">{synced ? "In this folder" : "Pinned"}</p>
          <ul className="list" {...containerProps}>
            {pinnedChatrooms.length === 0 ? (
              <li className="listEmpty">
                {synced
                  ? "No chatrooms in this folder yet. Add one from the list below."
                  : "No pinned chatrooms yet. Pin one from the list below."}
              </li>
            ) : (
              pinnedChatrooms.map((chatroom, i) => {
                const title = chatroom.chatroom.title;
                return (
                  <li
                    key={chatroom.chatroomId}
                    className={`listRow pinnedRow ${itemState(chatroom.chatroomId)}`}
                    {...itemProps(chatroom.chatroomId)}
                  >
                    <GripVertical
                      className="grip"
                      size="1rem"
                      aria-hidden="true"
                    />
                    <span className="listRowTitle">{title}</span>
                    <span className="rowButtons">
                      <Button
                        variant="icon"
                        type="button"
                        className="moveBtn"
                        aria-label={`Move ${title} up`}
                        disabled={i === 0}
                        onClick={() =>
                          reorder(shiftId(pinnedIds, chatroom.chatroomId, -1))
                        }
                      >
                        <ChevronUp size="1rem" />
                      </Button>
                      <Button
                        variant="icon"
                        type="button"
                        className="moveBtn"
                        aria-label={`Move ${title} down`}
                        disabled={i === pinnedChatrooms.length - 1}
                        onClick={() =>
                          reorder(shiftId(pinnedIds, chatroom.chatroomId, 1))
                        }
                      >
                        <ChevronDown size="1rem" />
                      </Button>
                      <button
                        type="button"
                        className="btn btnSecondary unpinBtn"
                        aria-label={`${synced ? "Remove" : "Unpin"} ${title}`}
                        onClick={() =>
                          handleChatroomPin(chatroom.chatroomId, title, false)
                        }
                      >
                        <PinOff size="0.85rem" aria-hidden="true" />
                        {synced ? "Remove" : "Unpin"}
                      </button>
                    </span>
                  </li>
                );
              })
            )}
          </ul>
          {pinnedChatrooms.length > 1 && (
            <p className="hint">Drag chatrooms to change their order.</p>
          )}
        </div>

        <div className="field">
          <p className="sectionLabel">Your chatrooms</p>
          <ul className="list">
            {unpinnedChatrooms.length === 0 ? (
              <li className="listEmpty">
                {synced
                  ? "All of your chatrooms are in this folder."
                  : "All of your chatrooms are pinned."}
              </li>
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
                      {synced && chatroom.folderId && (
                        <span className="currentFolder">
                          in {folderName(chatroom.folderId) ?? "a folder"}
                        </span>
                      )}
                      <Pin size="0.9rem" /> {synced ? "Add" : "Pin"}
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
          {synced ? "Delete folder" : "Delete group"}
        </button>
        <div className="footerEnd">
          <button type="button" className="btn btnPrimary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
      <ModalCloseButton
        onClose={onClose}
        label={synced ? "Close folder" : "Close pinned group"}
      />
      {confirmDeleteOpen && (
        <ConfirmModal
          open={confirmDeleteOpen}
          title={synced ? "Delete folder?" : "Delete group?"}
          confirmLabel={synced ? "Delete folder" : "Delete group"}
          danger
          onConfirm={handleDeleteGroup}
          onCancel={() => setConfirmDeleteOpen(false)}
        >
          {synced ? (
            <>
              <strong>{pinnedGroup.name}</strong> will be removed from your
              sidebar and home page. Its chatrooms move back to Chats.
            </>
          ) : (
            <>
              <strong>{pinnedGroup.name}</strong> will be removed from your home
              page. Its chatrooms are only unpinned, not deleted or left.
            </>
          )}
        </ConfirmModal>
      )}
    </Modal>
  );
};
