import { useQuery } from "@tanstack/react-query";
import useAuthContext from "./useAuthContext";
import type { UserAuth } from "../types/User";

export const ResourceType = {
    INVITE: "invite",
    INVITE_RESPONSE: "invite-response",
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

const fetchWithBody = (fetchUrl: string, method: string, user: UserAuth, reqBody: {}) => {
    return fetch(fetchUrl, {
        method,
        headers: {
            "Content-Type": "application/json",
            "authorization": "Bearer " + user.token
        },
        body: JSON.stringify(reqBody)
    });
}

const query = <T>(fetchUrl: string, method: string, 
    user: UserAuth, isLoggedIn: boolean, body: {} = {}, queryKeys: string[], queryOptions?: {}) => {
    return useQuery({
            queryKey: ["customQuery", ...queryKeys],
            queryFn: async () => {
                if (!isLoggedIn) {
                    return [];
                }
                let res: Response;
                if (Object.keys(body).length === 0) {
                    res = await fetchNoBody(fetchUrl, method, user);
                } else {
                    res = await fetchWithBody(fetchUrl, method, user, body);
                }
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
    const { chatroomId, getBefore, inviteId, inviteAccepted, queryOptions } = options;

    let method = "GET";
    let reqBody: any = {};
    let fetchUrl = "";
    console.log("fetching " + resource);
    switch (resource) {
        case ResourceType.INVITE:
            fetchUrl = "http://localhost:3000/api/invite/me";
            break;
        case ResourceType.INVITE_RESPONSE:
            if (!inviteAccepted || !inviteId) {
                console.error("need id and response to respond to invites");
            }
            method = inviteAccepted ? "PATCH" : "DELETE";
            fetchUrl = inviteAccepted ? 
                "http://localhost:3000/api/invite/accept" : 
                "http://localhost:3000/api/invite/delete";
            reqBody = { inviteId };
            break;
        case ResourceType.CHATROOM:
            fetchUrl = "http://localhost:3000/api/chatroom/me";
            break;
        case ResourceType.USER:
            fetchUrl = "http://localhost:3000/api/user/me";
            break;
        case ResourceType.MESSAGE:
            if (!chatroomId || !getBefore) {
                console.error("Chatroom ID and getBefore date are required to fetch messages");
            }
            fetchUrl = "http://localhost:3000/api/messages/" + chatroomId + "/" + getBefore?.toISOString();
            break;
        case ResourceType.MEMBER:
            if (!chatroomId) {
                console.error("Chatroom ID is required to fetch chatroom members");
            }
            fetchUrl = "http://localhost:3000/api/members/" + chatroomId;
            break;
        default:
            throw new Error("Invalid resource type");
    }

    return query<T>(fetchUrl, method, user, isLoggedIn, reqBody, queryKeys, queryOptions);
}