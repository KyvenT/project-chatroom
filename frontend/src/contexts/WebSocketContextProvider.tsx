import { createContext, useEffect, useState } from "react";
import useAuthContext from "../hooks/useAuthContext";

interface WebSockContextProviderProps {
  children: React.ReactNode;
}

interface WebSocketContextType {
  ws: WebSocket | null;
  setWs: (ws: WebSocket) => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(
  null
);

export default function WebSocketContextProvider({
  children,
}: WebSockContextProviderProps) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (ws) {
      ws.onopen = () => {
        console.log("WebSocket connection established");
      };
      ws.onerror = (error) => {
        console.error(`WebSocket error: ${error}`);
      };
    }
    return () => {
      if (ws) {
        ws.close();
        console.log("WebSocket connection closed");
      }
    };
  }, []);

  useEffect(() => {
    if (!user.userId) {
      ws?.close();
      setWs(null);
    }
  }, [user.userId]);

  return (
    <WebSocketContext.Provider
      value={{
        ws,
        setWs,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
