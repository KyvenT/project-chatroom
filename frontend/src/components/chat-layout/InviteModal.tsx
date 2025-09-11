import Modal, { closeButtonStyles } from "../Modal";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Invite } from "../../types/REST-types/Invite";
import {
  mutationFunction,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import { css, useTheme } from "@emotion/react";
import type { UserAuth } from "../../types/REST-types/User";
import type { Theme } from "@emotion/react";
import { queryFunction } from "../../hooks/useCustomQuery";
import Button from "../Button";
import { useEffect } from "react";

const dialogStyles = css({
  gap: "10px",
  backgroundColor: "white",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  padding: "30px",
});

const styles = css({
  border: "1px solid black",
  overflowY: "scroll",
  maxHeight: "200px",

  ".inviteStatus": {
    display: "flex",
    justifyContent: "space-between",
  },
});

const colors = (theme: Theme) => css({});

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
  user,
  chatroomId,
}: InviteModalProps) => {
  const { register, handleSubmit } = useForm<inviteFormInput>();
  const theme = useTheme();
  const { data: invitesData, refetch } = useQuery<Invite[]>({
    queryKey: ["inviteList", chatroomId],
    queryFn: () =>
      queryFunction({
        fetchUrl: "http://localhost:3000/api/invites/" + chatroomId,
        method: "GET",
        user,
      }),
    enabled: inviteModalOpen,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const mutation = useMutation<Invite, Error, MutationArgs>({
    mutationFn: mutationFunction<Invite>,
  });

  useEffect(() => {
    refetch();
  }, [mutation.isSuccess]);

  const onSubmit: SubmitHandler<inviteFormInput> = (formData) => {
    if (!canInvite) {
      return;
    }
    const { username } = formData;
    mutation.mutate({
      fetchUrl: "http://localhost:3000/api/invites/send",
      method: "POST",
      user,
      reqBody: {
        receiverUsername: username,
        chatroomId,
      },
    });
  };

  return (
    <Modal modalStyles={dialogStyles} open={inviteModalOpen} onClose={onClose}>
      <h3>Invite to {title}</h3>
      <form id="inviteForm" onSubmit={handleSubmit(onSubmit)}>
        <input {...register("username")} placeholder="Invite user..." />
        <button type="submit" disabled={!canInvite}>
          Invite
        </button>
      </form>
      {inviteModalOpen && (
        <>
          <h5>Invited users: </h5>
          <ul css={[styles, colors(theme)]}>
            {invitesData?.map((invite) => (
              <li key={invite.id}>
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
        </>
      )}
      <button css={closeButtonStyles} onClick={onClose}>
        X
      </button>
    </Modal>
  );
};
