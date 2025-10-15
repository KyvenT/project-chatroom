import { useEffect } from "react";
import useWebSocketContext from "../useWebSocketContext";
import { useParams } from "react-router";
import useAuthContext from "../useAuthContext";

export const useUpdateActiveChatroom = () => {
  const { ws } = useWebSocketContext();
  const { chatroomId } = useParams();
  const { isLoggedIn } = useAuthContext();

  useEffect(() => {
    if (isLoggedIn && ws) {
      if (chatroomId) {
        ws.send(
          JSON.stringify({
            type: "update-active-chatroom",
            chatroomId,
          }),
        );
      } else {
        ws.send(
          JSON.stringify({
            type: "update-active-chatroom",
            chatroomId: "home",
          }),
        );
      }
    }
  }, [isLoggedIn, ws, chatroomId]);
};
