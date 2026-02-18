import { useEffect } from "react";
import { useParams } from "react-router";
import { useAuthStore, isLoggedInSelector } from "../useStores";
import { getWs } from "../../ws-router/ws";

export const useUpdateActiveChatroom = () => {
  const { chatroomId } = useParams();
  const isLoggedIn = useAuthStore(isLoggedInSelector);

  useEffect(() => {
    const ws = getWs();

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
  }, [isLoggedIn, chatroomId]);
};
