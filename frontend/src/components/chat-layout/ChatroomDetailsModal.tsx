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
import { useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { SquarePen } from "lucide-react";
import useAuthContext from "../../hooks/useAuthContext";

const chatroomDetailsModalStyles = (theme: Theme) =>
  css({
    padding: "30px",
    borderRadius: "5px",
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    border: `1px solid ${theme.colors.light_grey}`,

    ".title": {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      h3: {
        fontWeight: 400,
        fontSize: "1.1rem",
      },
      input: {
        fontSize: "1rem",
        flex: 1,
        fontWeight: 400,
        margin: 0,
        borderRadius: "4px",
        backgroundColor: theme.colors.grey,
        color: theme.colors.white,
        border: `1px solid ${theme.colors.white}`,
      },
    },

    form: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    },

    ".actionBtn": {
      width: "fit-content",
      fontSize: "1rem",
      color: theme.colors.white,
      backgroundColor: "transparent",
      border: `1px solid ${theme.colors.white}`,
      padding: "6px 10px",
      borderRadius: "5px",
    },

    ".actionBtn:hover": {
      backgroundColor: theme.colors.grey,
    },

    ".privacySection": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",

      select: {
        backgroundColor: "transparent",
        color: theme.colors.white,
        padding: "6px",
        borderRadius: "4px",
        border: `1px solid ${theme.colors.white}`,

        option: {
          backgroundColor: theme.colors.dark_grey,
        },

        "option:hover": {
          backgroundColor: theme.colors.light_grey,
        },
      },

      "select:hover": {
        backgroundColor: theme.colors.grey,
      },
    },

    ".actionBtns": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
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
  const titleInputRef = useRef<HTMLInputElement>(null);
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
          <form id="editChatroom" onSubmit={handleSubmit(handleUpdate)}>
            <div className="chatroomInfo">
              <div className="title">
                {enableTitleEdit ? (
                  <input
                    {...register("title")}
                    type="text"
                    placeholder={chatroomDetails.title}
                    ref={titleInputRef}
                  ></input>
                ) : (
                  <h3>{chatroomDetails.title}</h3>
                )}
                {isOwner && (
                  <Button
                    variant="icon"
                    type="button"
                    onClick={() => {
                      setEnableTitleEdit((prev) => !prev);
                      titleInputRef.current?.focus();
                    }}
                  >
                    <SquarePen />
                  </Button>
                )}
              </div>
              <h5>
                Owned by: <span>{chatroomDetails.owner.username}</span>
              </h5>
              <p>
                Created at:
                <span>
                  {new Date(chatroomDetails.createdAt).toLocaleString()}
                </span>
              </p>
            </div>
            {chatroomDetails.ownerId === user.userId && (
              <>
                <div className="privacySection">
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
                </div>
                <div className="actionBtns">
                  <Button className="actionBtn" type="submit">
                    Save
                  </Button>
                  {!isOwner ? (
                    <Button className="actionBtn" onClick={handleLeave}>
                      Leave Chatroom
                    </Button>
                  ) : (
                    <Button className="actionBtn" onClick={handleDelete}>
                      Delete Chatroom
                    </Button>
                  )}
                </div>
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
