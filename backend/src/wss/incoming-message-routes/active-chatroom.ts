import WebSocket from "ws";
import { socketMap, userActiveChatroomMap } from "../../lib/socketMaps.js";
import { UpdateActiveChatroomMessage } from "../../types/ws-messages.js";
import { isChatroomMember } from "../membership.js";

export const updateActiveChatroom = async (
  message: UpdateActiveChatroomMessage,
  ws: WebSocket,
) => {
  try {
    const userId = socketMap.getByValue(ws);
    if (!userId) {
      ws.send(JSON.stringify({ error: "User not authenticated" }));
      return;
    }
    const { chatroomId } = message;

    // "home" (no chatroom open) is always allowed; a chatroom has to be one
    // the user is in, or they'd get its messages live
    if (chatroomId !== "home" && !(await isChatroomMember(userId, chatroomId))) {
      userActiveChatroomMap.deleteByKey(userId);
      ws.send(
        JSON.stringify({
          type: "feedback",
          message: "Not a member of chatroom " + chatroomId,
        }),
      );
      return;
    }

    userActiveChatroomMap.set(userId, chatroomId);

    console.log(
      "Updated active chatroom for user " + userId + " to " + chatroomId,
    );
    console.log("Current active chatrooms: ");
    userActiveChatroomMap.forEach((value, key) => {
      console.log(key + ": " + value);
    });
    ws.send(
      JSON.stringify({
        type: "feedback",
        message: "Active chatroom updated to " + chatroomId,
      }),
    );
  } catch (err) {
    console.error(err);
    ws.send(
      JSON.stringify({ error: "Failed to update active chatroom: " + err }),
    );
  }
};
