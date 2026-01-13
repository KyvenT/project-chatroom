import { useMutation, useQuery } from "@tanstack/react-query";
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
  verifiedMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { SquarePen } from "lucide-react";
import useAuthContext from "../../hooks/useAuthContext";
import useToggle from "../../hooks/useToggle";
import { verifiedQuery } from "../../hooks/useCustomQuery";
import { API_URL } from "../../env";

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
      cursor: "pointer",
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
        cursor: "pointer",

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
      justifyContent: "center",
      alignItems: "center",
      gap: "8px",
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
  const [enableTitleEdit, setEnableTitleEdit] = useToggle(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useToggle(false);
  const { isLoggedIn } = useAuthContext();

  const { data: chatroomData, refetch } = useQuery<ChatroomDetails>({
    queryKey: ["active-chatroom", chatroomId],
    queryFn: () =>
      verifiedQuery({
        fetchUrl: `http://${API_URL}/api/chatrooms/${chatroomId}`,
        user,
      }),
    enabled: !!chatroomId,
    staleTime: 0,
  });

  const { register, handleSubmit, setFocus } = useForm<ChatroomFormInput>({
    defaultValues: {
      title: chatroomData?.title,
      privacy: chatroomData?.privacy,
    },
  });

  const chatroomMutation = useMutation<
    ConfirmationResponse,
    Error,
    MutationArgs
  >({
    mutationFn: verifiedMutation<ConfirmationResponse>,
  });

  const handleLeave = () => {
    chatroomMutation.mutate({
      fetchUrl: `http://${API_URL}/api/members/${chatroomId}`,
      method: "DELETE",
      user,
      reqBody: {
        memberId: user.userId,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (chatroomData?.ownerId !== user.userId) return;
    chatroomMutation.mutate({
      fetchUrl: `http://${API_URL}/api/chatrooms/${chatroomId}`,
      method: "DELETE",
      user,
    });
    onClose();
  };

  const handleUpdate: SubmitHandler<ChatroomFormInput> = (data) => {
    if (!isLoggedIn || !isOwner) return;

    const { title, privacy } = data;
    console.log("update chatroom to: ", title, privacy);

    chatroomMutation.mutate({
      fetchUrl: `http://${API_URL}/api/chatrooms/${chatroomId}`,
      method: "PATCH",
      user,
      reqBody: {
        title,
        privacy,
      },
    });

    refetch();
  };

  const isOwner = chatroomData?.ownerId === user.userId;

  return (
    <>
      {chatroomData && (
        <Modal
          open={open}
          onClose={onClose}
          modalStyles={chatroomDetailsModalStyles(theme)}
        >
          <form id="editChatroom" onSubmit={handleSubmit(handleUpdate)}>
            <div className="chatroomInfo">
              <div className="title">
                {enableTitleEdit ? (
                  <input
                    {...register("title")}
                    type="text"
                    placeholder={chatroomData.title}
                    maxLength={20}
                  ></input>
                ) : (
                  <h3>{chatroomData.title}</h3>
                )}
                {isOwner && (
                  <Button
                    variant="icon"
                    type="button"
                    onClick={() => {
                      setEnableTitleEdit();
                      setFocus("title");
                    }}
                  >
                    <SquarePen />
                  </Button>
                )}
              </div>
              <h5>
                Owned by: <span>{chatroomData.owner?.username}</span>
              </h5>
              <p>
                Created at:
                <span>{new Date(chatroomData.createdAt).toLocaleString()}</span>
              </p>
            </div>

            {!isOwner ? (
              <Button type="button" className="actionBtn" onClick={handleLeave}>
                Leave Chatroom
              </Button>
            ) : (
              <>
                <div className="privacySection">
                  <label htmlFor="privacy">Privacy:</label>
                  <select {...register("privacy")} id="privacy">
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
                  <Button
                    className="actionBtn"
                    type="button"
                    onClick={() => setConfirmDeleteModalOpen(true)}
                  >
                    Delete Chatroom
                  </Button>
                </div>
                {confirmDeleteModalOpen && (
                  <Modal
                    modalStyles={chatroomDetailsModalStyles(theme)}
                    open={confirmDeleteModalOpen}
                    variant="requiredInteraction"
                  >
                    <h3>
                      Are you sure you want to delete "
                      <span>{chatroomData.title}</span>"?
                    </h3>
                    <br />
                    <div className="actionBtns">
                      <Button
                        className="actionBtn"
                        type="button"
                        onClick={handleDelete}
                      >
                        Confirm Delete
                      </Button>
                      <Button
                        className="actionBtn"
                        type="button"
                        onClick={() => setConfirmDeleteModalOpen(false)}
                      >
                        Go back
                      </Button>
                    </div>
                  </Modal>
                )}
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
