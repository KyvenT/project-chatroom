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

interface pinChatroomsModalProps {
  open: boolean;
  onClose: () => void;
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
}: pinChatroomsModalProps) => {
  const theme = useTheme();
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const pinChatroom = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: verifiedMutation<ConfirmationResponse>,
  });

  const handleChatroomPin = (
    chatroomId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();
    console.log("pin ", chatroomId, ",", event.target.checked);
    pinChatroom.mutate({
      fetchUrl: "http://localhost:3000/api/members/" + chatroomId + "/pin",
      method: "PATCH",
      reqBody: {
        chatroomId,
        pin: event.target.checked,
      },
    });
  };

  return (
    <Modal modalStyles={styles(theme)} open={open} onClose={onClose}>
      <div>
        <h5>Pinned chatrooms</h5>
        <ul>
          {chatrooms.map((chatroom) => (
            <li key={chatroom.chatroomId}>
              {chatroom.chatroom.title}
              <input
                type="checkbox"
                checked={false}
                onChange={(e) => handleChatroomPin(chatroom.chatroomId, e)}
              />
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};
