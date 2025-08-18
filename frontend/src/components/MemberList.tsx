import { useQuery } from "@tanstack/react-query";
import useAuthContext from "../hooks/useAuthContext";
import type { ChatroomMember } from "../types/ChatroomMember";
import { useParams } from "react-router";
import { useMemo } from "react";
import { BidirectionalGroupedMap } from "../lib/bidirectionGroupedMap";
import MemberStatusList from "./MemberStatusList";
import { useCustomQuery } from "../hooks/useCustomQuery";

const MemberList = () => {
    const {user, isLoggedIn} = useAuthContext();
    const {chatroomId} = useParams();

    if (!isLoggedIn || !chatroomId) {
        return <p>Please log in to see the member list.</p>;
    }

    const { data } = useCustomQuery<ChatroomMember>(
        [user.token, chatroomId], "member", chatroomId);
        
    const memberStatusMap = useMemo(() => {
            const map = new BidirectionalGroupedMap<{userId: string, username: string}, string>()
            data?.forEach((chatMember) => 
                map.set({userId: chatMember.memberId, 
                    username: chatMember.member.username}, 
                    chatMember.member.status));
            return map;
        }
    , [data]);
    console.log("members: " + data);

    return (
        <div>
            <ul>
                <p>Online</p>
                <MemberStatusList memberStatusMap={memberStatusMap} status="ONLINE" />
                <p>Away</p>
                <MemberStatusList memberStatusMap={memberStatusMap} status="AWAY" />
                <p>Offline</p>
                <MemberStatusList memberStatusMap={memberStatusMap} status="OFFLINE" />
            </ul>
        </div>
    )
}

export default MemberList;