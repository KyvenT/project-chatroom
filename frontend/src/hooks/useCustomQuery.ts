import { useQuery, type UndefinedInitialDataOptions } from "@tanstack/react-query";
import useAuthContext from "./useAuthContext";

export const ResourceType = {
    INVITE: "invite",
    CHATROOM: "chatroom",
    USER: "user",
    MESSAGE: "message",
    MEMBER: "member",
} as const;

export const useCustomQuery = <T>(queryKeys: string[], resource: string, chatroomId?: string, getBefore?: Date, queryOptions?: string[]) => {
    const { isLoggedIn, user } = useAuthContext();

    let fetchUrl = "";
    switch (resource) {
        case ResourceType.INVITE:
            fetchUrl = "http://localhost:3000/api/invite/me";
            break;
        case ResourceType.CHATROOM:
            fetchUrl = "http://localhost:3000/api/chatroom/me";
            break;
        case ResourceType.USER:
            fetchUrl = "http://localhost:3000/api/user/me";
            break;
        case ResourceType.MESSAGE:
            fetchUrl = "http://localhost:3000/api/messages/" + chatroomId + "/" + getBefore?.toISOString();
            break;
        case ResourceType.MEMBER:
            if (!chatroomId) {
                throw new Error("Chatroom ID is required for member queries");
            }
            fetchUrl = "http://localhost:3000/api/members/" + chatroomId;
            break;
        default:
            throw new Error("Invalid resource type");
    }

    return useQuery({
        queryKey: ["customQuery", ...queryKeys],
        queryFn: async () => {
            console.log("fetching " + resource);
            if (!isLoggedIn) {
                return [];
            }
            const res = await fetch(fetchUrl, {
                headers: {
                    "Content-Type": "application/json",
                    "authorization": "Bearer " + user.token
                }
            });
            if (!res.ok) {
                console.error(res);
                return [];
            }
            return await res.json() as T[];
        },
        staleTime: Infinity,
    })
}