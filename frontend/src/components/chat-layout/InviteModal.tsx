import Modal, { closeButtonStyles } from "../Modal";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ConfirmationResponse,
  Invite,
} from "../../types/REST-types/Invite";
import {
  verifiedMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import { css, useTheme } from "@emotion/react";
import type { UserAuth } from "../../types/REST-types/User";
import type { Theme } from "@emotion/react";
import { verifiedQuery } from "../../hooks/useCustomQuery";
import Button from "../Button";
import { useState } from "react";
import { Send, X } from "lucide-react";
import { API_URL } from "../../env";
import { mq } from "../../styles/breakpoints";

const dialogStyles = (theme: Theme) =>
  css(
    mq({
      width: ["80%", "60%", "40%", "30%"],
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      backgroundColor: theme.colors.dark_grey,
      borderRadius: "10px",
      padding: "30px",
      border: `1px solid ${theme.colors.white}`,

      "h3, h5": {
        color: theme.colors.white,
        userSelect: "none",
        fontWeight: 400,
      },

      h3: {
        fontSize: "1.2rem",
      },

      h5: {
        fontSize: "1.05rem",
      },

      "#inviteForm": {
        display: "flex",
        border: `1px solid ${theme.colors.white}`,
        padding: "4px",
        borderRadius: "8px",

        input: {
          flex: 1,
          minWidth: 0,
          backgroundColor: "transparent",
          color: theme.colors.white,
          fontSize: "1rem",
          border: 0,
        },

        "input:focus": {
          outline: 0,
        },

        ".inviteBtn": {},
      },

      ".inviteErrorMessage": {
        color: "red",
      },
    }),
  );

const inviteListStyles = css({
  ul: {
    overflowY: "scroll",
    minHeight: "100px",
    maxHeight: "200px",
    padding: "8px",
    borderRadius: "8px",
  },

  ".inviteStatus": {
    display: "flex",
    justifyContent: "space-between",
  },
});

const inviteListColors = (theme: Theme) =>
  css({
    ul: {
      border: `1px solid ${theme.colors.white}`,
      color: theme.colors.light_grey,
      scrollbarColor: `${theme.colors.light_grey} transparent`,

      li: {},

      "li:hover": {
        color: theme.colors.white,
      },
    },
  });

export interface inviteFormInput {
  username: string;
}

interface InviteModalProps {
  inviteModalOpen: boolean;
  title: string;
  onClose: () => void;
  canInvite: boolean;
  user: UserAuth;
  chatroomId: string;
}

export const InviteModal = ({
  inviteModalOpen,
  title,
  onClose,
  canInvite,
  chatroomId,
}: InviteModalProps) => {
  const { register, handleSubmit } = useForm<inviteFormInput>();
  const [inviteError, setInviteError] = useState<string>("");
  const theme = useTheme();
  const { data: invitesData, refetch } = useQuery<Invite[]>({
    queryKey: ["inviteList", chatroomId],
    queryFn: () =>
      verifiedQuery({
        fetchUrl: `${API_URL}/api/invites/${chatroomId}`,
      }),
    enabled: !!inviteModalOpen,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const { mutate } = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: verifiedMutation<ConfirmationResponse>,
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      setInviteError(err.message);
    },
  });

  const onSubmit: SubmitHandler<inviteFormInput> = (formData) => {
    if (!canInvite) {
      return;
    }
    const { username } = formData;
    mutate({
      fetchUrl: `${API_URL}/api/invites/`,
      method: "POST",
      reqBody: {
        receiverUsername: username,
        chatroomId,
      },
    });
  };

  return (
    <Modal
      modalStyles={dialogStyles(theme)}
      open={inviteModalOpen}
      onClose={onClose}
    >
      <h3>Invite to {title}</h3>
      <form id="inviteForm" onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("username")}
          id="username"
          placeholder="Invite user..."
        />
        <Button
          type="submit"
          disabled={!canInvite}
          variant="icon"
          className="inviteBtn"
        >
          <Send size="1rem" />
        </Button>
      </form>
      <span className="inviteErrorMessage">{inviteError}</span>
      <div css={[inviteListStyles, inviteListColors(theme)]}>
        <h5>Invited users: </h5>
        <ul>
          {invitesData?.map((invite) => (
            <li key={invite.id} className="invitedUser">
              <div>
                <h4>{invite.receiver.username}</h4>
                <div className="inviteStatus">
                  <p>Status: {invite.status}</p>
                  {invite.status === "REJECTED" && (
                    <Button
                      onClick={() =>
                        onSubmit({ username: invite.receiver.username })
                      }
                    >
                      Reinvite
                    </Button>
                  )}
                </div>
                <p>Invited at: {new Date(invite.sentAt).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Button
        css={closeButtonStyles(theme)}
        variant="icon"
        onClick={onClose}
        aria-label="Close invite modal"
      >
        <X />
      </Button>
    </Modal>
  );
};
