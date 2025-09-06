import type { Theme } from "@emotion/react";
import { css, useTheme } from "@emotion/react";
import { NavLink } from "react-router";
import useToggle from "../hooks/useToggle";
import Button from "./Button";
import { UserRoundPlus } from "lucide-react";
import Modal, { closeButtonStyles } from "./Modal";
import { useForm, type SubmitHandler } from "react-hook-form";
import type { Invite } from "../types/Invite";
import { useMutation } from "@tanstack/react-query";
import { mutationFunction, type MutationArgs } from "../hooks/useCustomMutation";
import useAuthContext from "../hooks/useAuthContext";

interface SidebarChatroomButtonProps {
  isActive?: boolean;
  chatroomId: string;
  unreadMessages: number;
  children: string;
}

const styles = css({
  position: "relative",
  width: "100%",

  div: {
    width: "100%",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    height: "2rem",
    borderStyle: "solid"
  },

  ".chatroomLink": {
    flex: 1,
    textDecoration: "none",
    userSelect: "none",
  },

  ".unreadBadge": {
    position: "absolute",
    top: 0,
    right: 0,
    aspectRatio: 1,
    borderRadius: "50%",
    fontSize: "1rem",
    width: "1rem",
    textAlign: "center",
    userSelect: "none"
  }
});

const dynamicStyles = (theme: Theme, isActive: boolean) =>
  css({
    div: {
      backgroundColor: isActive ? theme.colors.white : "inherit",
      borderColor: isActive ? theme.colors.white : theme.colors.dark_grey,
    },

    "div:hover": {
      backgroundColor: theme.colors.grey,
    },

    ".chatroomLink": {
      color: isActive ? theme.colors.black : theme.colors.white,
    },

    ".unreadBadge": {
      backgroundColor: "red",
      color: theme.colors.white
    }
  });

const inviteBtnStyles = (theme: Theme) =>
  css({
    color: theme.colors.light_grey,
    aspectRatio: 1,
    height: "100%",
    textAlign: "center",

    "&:hover": {
      color: theme.colors.black,
    },
  });

const dialogStyles = css({
  gap: "10px",
  backgroundColor: "white",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  padding: "30px",
});

interface inviteFormInput {
  username: string;
}

const SidebarChatroomButton = ({
  isActive = false,
  children,
  chatroomId,
  unreadMessages
}: SidebarChatroomButtonProps) => {
  const theme = useTheme();
  const { user } = useAuthContext();
  const [isHovered, setHovered] = useToggle(false);
  const [inviteModalOpen, setInviteModalOpen] = useToggle();
  const { register, handleSubmit } = useForm<inviteFormInput>();
  const mutation = useMutation<Invite, Error, MutationArgs>({
    mutationFn: mutationFunction<Invite>,
  });
  
  const onSubmit: SubmitHandler<inviteFormInput> = (data) => {
    const { username } = data;
    mutation.mutate({
      fetchUrl: "http://localhost:3000/api/invite/send",
      method: "POST",
      user,
      reqBody: {
        receiverUsername: username,
        chatroomId
      },
    });
  }

  return (
    <>
      <li css={[styles, dynamicStyles(theme, isActive)]}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <NavLink className="chatroomLink" to={"/chat/" + chatroomId}>
            {children}
          </NavLink>
          {unreadMessages > 0 && <span className="unreadBadge">{unreadMessages}</span>}
          {isHovered && (
            <Button
              onClick={() => setInviteModalOpen()}
              variant="icon"
              otherStyles={inviteBtnStyles(theme)}
            >
              {<UserRoundPlus size={"1.25rem"} />}
            </Button>
          )}
        </div>
      </li>
      <Modal modalStyles={dialogStyles} open={inviteModalOpen} onClose={() => setInviteModalOpen(false)}>
        <h3>Invite to {children}</h3>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input {...register("username")} />
          <button type="submit">Invite</button>
        </form>
        <button css={closeButtonStyles} onClick={() => setInviteModalOpen(false)}>
          X
        </button>
      </Modal>
    </>
  );
};

export default SidebarChatroomButton;
