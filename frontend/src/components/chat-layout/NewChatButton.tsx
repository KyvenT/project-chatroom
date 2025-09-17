import { css, useTheme } from "@emotion/react";
import useToggle from "../../hooks/useToggle";
import Button from "../Button";
import { useMutation } from "@tanstack/react-query";
import {
  mutationFunction,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import type { JoinChatroom } from "../../types/REST-types/Chatroom";
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
  linkPrivacy: boolean;
  guestPrivacy: boolean;
  allowMembersToInvite: boolean;
}

const NewChatButton = () => {
  const [isToggled, setToggle] = useToggle(false);
  const { user, isLoggedIn } = useAuthContext();
  const { register, handleSubmit } = useForm<CreateChatroomFormInput>();
  const mutation = useMutation<JoinChatroom, Error, MutationArgs>({
    mutationFn: mutationFunction<JoinChatroom>,
  });
  const theme = useTheme();

  const onSubmit: SubmitHandler<CreateChatroomFormInput> = (data) => {
    if (!isLoggedIn) return;

    const { title, linkPrivacy, guestPrivacy, allowMembersToInvite } = data;
    setToggle(false);
    mutation.mutate({
      fetchUrl: "http://localhost:3000/api/chatrooms/create",
      method: "POST",
      user,
      reqBody: {
        title,
        linkPrivacy,
        guestPrivacy,
        allowMembersToInvite,
      },
    });
  };

  return (
    <>
      <Button
        onClick={() => setToggle(true)}
        variant="icon"
        css={buttonStyles(theme)}
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
            <label htmlFor="chatroomName">Chatroom name: </label>
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
            <input
              {...register("linkPrivacy")}
              type="checkbox"
              id="linkPrivacy"
            />
            <label htmlFor="linkPrivacy">Shareable link</label>
          </div>
          <div className="form-group">
            <input
              {...register("guestPrivacy")}
              type="checkbox"
              id="guestPrivacy"
            />
            <label htmlFor="guestPrivacy">Guests can join</label>
          </div>
          <div className="form-group">
            <input
              {...register("allowMembersToInvite")}
              type="checkbox"
              id="allowMembersToInvite"
            />
            <label htmlFor="allowMembersToInvite">
              Allow members to invite
            </label>
          </div>
          <button className="submit-btn" type="submit" disabled={!isLoggedIn}>
            Create
          </button>
        </form>
        <button
          css={[closeButtonStyles, closeButtonColors(theme)]}
          onClick={() => setToggle(false)}
        >
          X
        </button>
      </Modal>
    </>
  );
};

export default NewChatButton;
