import { useMutation } from "@tanstack/react-query";
import { useChatroomsStore } from "../../hooks/useStores";
import Modal, { closeButtonStyles } from "../Modal";
import { customMutation, type MutationArgs } from "../../utils/customMutation";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import type { PinnedGroup } from "../../types/REST-types/Chatroom";
import { API_URL } from "../../env";
import { Check, Pencil, X } from "lucide-react";
import { useRef, useState } from "react";
import { mq } from "../../styles/breakpoints";

interface pinChatroomsModalProps {
  open: boolean;
  onClose: () => void;
  pinnedGroup: PinnedGroup;
  setPinnedGroups: React.Dispatch<React.SetStateAction<PinnedGroup[]>>;
}

const styles = (theme: Theme) =>
  css(
    mq({
      width: ["80%", "80%", "40%"],
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

        h3: {
          fontSize: "1.5rem",
          margin: 0,
          fontWeight: 400,
        },

        ".edit-title-section": {
          width: "100%",
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
          flex: 1,
          minWidth: 0,
          fontSize: "1.5rem",
          fontWeight: 400,
          backgroundColor: theme.colors.grey,
          color: theme.colors.white,
          border: `1px solid ${theme.colors.white}`,
          borderRadius: "4px",
          padding: "4px",
        },
      },

      ".unpinned-chatroom": {
        button: {
          fontSize: "1.1rem",
          backgroundColor: "transparent",
          color: theme.colors.white,
          border: 0,
          width: "100%",
          cursor: "pointer",
        },

        "button:hover": {
          backgroundColor: theme.colors.grey,
        },
      },

      h5: {
        fontSize: "1.2rem",
        fontWeight: 400,
      },

      ".chatroom-list": {
        marginBottom: "20px",
        border: `1px solid ${theme.colors.light_grey}`,
        borderRadius: "4px",
        padding: "12px",
        height: ["60px", "60px", "100px"],
        overflowY: "scroll",
        scrollbarColor: `transparent transparent`,
        "&:hover": {
          scrollbarColor: `${theme.colors.white} transparent`,
        },
      },
    }),
  );

export const PinChatroomsModal = ({
  open,
  onClose,
  pinnedGroup,
  setPinnedGroups,
}: pinChatroomsModalProps) => {
  const theme = useTheme();
  const [enableTitleEdit, setEnableTitleEdit] = useState<boolean>(false);
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const { mutate } = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: customMutation<ConfirmationResponse>,
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
            chatrooms: [
              ...group.chatrooms,
              {
                chatroomId,
                chatroom: { title: chatroomTitle },
                pinnedIndex: group.chatrooms.length,
              },
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

  const pinnedIds = pinnedGroup.chatrooms.map(
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
        <h5>Pinned Chatrooms</h5>
        <ul className="chatroom-list">
          {pinnedChatrooms.length === 0 ? (
            <p>No pinned chatrooms</p>
          ) : (
            pinnedChatrooms.map((chatroom) => (
              <li key={chatroom.chatroomId} className="unpinned-chatroom">
                <button
                  onClick={() =>
                    handleChatroomPin(
                      chatroom.chatroomId,
                      chatroom.chatroom.title,
                      false,
                    )
                  }
                >
                  {chatroom.chatroom.title}
                </button>
              </li>
            ))
          )}
        </ul>
        <h5>Pin chatrooms</h5>
        <ul className="chatroom-list">
          {unpinnedChatrooms.map((chatroom) => (
            <li key={chatroom.chatroomId} className="unpinned-chatroom">
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
