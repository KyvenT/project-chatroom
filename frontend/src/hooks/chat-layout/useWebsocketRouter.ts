import { useEffect } from "react";
import { wsMessageRouter } from "../../ws-router/router";
import { useNavigate, useParams } from "react-router";
import { getWs } from "../../ws-router/ws";

export const useWebsocketRouter = () => {
  const { chatroomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const ws = getWs();

    if (ws) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Message from server: ", message);
        wsMessageRouter(message, chatroomId, navigate);
      };
      ws.onclose = () => {
        console.log("WebSocket connection closed");
        navigate("/logout");
      };
    }
  }, [chatroomId, navigate]);
};
