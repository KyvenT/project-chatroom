import { useQuery } from "@tanstack/react-query";
import useAuthContext from "../hooks/useAuthContext";
import type { ChatroomMember } from "../types/ChatroomMember";
import { useParams } from "react-router";
import { useMemo } from "react";
import { BidirectionalGroupedMap } from "../lib/bidirectionGroupedMap";
import MemberStatusList from "./MemberStatusList";

const MemberList = () => {
    const {user, isLoggedIn} = useAuthContext();
    const {chatroomId} = useParams();
    const { data } = useQuery({
        queryKey: ["inbox", user.token, chatroomId],
        queryFn: async () => {
            console.log("fetching invites");
            if (!isLoggedIn || !chatroomId) {
                return [];
            }
            const res = await fetch("http://localhost:3000/api/members/" + chatroomId, {
                headers: {
                    "Content-Type": "application/json",
                    "authorization": "Bearer " + user.token
                }
            });
            if (!res.ok) {
                console.error(res);
                return [];
            }
            return await res.json() as ChatroomMember[];
        },
        staleTime: Infinity,
    })
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