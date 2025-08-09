import { ChevronFirst, ChevronLast } from "lucide-react";
import { useOutletContext } from "react-router";
import type { SidebarContextType } from "./ChatLayout";

const ChatHome = () => {
    const {setSidebarToggled, sidebarToggled} = useOutletContext<SidebarContextType>();

    return (
        <>
            <button onClick={() => setSidebarToggled()}>{sidebarToggled ? <ChevronFirst /> : <ChevronLast />}</button>
            <h1>Welcome</h1>
        </>
    )
}

export default ChatHome;