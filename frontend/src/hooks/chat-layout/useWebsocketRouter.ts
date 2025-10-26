import { useEffect } from "react";
import { wsMessageRouter } from "../../ws-router/router";
import useWebSocketContext from "../useWebSocketContext";
import { useNavigate, useParams } from "react-router";

export const useWebsocketRouter = () => {
  const { ws } = useWebSocketContext();
  const { chatroomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Message from server: ", message);
        wsMessageRouter(ws, message, chatroomId, navigate);
      };
      ws.onclose = () => {
        console.log("WebSocket connection closed");
        navigate("/logout");
      };
    }
  }, [ws, chatroomId, navigate]);
};
