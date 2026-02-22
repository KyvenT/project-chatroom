import { useEffect } from "react";
import { wsMessageRouter } from "../../ws-router/router";
import { useParams } from "react-router";
import { getWs } from "../../ws-router/ws";

export const useWebsocketRouter = () => {
  const { chatroomId } = useParams();

  useEffect(() => {
    const ws = getWs();

    if (ws) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Message from server: ", message);
        wsMessageRouter(message, chatroomId);
      };
    }
  }, [chatroomId, getWs]);
};
