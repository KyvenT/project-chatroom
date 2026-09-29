import { css, useTheme } from "@emotion/react";
import useToggle from "../../hooks/useToggle";
import Button from "../Button";
import { useMutation } from "@tanstack/react-query";
import { customMutation, type MutationArgs } from "../../utils/customMutation";
import type { ChatroomPrivacy } from "../../types/REST-types/Chatroom";
import { isLoggedInSelector, useAuthStore } from "../../hooks/useStores";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import Modal, { ModalCloseButton } from "../Modal";
import type { Theme } from "@emotion/react";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import { API_URL } from "../../env";
import { fieldStyles, formModalStyles } from "../../styles/modalForm";
import { privacyHint, privacyOptions } from "../../utils/chatroomPrivacy";
import { Plus } from "lucide-react";

const buttonStyles = (theme: Theme) =>
  css({
    // same square as the sidebar's home and settings buttons
    width: "2.25rem",
    height: "2.25rem",
    padding: 0,
    color: theme.colors.light_grey,

    "&:hover": {
      color: theme.colors.white,
      backgroundColor: theme.colors.grey,
    },
  });

const formStyles = css({
  display: "flex",
  flexDirection: "column",
});

interface CreateChatroomFormInput {
  title: string;
  privacy: ChatroomPrivacy;
}

const NewChatButton = () => {
  const [isToggled, setToggle] = useToggle(false);
  const isLoggedIn = useAuthStore(isLoggedInSelector);
  const { register, handleSubmit, reset, watch } =
    useForm<CreateChatroomFormInput>({
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
        <Plus size="1.5rem" />
      </Button>
      {isToggled && (
        <Modal
          modalStyles={formModalStyles(theme)}
          open={isToggled}
          onClose={() => setToggle(false)}
        >
          <form css={formStyles} onSubmit={handleSubmit(onSubmit)}>
            <div className="header">
              <h2>Create chatroom</h2>
              <p className="subtitle">
                You can change these settings later from the chatroom details.
              </p>
            </div>
            <div className="body">
              <div className="field">
                <label htmlFor="title">Name</label>
                <input
                  {...register("title")}
                  id="title"
                  css={fieldStyles(theme)}
                  type="text"
                  placeholder="e.g. Study group"
                  maxLength={20}
                  required
                  autoFocus
                />
                <p className="hint">Up to 20 characters.</p>
              </div>
              <div className="field">
                <label htmlFor="privacy">Who can join</label>
                <select
                  {...register("privacy")}
                  id="privacy"
                  css={fieldStyles(theme)}
                >
                  {privacyOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="hint">{privacyHint(watch("privacy"))}</p>
              </div>
            </div>
            <div className="footer">
              <div className="footerEnd">
                <button
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => setToggle(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btnPrimary"
                  type="submit"
                  disabled={!isLoggedIn}
                >
                  Create chatroom
                </button>
              </div>
            </div>
          </form>
          <ModalCloseButton
            onClose={() => setToggle(false)}
            label="Close create chatroom modal"
          />
        </Modal>
      )}
    </>
  );
};

export default NewChatButton;
