import { createContext, useEffect, useState } from "react";
import type { Message } from "../types/Message";
import type { wsEventQueuesType } from "../ws-router/ws-message-router";

interface WebSockContextProviderProps {
    children: React.ReactNode;
}

interface WebSocketContextType {
    ws: WebSocket | null;
    handleWSAuth: (token: string) => void;
    closeWS: () => void;
    wsEventQueues: wsEventQueuesType;
    setWsEventQueues: React.Dispatch<React.SetStateAction<wsEventQueuesType>>;
    clearMessageQueue: () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export default function WebSocketContextProvider({ children }: WebSockContextProviderProps) {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [wsEventQueues, setWsEventQueues] = useState<wsEventQueuesType>({
        messageQueue: [] as Message[],
    });

    useEffect(() => {
        if (ws) {
            ws.onopen = () => {
                console.log('WebSocket connection established');
            };
            ws.onclose = () => {
                console.log('WebSocket connection closed');
            };
            ws.onerror = (error) => {
                console.error(`WebSocket error: ${error}`);
            };
        }
        return () => {
            if (ws) {
            ws.close();
            console.log('WebSocket connection closed');
            }
        };
    }, [ws]);

    const handleWSAuth = (token: string) => {
        if (ws) {
            ws.close();
        }
        const newWs = new WebSocket('ws://localhost:3000');

        newWs.onopen = () => {
            newWs.send(JSON.stringify({
                type: "auth",
                token 
            }));
            setWs(newWs);
        };

    }

    const closeWS = () => {
        ws?.close();
    }

    const clearMessageQueue = () => {
        setWsEventQueues((prev) => ({...prev, messageQueue: [] as Message[]}));
    }

    return <WebSocketContext.Provider value={{ ws, handleWSAuth, closeWS, wsEventQueues, setWsEventQueues, clearMessageQueue }}>
        {children}
    </WebSocketContext.Provider>
}