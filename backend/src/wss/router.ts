import WebSocket from "ws";
import { authenticateSocket } from "./message-routes/auth.js";
import { handleChatMessage } from "./message-routes/message.js";
import { updateActiveChatroom } from "./message-routes/active-chatroom.js";

export const wsMessageRouter = (message: any, ws: WebSocket) => {
    switch (message.type) {
        case "auth":
            authenticateSocket(message, ws);
            break;
        case "message":
            handleChatMessage(message, ws);
            break;
        case "update-active-chatroom":
            updateActiveChatroom(message, ws);
            break;
        default: 
            console.log("uncaught message: " + message);
    }
}