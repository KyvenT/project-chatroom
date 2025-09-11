import { useQuery } from "@tanstack/react-query";
import { queryFunction } from "../../hooks/useCustomQuery";
import type { ChatroomDetails } from "../../types/REST-types/Chatroom";
import type { UserAuth } from "../../types/REST-types/User";
import Modal, { closeButtonStyles, type ModalProps } from "../Modal";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";

const chatroomDetailsModalStyles = (theme: Theme) =>
  css({
    padding: "20px",
    borderRadius: "5px",
    backgroundColor: theme.colors.white,
    color: theme.colors.black,
  });

interface ChatroomDetailsProps extends ModalProps {
  user: UserAuth;
  chatroomId: string;
  onClose: () => void;
}

export const ChatroomDetailsModal = ({
  open,
  onClose,
  chatroomId,
  user,
}: ChatroomDetailsProps) => {
  const theme = useTheme();
  const { data: chatroomDetails } = useQuery<ChatroomDetails>({
    queryKey: ["active-chatroom", chatroomId],
    queryFn: () =>
      queryFunction({
        fetchUrl: "http://localhost:3000/api/chatrooms/" + chatroomId,
        user,
      }),
    enabled: !!chatroomId,
    staleTime: Infinity,
  });

  return (
    <>
      {chatroomDetails && (
        <Modal open={open} modalStyles={chatroomDetailsModalStyles(theme)}>
          <h3>{chatroomDetails.title}</h3>
          <h5>Owned by: {chatroomDetails.owner.username}</h5>
          <p>
            Created at:
            {new Date(chatroomDetails.createdAt).toLocaleString()}
          </p>
          <button css={closeButtonStyles} onClick={onClose}>
            X
          </button>
        </Modal>
      )}
    </>
  );
};
