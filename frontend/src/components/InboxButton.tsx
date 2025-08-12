import useAuthContext from "../hooks/useAuthContext";
import type { Invite } from "../types/Invite";
import DropdownButton from "./DropdownButton";
import { useQuery } from "@tanstack/react-query";

const InboxButton = () => {
    const { isLoggedIn, user } = useAuthContext();
    const { data } = useQuery({
        queryKey: ["inbox", user.token],
        queryFn: async () => {
            console.log("fetching invites");
            if (!isLoggedIn) {
                return [];
            }
            const res = await fetch("http://localhost:3000/api/invite/me", {
                headers: {
                    "Content-Type": "application/json",
                    "authorization": "Bearer " + user.token
                }
            });
            if (!res.ok) {
                console.error(res);
                return [];
            }
            return await res.json() as Invite[];
        },
        staleTime: Infinity,
    })
    console.log("invites: " + data);

    const handleInviteResponse = (isAccepted: boolean) => {
        if (!isAccepted) {

        }

    }

    return (
        <DropdownButton buttonText="Inbox">
            <ul>
                {data && data.map((invite) => {
                    return <li key={invite.id}>
                        <h5>{invite.chatroom.title}</h5>
                        <p>Invited by: {invite.sender.username}</p>
                        <form id={invite.id}>
                            <button onClick={() => handleInviteResponse(true)}>Accept</button>
                            <button onClick={() => handleInviteResponse(false)}>Reject</button>
                        </form>
                    </li>
                })}
            </ul>
        </DropdownButton>
    )
}

export default InboxButton;