import { css, useTheme } from "@emotion/react";
import useToggle from "../../hooks/useToggle";
import Button from "../Button";
import { useMutation } from "@tanstack/react-query";
import { customMutation, type MutationArgs } from "../../utils/customMutation";
import type { ChatroomPrivacy } from "../../types/REST-types/Chatroom";
import { isLoggedInSelector, useAuthStore } from "../../hooks/useStores";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import Modal, { closeButtonStyles } from "../Modal";
import type { Theme } from "@emotion/react";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import { API_URL } from "../../env";
import { mq } from "../../styles/breakpoints";
import { X } from "lucide-react";

const buttonStyles = (theme: Theme) =>
  css({
    fontSize: "1.75rem",
    width: "fit-content",
    aspectRatio: "1",
    color: theme.colors.light_grey,

    "&:hover": {
      color: theme.colors.white,
      backgroundColor: theme.colors.grey,
    },
  });

const dialogStyles = (theme: Theme) =>
  css(
    mq({
      width: ["80%", "60%", "40%", "30%"],
      gap: "10px",
      backgroundColor: theme.colors.dark_grey,
      color: theme.colors.white,
      border: `1px solid ${theme.colors.light_grey}`,
      borderRadius: "10px",
      padding: "30px",

      h2: {
        fontWeight: "500",
        color: theme.colors.white,
        cursor: "default",
      },

      "#new-chat-form": {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "5px",
      },

      "#title": {
        flex: 1,
        minWidth: 0,
        fontSize: "1rem",
        borderRadius: "4px",
        padding: "4px",
        border: `1px solid ${theme.colors.white}`,
        backgroundColor: "transparent",
        color: theme.colors.white,
      },

      "#title:focus": {
        outline: "none",
      },

      ".form-group": {
        width: "100%",
        fontSize: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      },

      ".submit-btn": {
        fontSize: "1rem",
        borderRadius: "4px",
        width: "fit-content",
        padding: "4px 8px",
        backgroundColor: "transparent",
        color: theme.colors.white,
        border: `1px solid ${theme.colors.white}`,
        cursor: "pointer",
      },

      ".submit-btn:hover": {
        backgroundColor: theme.colors.grey,
      },

      "#privacy": {
        flex: 1,
        minWidth: 0,
        fontSize: "1rem",
        backgroundColor: "transparent",
        color: theme.colors.white,
        border: `1px solid ${theme.colors.white}`,
        padding: "4px",
        borderRadius: "4px",
        cursor: "pointer",
      },

      "#privacy:hover": {
        backgroundColor: theme.colors.grey,
      },

      "#privacy option": {
        backgroundColor: theme.colors.dark_grey,
      },
    }),
  );

interface CreateChatroomFormInput {
  title: string;
  privacy: ChatroomPrivacy;
}

const NewChatButton = () => {
  const [isToggled, setToggle] = useToggle(false);
  const isLoggedIn = useAuthStore(isLoggedInSelector);
  const { register, handleSubmit, reset } = useForm<CreateChatroomFormInput>({
    defaultValues: {
      title: "",
      privacy: "INVITE_ONLY",
    },
  });
  const mutation = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: customMutation<ConfirmationResponse>,
  });
  const theme = useTheme();

  const onSubmit: SubmitHandler<CreateChatroomFormInput> = (data) => {
    if (!isLoggedIn) return;

    const { title, privacy } = data;
    setToggle(false);
    mutation.mutate({
      fetchUrl: `${API_URL}/api/chatrooms/create`,
      method: "POST",
      reqBody: {
        title,
        privacy,
      },
    });
    reset();
  };

  return (
    <>
      <Button
        onClick={() => setToggle(true)}
        variant="icon"
        css={buttonStyles(theme)}
        aria-label="Open create chatroom modal"
      >
        +
      </Button>
      {isToggled && (
        <Modal
          modalStyles={dialogStyles(theme)}
          open={isToggled}
          onClose={() => setToggle(false)}
        >
          <form id="new-chat-form" onSubmit={handleSubmit(onSubmit)}>
            <h2>Create Chatroom</h2>
            <div className="form-group chatroom-title-group">
              <label htmlFor="title">Chatroom name: </label>
              <input
                {...register("title")}
                id="title"
                type="text"
                placeholder="Title..."
                maxLength={20}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="privacy">Privacy:</label>
              <select {...register("privacy")} id="privacy">
                <option value="INVITE_ONLY">Only owner can invite</option>
                <option value="INVITE_PLUS">Members can invite</option>
                <option value="JOINABLE">Any user can join by link</option>
                <option value="PUBLIC">Guests can join by link</option>
              </select>
            </div>
            <button className="submit-btn" type="submit" disabled={!isLoggedIn}>
              Create
            </button>
          </form>
          <button
            css={closeButtonStyles(theme)}
            onClick={() => setToggle(false)}
            aria-label="Close create chatroom modal"
          >
            <X />
          </button>
        </Modal>
      )}
    </>
  );
};

export default NewChatButton;
