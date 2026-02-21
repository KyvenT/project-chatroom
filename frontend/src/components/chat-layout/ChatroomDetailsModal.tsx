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
  customMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { SquarePen, X } from "lucide-react";
import { isLoggedInSelector, useAuthStore } from "../../hooks/useStores";
import useToggle from "../../hooks/useToggle";
import { customQuery } from "../../hooks/useCustomQuery";
import { API_URL } from "../../env";
import { mq } from "../../styles/breakpoints";
import { Loader } from "../Loader";

const chatroomDetailsModalStyles = (theme: Theme) =>
  css(
    mq({
      width: ["80%", "60%", "40%", "30%"],
      padding: "30px",
      borderRadius: "5px",
      backgroundColor: theme.colors.dark_grey,
      color: theme.colors.white,
      border: `1px solid ${theme.colors.light_grey}`,
      display: "flex",
      justifyContent: "center",

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

      "#editChatroom": {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "90%",
      },

      ".chatroomInfo": {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        justifyContent: "center",
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
    }),
  );

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
  const isLoggedIn = useAuthStore(isLoggedInSelector);

  const {
    data: chatroomData,
    refetch,
    isLoading,
    isError,
  } = useQuery<ChatroomDetails>({
    queryKey: ["active-chatroom", chatroomId],
    queryFn: () =>
      customQuery({
        fetchUrl: `${API_URL}/api/chatrooms/${chatroomId}`,
      }),
    enabled: !!chatroomId && open,
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
    mutationFn: customMutation<ConfirmationResponse>,
  });

  const handleLeave = () => {
    chatroomMutation.mutate({
      fetchUrl: `${API_URL}/api/members/${chatroomId}`,
      method: "DELETE",
      reqBody: {
        memberId: user.userId,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (chatroomData?.ownerId !== user.userId) return;
    chatroomMutation.mutate({
      fetchUrl: `${API_URL}/api/chatrooms/${chatroomId}`,
      method: "DELETE",
    });
    onClose();
  };

  const handleUpdate: SubmitHandler<ChatroomFormInput> = (data) => {
    if (!isLoggedIn || !isOwner) return;

    const { title, privacy } = data;
    console.log("update chatroom to: ", title, privacy);

    chatroomMutation.mutate({
      fetchUrl: `${API_URL}/api/chatrooms/${chatroomId}`,
      method: "PATCH",
      reqBody: {
        title,
        privacy,
      },
    });

    refetch();
  };

  const isOwner = chatroomData?.ownerId === user.userId;

  if (isLoading) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        modalStyles={chatroomDetailsModalStyles(theme)}
      >
        <Loader /> <p>Loading chatroom details...</p>
      </Modal>
    );
  }

  if (isError) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        modalStyles={chatroomDetailsModalStyles(theme)}
      >
        <p>Failed to load chatroom details</p>
      </Modal>
    );
  }

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
                Chatroom Owner: <span>{chatroomData.owner?.username}</span>
              </h5>
              <p>
                Created at:{" "}
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
          <button css={closeButtonStyles(theme)} onClick={onClose}>
            <X />
          </button>
        </Modal>
      )}
    </>
  );
};
