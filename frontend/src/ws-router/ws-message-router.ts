import type { Message } from "../types/Message";

export interface wsEventQueuesType {
  messageQueue: Message[],
}

export const wsMessageRouter = (eventQueues: wsEventQueuesType, 
            setEventQueues: React.Dispatch<React.SetStateAction<wsEventQueuesType>>,
            message: any) => {

    switch (message.type) {
        case "auth":
            console.log("Authentication message received");
            break;
        case "chat-message":
            const newMessage: Message = {
                id: message.message.id,
                content: message.message.content,
                chatroomId: message.message.chatroomId,
                senderUserId: message.message.senderUserId,
                createdAt: message.message.createdAt,
                senderUser: {
                    username: message.message.senderUser.username,
                },
                editedAt: message.message.editedAt,
            };
            const queue = eventQueues.messageQueue;
            queue.push(newMessage);
            setEventQueues((prevEventQueues) => ({
                ...prevEventQueues,
                messageQueue: queue
            }));
            break;
        default:
            console.log("Unknown message type: " + message.type);
    }
}