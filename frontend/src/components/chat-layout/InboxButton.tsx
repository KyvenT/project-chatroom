import React, { useEffect } from "react";
import useAuthContext from "../../hooks/useAuthContext";
import { queryFunction } from "../../hooks/useCustomQuery";
import type { Invite, InviteResponse } from "../../types/REST-types/Invite";
import DropdownButton from "../DropdownButton";
import {
  mutationFunction,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import { iconBtnStyles } from "../Button";
import { useInvitesStore } from "../../hooks/useStores";

const InboxButton = () => {
  const { user } = useAuthContext();
  const theme = useTheme();
  const invites = useInvitesStore((state) => (state.invites));
  const setInvites = useInvitesStore((state) => (state.setInvites));

  const { data: invitesData } = useQuery<Invite[]>({
    queryKey: ["inbox", user.token],
    queryFn: () =>
      queryFunction<Invite[]>({
        fetchUrl: "http://localhost:3000/api/invite/me",
        user,
      }),
    staleTime: Infinity,
  });

  const mutation = useMutation<InviteResponse, Error, MutationArgs>({
    mutationFn: mutationFunction<InviteResponse>,
  });

  useEffect(() => {
    if (invitesData) {
      setInvites(invitesData);
    }
  }, [invitesData])

  const handleInviteResponse = (
    event: React.FormEvent,
    userAccepted: boolean,
  ) => {
    event.preventDefault();
    const inviteId = (event.target as HTMLButtonElement).form?.id;

    let status;
    if (userAccepted) {
      console.log("Invite accepted");
      status = "ACCEPTED";
    } else {
      console.log("Invite rejected");
      status = "REJECTED";
    }

    mutation.mutate({
      fetchUrl: "http://localhost:3000/api/invite/respond",
      user,
      method: "PATCH",
      reqBody: { inviteId, status },
    });
    const responseData = mutation.data;
    console.log(responseData);
  };

  return (
    <DropdownButton buttonText={<Mail />} buttonStyles={iconBtnStyles(theme)}>
      <ul>
        {invites &&
          invites.map((invite) => {
            return (
              <li key={invite.id}>
                <h5>{invite.chatroom.title}</h5>
                <p>Invited by: {invite.sender.username}</p>
                <form id={invite.id}>
                  <button
                    onClick={(event) => handleInviteResponse(event, true)}
                  >
                    Accept
                  </button>
                  <button
                    onClick={(event) => handleInviteResponse(event, false)}
                  >
                    Reject
                  </button>
                </form>
              </li>
            );
          })}
      </ul>
    </DropdownButton>
  );
};

export default InboxButton;
