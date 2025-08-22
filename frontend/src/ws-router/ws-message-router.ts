import type { Invite } from "../types/Invite";
import type { Message } from "../types/Message";
import { handleChatMessage } from "./ws-routes/chat-message";

export interface wsEventQueuesType {
    messageQueue: Message[],
    inviteQueue: Invite[],
}

export const wsMessageRouter = (eventQueues: wsEventQueuesType, 
            setEventQueues: React.Dispatch<React.SetStateAction<wsEventQueuesType>>,
            message: any) => {
          
    switch (message.type) {
        case "auth":
            console.log("Authentication message received");
            break;
        case "chat-message":
            handleChatMessage(setEventQueues, message.message);
            break;
        case "invite":
            const newInvite: Invite = {
                id: message.invite.id,
                chatroomId: message.invite.chatroomId,
                senderId: message.invite.senderUserId,
                receiverId: message.invite.recipientUserId,
                sentAt: message.invite.createdAt,
                sender: {
                    username: message.invite.senderUser.username,
                },
                chatroom: {
                    title: message.invite.chatroom.title,
                },
                status: message.invite.status,
            };
            setEventQueues((prevEventQueues) => ({
                ...prevEventQueues,
                inviteQueue: [...prevEventQueues.inviteQueue, newInvite]
            }));
            break;
        default:
            console.log("Unknown message type: " + message.type);
    }
}