import { useMutation, useQuery } from "@tanstack/react-query";
import { queryFunction } from "../../hooks/useCustomQuery";
import type { ChatroomDetails } from "../../types/REST-types/Chatroom";
import type { UserAuth } from "../../types/REST-types/User";
import Modal, { closeButtonStyles, type ModalProps } from "../Modal";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import Button from "../Button";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import {
  mutationFunction,
  type MutationArgs,
} from "../../hooks/useCustomMutation";

const chatroomDetailsModalStyles = (theme: Theme) =>
  css({
    padding: "20px",
    borderRadius: "5px",
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    border: `1px solid ${theme.colors.light_grey}`,
  });

const closeButtonColors = (theme: Theme) =>
  css({
    color: theme.colors.white,
    "&:hover": {
      color: theme.colors.light_grey,
      fontSize: "1.05rem",
    },
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

  const leaveMutation = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: mutationFunction<ConfirmationResponse>,
  });

  const deleteMutation = useMutation<ConfirmationResponse, Error, MutationArgs>(
    {
      mutationFn: mutationFunction<ConfirmationResponse>,
    },
  );

  const handleLeave = () => {
    leaveMutation.mutate({
      fetchUrl: "http://localhost:3000/api/members/" + chatroomId,
      method: "DELETE",
      user,
    });
    onClose();
  };

  const handleDelete = () => {
    if (chatroomDetails?.ownerId !== user.userId) return;
    deleteMutation.mutate({
      fetchUrl: "http://localhost:3000/api/chatrooms/" + chatroomId,
      method: "DELETE",
      user,
    });
    onClose();
  };

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
          {chatroomDetails.ownerId !== user.userId ? (
            <Button onClick={handleLeave}>Leave Chatroom</Button>
          ) : (
            <Button onClick={handleDelete}>Delete Chatroom</Button>
          )}
          <button
            css={[closeButtonStyles, closeButtonColors(theme)]}
            onClick={onClose}
          >
            X
          </button>
        </Modal>
      )}
    </>
  );
};
