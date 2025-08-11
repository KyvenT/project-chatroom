import jwt from "jsonwebtoken";
import { socketMap } from "../../lib/socketMaps.js";
import env from "../../env.js";
import WebSocket from "ws";

export const authenticateSocket = (message: any, ws: WebSocket) => {
    console.log("currently authenticated websockets: ");
    socketMap.forEach((value, key) => {
        console.log(key + ": " + value);
    })
    console.log("authenticating websocket");
    jwt.verify(message.token, env.JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                ws.send(JSON.stringify({error: "Expired token"}));
                return;
            }
            ws.send(JSON.stringify({error: err}));
            return;
        }

        if (!decoded.userId || !decoded.isUser) {
            ws.send(JSON.stringify({error: "Error decrypting token"}));
            return;
        }

        const {userId, isUser} = decoded;

        console.log("websocket jwt verified: " + userId + ", isUser: " + isUser);
        socketMap.set({userId, isUser}, ws);
    })
}