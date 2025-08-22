import type { Message } from "../../types/Message";
import type { wsEventQueuesType } from "../ws-message-router";

export const handleChatMessage = (setEventQueues: 
    React.Dispatch<React.SetStateAction<wsEventQueuesType>>,
            message: any) => {
    const newMessage: Message = {
        id: message.id,
        content: message.content,
        chatroomId: message.chatroomId,
        senderUserId: message.senderUserId,
        createdAt: message.createdAt,
        senderUser: {
            username: message.senderUser.username,
        },
        editedAt: message.editedAt,
    };
    setEventQueues((prevEventQueues) => ({
        ...prevEventQueues,
        messageQueue: [...prevEventQueues.messageQueue, newMessage]
    }));
}