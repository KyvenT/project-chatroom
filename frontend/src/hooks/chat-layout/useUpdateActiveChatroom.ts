import { useEffect } from "react";
import { useParams } from "react-router";
import { useAuthStore, isLoggedInSelector } from "../useStores";
import { sendWSMessage } from "../../ws-router/sender";

export const useUpdateActiveChatroom = () => {
  const { chatroomId } = useParams();
  const isLoggedIn = useAuthStore(isLoggedInSelector);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    if (chatroomId) {
      sendWSMessage({
        type: "update-active-chatroom",
        chatroomId,
      });
    } else {
      sendWSMessage({
        type: "update-active-chatroom",
        chatroomId: "home",
      });
    }
  }, [isLoggedIn, chatroomId]);
};
