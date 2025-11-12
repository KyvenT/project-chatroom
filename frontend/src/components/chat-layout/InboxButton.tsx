import React, { useEffect } from "react";
import useAuthContext from "../../hooks/useAuthContext";
import { verifiedQuery } from "../../hooks/useCustomQuery";
import type { Invite, InviteResponse } from "../../types/REST-types/Invite";
import DropdownButton from "../DropdownButton";
import {
  verifiedMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import type { Theme } from "@emotion/react";
import { useInvitesStore } from "../../hooks/useStores";

const InboxButton = () => {
  const { user } = useAuthContext();
  const invites = useInvitesStore((state) => state.invites);
  const setInvites = useInvitesStore((state) => state.setInvites);

  const { data: invitesData } = useQuery<Invite[]>({
    queryKey: ["inbox", user.token],
    queryFn: () =>
      verifiedQuery<Invite[]>({
        fetchUrl: "http://localhost:3000/api/invites/me",
        user,
      }),
    staleTime: Infinity,
  });

  const mutation = useMutation<InviteResponse, Error, MutationArgs>({
    mutationFn: verifiedMutation<InviteResponse>,
  });

  useEffect(() => {
    if (!invitesData) return;
    setInvites(invitesData);
  }, [invitesData]);

  const handleInviteResponse = (
    event: React.FormEvent,
    userAccepted: boolean
  ) => {
    event.preventDefault();
    const inviteId = (event.target as HTMLButtonElement).form?.id;

    let status;
    if (userAccepted) {
      status = "ACCEPTED";
    } else {
      status = "REJECTED";
    }

    mutation.mutate({
      fetchUrl: "http://localhost:3000/api/invites/",
      user,
      method: "PATCH",
      reqBody: { inviteId, status },
    });
    const responseData = mutation.data;
    console.log(responseData);
  };

  return (
    <DropdownButton
      aria-label="Open invite inbox"
      buttonText={<Mail size="2.5rem" />}
      buttonVariant="icon"
    >
      {invites.length === 0 && <p className="emptyInboxMsg">All caught up!</p>}
      <ul>
        {invites.map((invite) => {
          return (
            <li key={invite.id}>
              <h5>{invite.chatroom.title}</h5>
              <p>Invited by: {invite.sender.username}</p>
              <form id={invite.id}>
                <button
                  id="accept"
                  onClick={(event) => handleInviteResponse(event, true)}
                >
                  Accept
                </button>
                <button
                  id="reject"
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
