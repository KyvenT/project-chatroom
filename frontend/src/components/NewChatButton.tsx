import { css } from "@emotion/react";
import useToggle from "../hooks/useToggle";
import Button from "./Button";
import { useMutation } from "@tanstack/react-query";
import {
  mutationFunction,
  type MutationArgs,
} from "../hooks/useCustomMutation";
import type { CreateChatroom } from "../types/Chatroom";
import useAuthContext from "../hooks/useAuthContext";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";

const buttonStyles = css({
  fontSize: "1.5rem",
  width: "fit-content",
  aspectRatio: "1",
});

const dialogStyles = css({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  gap: "10px",
  backgroundColor: "white",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  padding: "30px",

  ".close-btn": {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
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
  const formRef = useRef<HTMLFormElement>(null);
  const { user } = useAuthContext();
  const { register, handleSubmit } = useForm<CreateChatroomFormInput>();
  const mutation = useMutation<CreateChatroom, Error, MutationArgs>({
    mutationFn: mutationFunction<CreateChatroom>,
  });

  const onSubmit: SubmitHandler<CreateChatroomFormInput> = (data) => {
    const { title, linkPrivacy, guestPrivacy, allowMembersToInvite } = data;
    setToggle(false);
    mutation.mutate({
      fetchUrl: "http://localhost:3000/api/chatroom/create",
      method: "POST",
      user,
      reqBody: {
        title,
        linkPrivacy,
        guestPrivacy,
        allowMembersToInvite
      },
    });
  };

  return (
    <>
      <Button onClick={() => setToggle(true)} variant="icon" css={buttonStyles}>
        +
      </Button>
      <dialog
        css={dialogStyles}
        open={isToggled}
        onClose={() => setToggle(false)}
      >
        <h2>Create a Chatroom</h2>
        <form ref={formRef} id="new-chat-form" onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="chatroomName">Chatroom name: </label>
          <input
            {...register("title")}
            id="title"
            type="text"
            placeholder="Title..."
            required
          />
          <div>
            <input {...register("linkPrivacy")} type="checkbox" id="linkPrivacy" />
            <label htmlFor="linkPrivacy">Shareable link</label>
          </div>
          <div>
            <input {...register("guestPrivacy")} type="checkbox" id="guestPrivacy" />
            <label htmlFor="guestPrivacy">Guests can join</label>
          </div>
          <div>
            <input
              {...register("allowMembersToInvite")}
              type="checkbox"
              id="allowMembersToInvite"
            />
            <label htmlFor="allowMembersToInvite">
              Allow members to invite
            </label>
          </div>
          <button type="submit">Create</button>
        </form>
        <button className="close-btn" onClick={() => setToggle(false)}>
          X
        </button>
      </dialog>
    </>
  );
};

export default NewChatButton;
