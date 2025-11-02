import { createContext, useEffect, useState } from "react";

interface WebSockContextProviderProps {
  children: React.ReactNode;
}

interface WebSocketContextType {
  ws: WebSocket | null;
  setWs: (ws: WebSocket) => void;
  closeWS: () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(
  null,
);

export default function WebSocketContextProvider({
  children,
}: WebSockContextProviderProps) {
  const [ws, setWs] = useState<WebSocket | null>(null);

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
  }, [ws]);

  const closeWS = () => {
    ws?.close();
    setWs(null);
  };

  return (
    <WebSocketContext.Provider
      value={{
        ws,
        setWs,
        closeWS,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
