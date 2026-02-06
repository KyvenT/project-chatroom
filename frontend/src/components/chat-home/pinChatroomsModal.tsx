import { useMutation } from "@tanstack/react-query";
import { useChatroomsStore } from "../../hooks/useStores";
import Modal, { closeButtonStyles } from "../Modal";
import {
  verifiedMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import type { PinnedGroup } from "../../types/REST-types/Chatroom";
import useAuthContext from "../../hooks/useAuthContext";
import { API_URL } from "../../env";
import { Check, Pencil, X } from "lucide-react";
import { useRef, useState } from "react";

interface pinChatroomsModalProps {
  open: boolean;
  onClose: () => void;
  pinnedGroup: PinnedGroup;
  setPinnedGroups: React.Dispatch<React.SetStateAction<PinnedGroup[]>>;
}

const styles = (theme: Theme) =>
  css({
    gap: "10px",
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    border: `1px solid ${theme.colors.light_grey}`,
    borderRadius: "8px",
    padding: "30px",

    ul: {
      listStyle: "none",
      padding: 0,
    },

    ".title-section": {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minWidth: "300px",

      h3: {
        fontSize: "1.5rem",
        margin: 0,
        fontWeight: 400,
      },

      ".edit-title-section": {
        display: "flex",
        alignItems: "center",
        gap: "8px",
      },

      ".edit-title-btn": {
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
      },

      ".edit-title-btn:hover": {
        opacity: 0.7,
      },

      ".btn-icon": {
        width: "1.25rem",
        height: "1.25rem",
        color: theme.colors.white,
        cursor: "pointer",
      },

      input: {
        fontSize: "1.5rem",
        fontWeight: 400,
        backgroundColor: theme.colors.grey,
        color: theme.colors.white,
        border: `1px solid ${theme.colors.white}`,
        borderRadius: "4px",
        padding: "4px",
      },
    },
  });

export const PinChatroomsModal = ({
  open,
  onClose,
  pinnedGroup,
  setPinnedGroups,
}: pinChatroomsModalProps) => {
  const theme = useTheme();
  const { user } = useAuthContext();
  const [enableTitleEdit, setEnableTitleEdit] = useState<boolean>(false);
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const { mutate } = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: verifiedMutation<ConfirmationResponse>,
    onSuccess: () => {
      console.log("chatroom pinned successfully");
    },
  });
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleChatroomPin = (
    chatroomId: string,
    chatroomTitle: string,
    pin: boolean,
  ) => {
    console.log("pin ", pinnedGroup.id, ": ", chatroomId, ",", pin);
    mutate({
      fetchUrl: `${API_URL}/api/pinned/${chatroomId}/pin`,
      method: "PATCH",
      user,
      reqBody: {
        pin: pin,
        pinGroupId: pinnedGroup.id,
      },
    });
    setPinnedGroups((prev) =>
      prev?.map((group) => {
        if (group.id === pinnedGroup.id) {
          return {
            ...group,
            pinnedChatrooms: [
              ...group.pinnedChatrooms,
              { chatroomId, chatroom: { title: chatroomTitle } },
            ],
          };
        }
        return group;
      }),
    );
  };

  const handleEditPinnedGroupName = (pinnedGroupId: string, name: string) => {
    mutate({
      fetchUrl: `${API_URL}/api/pinned/${pinnedGroupId}`,
      method: "PATCH",
      user,
      reqBody: {
        name,
      },
    });
    setPinnedGroups((prev) =>
      prev?.map((group) => {
        if (group.id === pinnedGroupId) {
          return { ...group, name };
        }
        return group;
      }),
    );
  };

  const pinnedIds = pinnedGroup.pinnedChatrooms.map(
    (chatroom) => chatroom.chatroomId,
  );
  const pinnedChatrooms = chatrooms.filter((chatroom) =>
    pinnedIds.includes(chatroom.chatroomId),
  );
  const unpinnedChatrooms = chatrooms.filter(
    (chatroom) => !pinnedIds.includes(chatroom.chatroomId),
  );

  return (
    <Modal modalStyles={styles(theme)} open={open} onClose={onClose}>
      <div>
        <div className="title-section">
          <div className="edit-title-section">
            {enableTitleEdit ? (
              <>
                <input
                  type="text"
                  placeholder={pinnedGroup.name}
                  maxLength={20}
                  defaultValue={pinnedGroup.name}
                  ref={titleInputRef}
                ></input>
                <button
                  className="edit-title-btn"
                  onClick={() => {
                    handleEditPinnedGroupName(
                      pinnedGroup.id,
                      titleInputRef.current?.value || pinnedGroup.name,
                    );
                    setEnableTitleEdit(false);
                  }}
                >
                  <Check className="btn-icon" />
                </button>
                <button
                  className="edit-title-btn"
                  onClick={() => setEnableTitleEdit(false)}
                >
                  <X className="btn-icon" />
                </button>
              </>
            ) : (
              <>
                <h3>{pinnedGroup.name}</h3>
                <button
                  className="edit-title-btn"
                  aria-label="Edit pinned group name"
                  onClick={() => setEnableTitleEdit((prev) => !prev)}
                >
                  <Pencil className="btn-icon" />
                </button>
              </>
            )}
          </div>
          <button css={closeButtonStyles(theme)} onClick={onClose}>
            <X />
          </button>
        </div>
        <ul>
          <h5>Pinned Chatrooms</h5>
          {pinnedChatrooms.map((chatroom) => (
            <li key={chatroom.chatroomId}>{chatroom.chatroom.title}</li>
          ))}
          <h5>Unpinned Chatrooms</h5>
          {unpinnedChatrooms.map((chatroom) => (
            <li key={chatroom.chatroomId}>
              <button
                onClick={() =>
                  handleChatroomPin(
                    chatroom.chatroomId,
                    chatroom.chatroom.title,
                    true,
                  )
                }
              >
                {chatroom.chatroom.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};
