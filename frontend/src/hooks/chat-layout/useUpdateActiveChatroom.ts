import { useEffect } from "react";
import { useParams } from "react-router";
import { useAuthStore, isLoggedInSelector } from "../useStores";
import { sendWSMessage } from "../../ws-router/ws";

export const useUpdateActiveChatroom = () => {
  const { chatroomId } = useParams();
  const isLoggedIn = useAuthStore(isLoggedInSelector);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    sendWSMessage({
      type: "update-active-chatroom",
      chatroomId: chatroomId ? chatroomId : "home",
    });
  }, [isLoggedIn, chatroomId]);
};
