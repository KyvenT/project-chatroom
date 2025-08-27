import { useQuery } from "@tanstack/react-query";
import useAuthContext from "./useAuthContext";
import type { UserAuth } from "../types/User";

export const QueryResourceType = {
    INVITE: "invite",
    CHATROOM: "chatroom",
    USER: "user",
    MESSAGE: "message",
    MEMBER: "member",
} as const;

const fetchNoBody = (fetchUrl: string, method: string, user: UserAuth) => {
    return fetch(fetchUrl, {
        method,
        headers: {
            "Content-Type": "application/json",
            "authorization": "Bearer " + user.token
        }
    });
}

const query = <T>(fetchUrl: string, method: string, 
    user: UserAuth, isLoggedIn: boolean, queryKeys: string[], queryOptions?: {}) => {
    
    return useQuery({
        queryKey: ["customQuery", ...queryKeys],
        queryFn: async () => {
            if (!isLoggedIn) {
                return [];
            }
            let res = await fetchNoBody(fetchUrl, method, user);
            
            if (!res.ok) {
                console.error(res);
                return [];
            }
            return await res.json() as T[];
        },
        staleTime: Infinity,
        ...queryOptions,
    })
}

export const useCustomQuery = <T>(queryKeys: string[], 
    resource: string, 
    options: {chatroomId?: string, getBefore?: Date, inviteId?: string, 
        inviteAccepted?: boolean, queryOptions?: {}}={}) => {
    const { isLoggedIn, user } = useAuthContext();
    const { chatroomId, getBefore, queryOptions } = options;

    let method = "GET";
    let fetchUrl = "";
    console.log("fetching " + resource);
    switch (resource) {
        // fetch invites for the logged in user
        case QueryResourceType.INVITE:
            fetchUrl = "http://localhost:3000/api/invite/me";
            break;
        // get joined chatrooms for the logged in user
        case QueryResourceType.CHATROOM:
            fetchUrl = "http://localhost:3000/api/chatroom/me";
            break;
        // get info for the logged in user
        case QueryResourceType.USER:
            fetchUrl = "http://localhost:3000/api/user/me";
            break;
        // get message history for a chatroom before date time
        case QueryResourceType.MESSAGE:
            if (!chatroomId || !getBefore) {
                console.error("Chatroom ID and getBefore date are required to fetch messages");
            }
            fetchUrl = "http://localhost:3000/api/messages/" + chatroomId + "/" + getBefore?.toISOString();
            break;
        // get members of a chatroom
        case QueryResourceType.MEMBER:
            if (!chatroomId) {
                console.error("Chatroom ID is required to fetch chatroom members");
            }
            fetchUrl = "http://localhost:3000/api/members/" + chatroomId;
            break;
        default:
            throw new Error("Invalid resource type");
    }

    return query<T>(fetchUrl, method, user, isLoggedIn, queryKeys, queryOptions);
}