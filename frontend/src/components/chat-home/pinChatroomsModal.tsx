import { useMutation } from "@tanstack/react-query";
import { useChatroomsStore } from "../../hooks/useStores";
import Modal from "../Modal";
import {
  verifiedMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import type { PinnedGroup } from "../../types/REST-types/Chatroom";
import useAuthContext from "../../hooks/useAuthContext";

interface pinChatroomsModalProps {
  open: boolean;
  onClose: () => void;
  pinnedGroup: PinnedGroup;
}

const styles = (theme: Theme) =>
  css({
    gap: "10px",
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    border: `1px solid ${theme.colors.light_grey}`,
    borderRadius: "10px",
    padding: "30px",

    ul: {
      listStyle: "none",
      padding: 0,
    },
  });

export const PinChatroomsModal = ({
  open,
  onClose,
  pinnedGroup,
}: pinChatroomsModalProps) => {
  const theme = useTheme();
  const { user } = useAuthContext();
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const { mutate } = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: verifiedMutation<ConfirmationResponse>,
    onSuccess: () => {
      console.log("chatroom pinned successfully");
    },
  });

  const handleChatroomPin = (
    chatroomId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    console.log(
      "pin ",
      pinnedGroup.id,
      ": ",
      chatroomId,
      ",",
      event.target.checked,
    );
    mutate({
      fetchUrl: "http://localhost:3000/api/pinned/" + chatroomId + "/pin",
      method: "PATCH",
      user,
      reqBody: {
        pin: event.target.checked,
        pinGroupId: pinnedGroup.id,
      },
    });
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
        <h5>Pinned chatrooms</h5>
        <ul>
          {pinnedChatrooms.map((chatroom) => (
            <li key={chatroom.chatroomId}>
              {chatroom.chatroom.title}
              <input
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => handleChatroomPin(chatroom.chatroomId, e)}
              />
            </li>
          ))}
          {unpinnedChatrooms.map((chatroom) => (
            <li key={chatroom.chatroomId}>
              {chatroom.chatroom.title}
              <input
                type="checkbox"
                defaultChecked={false}
                onChange={(e) => handleChatroomPin(chatroom.chatroomId, e)}
              />
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};
