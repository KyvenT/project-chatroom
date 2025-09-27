import { css, useTheme } from "@emotion/react";
import useToggle from "../../hooks/useToggle";
import Button from "../Button";
import { useMutation } from "@tanstack/react-query";
import {
  verifiedMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import type {
  ChatroomPrivacy,
  JoinChatroom,
} from "../../types/REST-types/Chatroom";
import useAuthContext from "../../hooks/useAuthContext";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import Modal, { closeButtonStyles } from "../Modal";
import type { Theme } from "@emotion/react";

const buttonStyles = (theme: Theme) =>
  css({
    fontSize: "1.5rem",
    width: "fit-content",
    aspectRatio: "1",
    color: theme.colors.light_grey,

    "&:hover": {
      color: theme.colors.white,
      backgroundColor: theme.colors.grey,
    },
  });

const dialogStyles = (theme: Theme) =>
  css({
    gap: "10px",
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    border: `1px solid ${theme.colors.light_grey}`,
    borderRadius: "10px",
    padding: "30px",

    h2: {
      fontWeight: "500",
      color: theme.colors.white,
    },

    "#new-chat-form": {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "5px",
    },

    "#title": {
      fontSize: "1rem",
      borderRadius: "5px",
      padding: "4px",
      border: "1px solid transparent",
    },

    "#title:focus": {
      border: "1px solid black",
      outline: "none",
    },

    ".chatroom-title-group": {
      display: "flex",
      justifyContent: "space-between",
    },

    ".form-group": {
      width: "100%",
      fontSize: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },

    ".submit-btn": {
      fontSize: "1rem",
      borderRadius: "5px",
      width: "fit-content",
      padding: "4px 8px",
      backgroundColor: theme.colors.white,
      border: "0",
    },

    ".submit-btn:hover": {
      backgroundColor: theme.colors.light_grey,
    },

    "input[type='checkbox']": {
      cursor: "pointer",
      width: "1rem",
      aspectRatio: "1",
      accentColor: theme.colors.black,
      boxShadow: "0 0 0 1px white inset",
    },

    "input[type='checkbox']:checked": {
      boxShadow: "1px 1px 0 0 black inset",
    },
  });

const closeButtonColors = (theme: Theme) =>
  css({
    color: theme.colors.white,
    "&:hover": {
      color: theme.colors.light_grey,
    },
  });

interface CreateChatroomFormInput {
  title: string;
  privacy: ChatroomPrivacy;
}

const NewChatButton = () => {
  const [isToggled, setToggle] = useToggle(false);
  const { user, isLoggedIn } = useAuthContext();
  const { register, handleSubmit } = useForm<CreateChatroomFormInput>();
  const mutation = useMutation<JoinChatroom, Error, MutationArgs>({
    mutationFn: verifiedMutation<JoinChatroom>,
  });
  const theme = useTheme();

  const onSubmit: SubmitHandler<CreateChatroomFormInput> = (data) => {
    if (!isLoggedIn) return;

    const { title, privacy } = data;
    setToggle(false);
    mutation.mutate({
      fetchUrl: "http://localhost:3000/api/chatrooms/create",
      method: "POST",
      user,
      reqBody: {
        title,
        privacy,
      },
    });
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
      <Modal
        modalStyles={dialogStyles(theme)}
        open={isToggled}
        onClose={() => setToggle(false)}
      >
        <form id="new-chat-form" onSubmit={handleSubmit(onSubmit)}>
          <h2>Create a Chatroom</h2>
          <div className="form-group chatroom-title-group">
            <label htmlFor="title">Chatroom name: </label>
            <input
              {...register("title")}
              id="title"
              type="text"
              placeholder="Title..."
              maxLength={30}
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
          css={[closeButtonStyles, closeButtonColors(theme)]}
          onClick={() => setToggle(false)}
          aria-label="Close create chatroom modal"
        >
          X
        </button>
      </Modal>
    </>
  );
};

export default NewChatButton;
