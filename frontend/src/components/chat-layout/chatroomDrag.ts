import type React from "react";
import type { Chatroom } from "../../types/REST-types/Chatroom";

// Sidebar chatrooms are dragged as { firstChatroom: Chatroom } JSON

export const setDraggedChatroom = (
  event: React.DragEvent,
  chatroom: Chatroom,
) =>
  event.dataTransfer.setData(
    "application/json",
    JSON.stringify({ firstChatroom: chatroom }),
  );

export const readDraggedChatroom = (
  event: React.DragEvent,
): Chatroom | null => {
  try {
    const { firstChatroom } = JSON.parse(
      event.dataTransfer.getData("application/json"),
    );
    return firstChatroom?.chatroomId ? firstChatroom : null;
  } catch {
    // something other than a sidebar chatroom was dropped
    return null;
  }
};

export const readDraggedChatroomId = (event: React.DragEvent) =>
  readDraggedChatroom(event)?.chatroomId ?? null;
