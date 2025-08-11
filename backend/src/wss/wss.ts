import env from '../env.js';
import { WebSocketServer } from 'ws';
import jwt from "jsonwebtoken";
import { userSocketMap, guestSocketMap } from '../lib/socketMaps.js';
import { IncomingMessage, Server, ServerResponse } from 'http';

export const startWSS = (server: Server<typeof IncomingMessage, typeof ServerResponse>) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('New client connected');
        
        ws.on('message', (data: string) => {
            const message = JSON.parse(data);
            console.log(`Received message: ${message.type}`);
            switch (message.type) {
                case "auth":
                    console.log("currently authenticated websockets: ");
                    userSocketMap.forEach((value, key) => {
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
                        if (isUser) {
                            userSocketMap.set(userId, ws);
                        } else {
                            guestSocketMap.set(userId, ws);
                        }
                    })
                    break;
                case "message":
                    console.log(message.content);
                    break;
                default: 
                    console.log("uncaught message: " + message);
            }
        })
        ws.on('close', () => {
            console.log('Client disconnected');
            if (userSocketMap.hasValue(ws)) {
                const userId = userSocketMap.getByValue(ws);
                userSocketMap.deleteByValue(ws);
                console.log('user logged out: ' + userId);
            }
            if (guestSocketMap.hasValue(ws)) {
                const guestId = userSocketMap.getByValue(ws);
                guestSocketMap.deleteByValue(ws);
                console.log('guest logged out: ' + guestId);
            }
        });
    });
}