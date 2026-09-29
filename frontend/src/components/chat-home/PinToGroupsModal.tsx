import { css, useTheme, type Theme } from "@emotion/react";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import Modal, { ModalCloseButton } from "../Modal";
import { formModalStyles } from "../../styles/modalForm";
import {
  usePinnedGroupActions,
  usePinnedGroups,
} from "../../hooks/usePinnedGroups";
import { NewPinGroupModal } from "./NewPinGroupModal";
import { Loader } from "../Loader";

const styles = (theme: Theme) =>
  css(formModalStyles(theme, "400px"), {
    ".header h2": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    ".groupRow": {
      justifyContent: "flex-start",
    },

    ".checkbox": {
      flex: "0 0 auto",
      width: "1.1rem",
      height: "1.1rem",
      display: "grid",
      placeItems: "center",
      borderRadius: "4px",
      border: `1px solid ${theme.colors.borderStrong}`,
      color: theme.colors.onAccent,
    },

    ".checked .checkbox": {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },

    ".groupName": {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    ".newGroupRow": {
      color: theme.colors.light_grey,
      "&:hover": { color: theme.colors.white },
    },
  });

interface PinToGroupsModalProps {
  open: boolean;
  onClose: () => void;
  chatroom: { chatroomId: string; title: string };
}

// Choose which pinned groups a chatroom appears in
export const PinToGroupsModal = ({
  open,
  onClose,
  chatroom,
}: PinToGroupsModalProps) => {
  const theme = useTheme();
  const { data: groups, isLoading } = usePinnedGroups();
  const { setPinned, error } = usePinnedGroupActions();
  const [newGroupOpen, setNewGroupOpen] = useState(false);

  return (
    <>
      <Modal modalStyles={styles(theme)} open={open} onClose={onClose}>
        <div className="header">
          <p className="eyebrow">Pin chatroom</p>
          <h2>{chatroom.title}</h2>
          <p className="subtitle">
            Pinned chatrooms show their latest messages on your home page.
          </p>
        </div>
        <div className="body">
          <div className="field">
            <p className="sectionLabel">Your groups</p>
            <ul className="list">
              {isLoading && (
                <li className="listEmpty">
                  <Loader />
                </li>
              )}
              {groups?.length === 0 && (
                <li className="listEmpty">
                  You don't have any groups yet. Create one to pin this
                  chatroom.
                </li>
              )}
              {groups?.map((group) => {
                const isPinned = group.chatrooms.some(
                  (c) => c.chatroomId === chatroom.chatroomId,
                );
                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isPinned}
                      className={`listRow groupRow${isPinned ? " checked" : ""}`}
                      onClick={() => setPinned(group.id, chatroom, !isPinned)}
                    >
                      <span className="checkbox">
                        {isPinned && <Check size="0.8rem" strokeWidth={3} />}
                      </span>
                      <span className="groupName">{group.name}</span>
                      <span className="listRowAction">
                        {group.chatrooms.length} pinned
                      </span>
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  className="listRow groupRow newGroupRow"
                  onClick={() => setNewGroupOpen(true)}
                >
                  <Plus size="1.1rem" />
                  New group
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
        <ModalCloseButton onClose={onClose} label="Close pin chatroom" />
      </Modal>
      {newGroupOpen && (
        <NewPinGroupModal
          open={newGroupOpen}
          onClose={() => setNewGroupOpen(false)}
          pinChatroom={chatroom}
        />
      )}
    </>
  );
};
