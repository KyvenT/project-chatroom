import { useContext } from "react";
import { WebSocketContext } from "../contexts/WebSocketContextProvider";

export default function useWebSocketContext() {
    const websocketContext = useContext(WebSocketContext);
    if (!websocketContext) {
        throw new Error("auth context provider is null")
    }
    return websocketContext;
}