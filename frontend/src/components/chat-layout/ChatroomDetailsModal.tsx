import { useMutation, useQuery } from "@tanstack/react-query";
import { queryFunction } from "../../hooks/useCustomQuery";
import type {
  ChatroomDetails,
  ChatroomPrivacy,
} from "../../types/REST-types/Chatroom";
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
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { SquarePen } from "lucide-react";
import useAuthContext from "../../hooks/useAuthContext";

const chatroomDetailsModalStyles = (theme: Theme) =>
  css({
    padding: "20px",
    borderRadius: "5px",
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    border: `1px solid ${theme.colors.light_grey}`,

    ".title": {
      display: "flex",
    },
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

interface ChatroomFormInput {
  title: string;
  privacy: ChatroomPrivacy;
}

export const ChatroomDetailsModal = ({
  open,
  onClose,
  chatroomId,
  user,
}: ChatroomDetailsProps) => {
  const theme = useTheme();
  const [enableTitleEdit, setEnableTitleEdit] = useState<boolean>(false);
  const { register, handleSubmit } = useForm<ChatroomFormInput>();
  const { isLoggedIn } = useAuthContext();
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

  const chatroomMutation = useMutation<
    ConfirmationResponse,
    Error,
    MutationArgs
  >({
    mutationFn: mutationFunction<ConfirmationResponse>,
  });

  const handleLeave = () => {
    chatroomMutation.mutate({
      fetchUrl: "http://localhost:3000/api/members/" + chatroomId,
      method: "DELETE",
      user,
    });
    onClose();
  };

  const handleDelete = () => {
    if (chatroomDetails?.ownerId !== user.userId) return;
    chatroomMutation.mutate({
      fetchUrl: "http://localhost:3000/api/chatrooms/" + chatroomId,
      method: "DELETE",
      user,
    });
    onClose();
  };

  const handleUpdate: SubmitHandler<ChatroomFormInput> = (data) => {
    if (!isLoggedIn || !isOwner) return;

    const { title, privacy } = data;
    chatroomMutation.mutate({
      fetchUrl: "http://localhost:3000/api/chatrooms/" + chatroomId,
      method: "PATCH",
      user,
      reqBody: {
        title,
        privacy,
      },
    });
  };

  const isOwner = chatroomDetails?.ownerId === user.userId;

  return (
    <>
      {chatroomDetails && (
        <Modal open={open} modalStyles={chatroomDetailsModalStyles(theme)}>
          <form id="edit-chatroom" onSubmit={handleSubmit(handleUpdate)}>
            <div className="title">
              {enableTitleEdit ? (
                <input
                  {...register("title")}
                  type="text"
                  placeholder={chatroomDetails.title}
                ></input>
              ) : (
                <h3>{chatroomDetails.title}</h3>
              )}
              {isOwner && (
                <Button
                  variant="icon"
                  type="button"
                  onClick={() => setEnableTitleEdit((prev) => !prev)}
                >
                  <SquarePen />
                </Button>
              )}
            </div>
            <h5>Owned by: {chatroomDetails.owner.username}</h5>
            <p>
              Created at:
              {new Date(chatroomDetails.createdAt).toLocaleString()}
            </p>
            {!isOwner ? (
              <Button onClick={handleLeave}>Leave Chatroom</Button>
            ) : (
              <Button onClick={handleDelete}>Delete Chatroom</Button>
            )}
            {chatroomDetails.ownerId === user.userId && (
              <>
                <br />
                <label htmlFor="privacy">Privacy:</label>
                <select
                  {...register("privacy")}
                  defaultValue={chatroomDetails.privacy}
                  id="privacy"
                >
                  <option value="INVITE_ONLY">Only owner can invite</option>
                  <option value="INVITE_PLUS">Members can invite</option>
                  <option value="JOINABLE">Any user can join by link</option>
                  <option value="PUBLIC">Guests can join by link</option>
                </select>
                <br />
                <Button type="submit">Save</Button>
              </>
            )}
          </form>
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
