import Prisma from "../../prisma/prisma.js";
import WebSocket from "ws";
import { ChatMessage } from "../../types/express/ws-messages.js";
import { socketMap } from "../../lib/socketMaps.js";

export const handleChatMessage = async (message: ChatMessage, ws: WebSocket) => {
    console.log(message.content);
    const user = socketMap.getByValue(ws);

    if (!user) {
        console.error("uh oh socket not mapped to a user");
        return;
    }

    try {
        let createdMessage;
        if (user.isUser) {
            createdMessage = await Prisma.message.create({
                data: {
                    content: message.content,
                    chatroomId: message.chatroomId,
                    senderUserId: user.userId
                }
            })
        } else {
            createdMessage = await Prisma.message.create({
                data: {
                    content: message.content,
                    chatroomId: message.chatroomId,
                    senderGuestId: user.userId
                }
            })
        }
        ws.send(JSON.stringify({
            type: "feedback", 
            message: "message sent (" + createdMessage.id + ", " + createdMessage.createdAt + ")"
        }))
    } catch (err) {
        console.error(err);
        ws.send(JSON.stringify({
            type: "feedback",
            message: "message failed to send (" + err + ")"
        }))
    }
}