import Modal, { ModalCloseButton } from "../Modal";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ConfirmationResponse,
  Invite,
} from "../../types/REST-types/Invite";
import { customMutation, type MutationArgs } from "../../utils/customMutation";
import { css, useTheme } from "@emotion/react";
import type { UserAuth } from "../../types/REST-types/User";
import type { Theme } from "@emotion/react";
import { customQuery } from "../../utils/customQuery";
import { useState } from "react";
import { Send } from "lucide-react";
import { API_URL } from "../../env";
import { fieldStyles, formModalStyles } from "../../styles/modalForm";

const inviteModalStyles = (theme: Theme) =>
  css(formModalStyles(theme), {
    ".inviteRow": {
      display: "flex",
      gap: "8px",

      input: {
        flex: 1,
        minWidth: 0,
      },
    },

    ".sendBtn": {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },

    ".invitedUser": {
      display: "flex",
      flexDirection: "column",
      minWidth: 0,

      strong: {
        fontWeight: 500,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },

    ".inviteActions": {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },

    ".reinviteBtn": {
      padding: "4px 10px",
      fontSize: "0.8rem",
    },
  });

const statusBadge: Record<
  Invite["status"],
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "badge" },
  ACCEPTED: { label: "Accepted", className: "badge badgeSuccess" },
  REJECTED: { label: "Declined", className: "badge badgeDanger" },
};

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
      customQuery({
        fetchUrl: `${API_URL}/api/invites/${chatroomId}`,
      }),
    enabled: !!inviteModalOpen,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const { mutate, isPending } = useMutation<
    ConfirmationResponse,
    Error,
    MutationArgs
  >({
    mutationFn: customMutation<ConfirmationResponse>,
    onSuccess: () => {
      setInviteError("");
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
      modalStyles={inviteModalStyles(theme)}
      open={inviteModalOpen}
      onClose={onClose}
    >
      <div className="header">
        <p className="eyebrow">Invite people</p>
        <h2>{title}</h2>
      </div>
      <div className="body">
        <form className="field" onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="username">Username</label>
          <div className="inviteRow">
            <input
              {...register("username")}
              id="username"
              css={fieldStyles(theme)}
              placeholder="Enter a username"
              autoComplete="off"
              disabled={!canInvite}
              required
            />
            <button
              type="submit"
              className="btn btnPrimary sendBtn"
              disabled={!canInvite || isPending}
            >
              <Send size="1rem" />
              {isPending ? "Inviting..." : "Invite"}
            </button>
          </div>
          {inviteError ? (
            <p className="errorText">{inviteError}</p>
          ) : (
            !canInvite && (
              <p className="hint">
                Only the owner can invite people to this chatroom.
              </p>
            )
          )}
        </form>

        <div className="field">
          <p className="sectionLabel">Invited</p>
          <ul className="list">
            {!invitesData || invitesData.length === 0 ? (
              <li className="listEmpty">No one has been invited yet.</li>
            ) : (
              invitesData.map((invite) => (
                <li key={invite.id} className="listRow">
                  <div className="invitedUser">
                    <strong>{invite.receiver.username}</strong>
                    <span className="hint">
                      Invited{" "}
                      {new Date(invite.sentAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="inviteActions">
                    {invite.status === "REJECTED" && canInvite && (
                      <button
                        type="button"
                        className="btn btnSecondary reinviteBtn"
                        onClick={() =>
                          onSubmit({ username: invite.receiver.username })
                        }
                      >
                        Reinvite
                      </button>
                    )}
                    <span className={statusBadge[invite.status].className}>
                      {statusBadge[invite.status].label}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      <ModalCloseButton onClose={onClose} label="Close invite modal" />
    </Modal>
  );
};
