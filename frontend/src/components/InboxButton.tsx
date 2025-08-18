import React, { useState } from "react";
import useAuthContext from "../hooks/useAuthContext";
import { useCustomQuery } from "../hooks/useCustomQuery";
import type { Invite, InviteResponse } from "../types/Invite";
import DropdownButton from "./DropdownButton";

const InboxButton = () => {
    const [inviteRespondedTo, setInviteRespondedTo] = useState<string | undefined>(undefined);
    const [isAccepted, setIsAccepted] = useState<boolean | undefined>(undefined);
    const { user } = useAuthContext();
    const { data: invitesData } = useCustomQuery<Invite>(["inbox", user.token], "invite");
    const { data: responseData } = useCustomQuery<InviteResponse>(
        ["accept-invite", isAccepted ? "accepted" : "rejected", 
            inviteRespondedTo ?? "not responded"], 
        "invite-response", {inviteId: inviteRespondedTo, inviteAccepted: isAccepted,
            queryOptions: { enabled: inviteRespondedTo !== undefined && isAccepted !== undefined }}); 

    const handleInviteResponse = (event: React.FormEvent, userAccepted: boolean) => {
        event.preventDefault();
        setIsAccepted(userAccepted);
        setInviteRespondedTo((event.target as HTMLButtonElement).form?.id);

        if (userAccepted) {
            console.log("Invite accepted");
            console.log(responseData);
        } else {
            console.log("Invite rejected");
            console.log(responseData);
        }
    }

    return (
        <DropdownButton buttonText="Inbox">
            <ul>
                {invitesData && invitesData.map((invite) => {
                    return <li key={invite.id}>
                        <h5>{invite.chatroom.title}</h5>
                        <p>Invited by: {invite.sender.username}</p>
                        <form id={invite.id}>
                            <button onClick={(event) => handleInviteResponse(event, true)}>Accept</button>
                            <button onClick={(event) => handleInviteResponse(event, false)}>Reject</button>
                        </form>
                    </li>
                })}
            </ul>
        </DropdownButton>
    )
}

export default InboxButton;