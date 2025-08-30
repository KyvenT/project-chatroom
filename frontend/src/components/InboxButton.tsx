import React from "react";
import useAuthContext from "../hooks/useAuthContext";
import { queryFunction } from "../hooks/useCustomQuery";
import type { Invite, InviteResponse } from "../types/Invite";
import DropdownButton from "./DropdownButton";
import { mutationFunction, type MutationArgs } from "../hooks/useCustomMutation";
import { useMutation, useQuery } from "@tanstack/react-query";

const InboxButton = () => {
  const { user } = useAuthContext();
  const { data: invitesData } = useQuery<Invite[]>({
    queryKey: ["inbox", user.token],
    queryFn: () => queryFunction<Invite[]>({fetchUrl: "http://localhost:3000/api/invite/me", user}),
  });
  const mutation = useMutation<InviteResponse, Error, MutationArgs>({
      mutationFn: mutationFunction<InviteResponse>});

  const handleInviteResponse = (
    event: React.FormEvent,
    userAccepted: boolean,
  ) => {
    event.preventDefault();
    const inviteId = (event.target as HTMLButtonElement).form?.id;
      
    if (userAccepted) {
      console.log("Invite accepted");
      mutation.mutate({fetchUrl: "http://localhost:3000/api/invite/accept", user, method: "PATCH", reqBody: {inviteId}});
    } else {
      console.log("Invite rejected");
      mutation.mutate({fetchUrl: "http://localhost:3000/api/invite/delete", user, method: "DELETE", reqBody: {inviteId}});
    }
    const responseData = mutation.data;
    console.log(responseData);
  };

  return (
    <DropdownButton buttonText="Inbox">
      <ul>
        {invitesData &&
          invitesData.map((invite) => {
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
