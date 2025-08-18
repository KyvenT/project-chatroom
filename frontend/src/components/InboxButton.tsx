import useAuthContext from "../hooks/useAuthContext";
import { useCustomQuery } from "../hooks/useCustomQuery";
import type { Invite } from "../types/Invite";
import DropdownButton from "./DropdownButton";

const InboxButton = () => {
    const { user } = useAuthContext();
    const { data } = useCustomQuery<Invite>(["inbox", user.token], "invite");

    const handleInviteResponse = (isAccepted: boolean) => {
        if (isAccepted) {
            
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