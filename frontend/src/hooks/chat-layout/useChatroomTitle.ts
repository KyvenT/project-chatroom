import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useChatroomsStore } from "../useStores";

export const useChatroomTitle = () => {
  const [chatroomTitle, setChatroomTitle] = useState<string | null>(null);
  const { chatroomId } = useParams();
  const chatrooms = useChatroomsStore((state) => state.chatrooms);

  useEffect(() => {
    if (!chatroomId) {
      setChatroomTitle(null);
      return;
    }

    const chatroom = chatrooms.find(
      (chatroom) => chatroom.chatroomId === chatroomId,
    );
    if (chatroom?.chatroomId === chatroomId) {
      setChatroomTitle(chatroom.chatroom.title);
    } else {
      setChatroomTitle(chatroomId);
    }
  }, [chatroomId, chatrooms]);

  return chatroomTitle;
};
