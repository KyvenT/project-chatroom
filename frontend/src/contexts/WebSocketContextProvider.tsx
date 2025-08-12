import { createContext, useEffect, useState } from "react";

interface WebSockContextProviderProps {
    children: React.ReactNode;
}

interface WebSocketContextType {
    ws: WebSocket | null;
    handleWSAuth: (token: string) => void;
    closeWS: () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export default function WebSocketContextProvider({ children }: WebSockContextProviderProps) {
    const [ws, setWs] = useState<WebSocket | null>(null);

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

    useEffect(() => {
        if (ws) {
            ws.onopen = () => {
                console.log('WebSocket connection established');
            };
            ws.onmessage = (event) => {
                console.log(`Message from server: ${event.data}`);
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

    return <WebSocketContext.Provider value={{ ws, handleWSAuth, closeWS }}>
        {children}
    </WebSocketContext.Provider>
}