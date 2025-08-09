import useAuthContext from "../hooks/useAuthContext";
import DropdownButton from "./DropdownButton";
import { useQuery } from "@tanstack/react-query";

const InboxButton = () => {
    const { isLoggedIn, user } = useAuthContext();
    const { data } = useQuery({
        queryKey: ["inbox", user.token],
        queryFn: async () => {
            console.log("fetching invites");
            if (!isLoggedIn) {
                return;
            }
            const res = await fetch("http://localhost:3000/api/invite/me", {
                headers: {
                    "Content-Type": "application/json",
                    "authorization": "Bearer " + user.token
                }
            });
            return res.json();
        },
        refetchOnMount: false, 
        refetchOnWindowFocus: false
    })
    console.log("invites: " + data);

    return (
        <DropdownButton buttonText="Inbox">
            <ul>
                <li>Message 1</li>
                <li>Message 2</li>
                <li>Message 3</li>
            </ul>
        </DropdownButton>
    )
}

export default InboxButton;