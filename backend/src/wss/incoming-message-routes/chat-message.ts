import Prisma from "../../prisma/prisma.js";
import WebSocket from "ws";
import { ChatMessage } from "../../types/ws-messages.js";
import { socketMap } from "../../lib/socketMaps.js";
import { type Message } from "@prisma/client";
import { MessagePayload } from "../../types/payloads.js";
import { sendChatMessage } from "../outgoing-messages/chat-message.js";

const createMessage = async (
  userId: string,
  message: ChatMessage,
  ws: WebSocket
): Promise<MessagePayload | undefined> => {
  try {
    const createdMessage = (await Prisma.message.create({
      data: {
        content: message.content,
        chatroomId: message.chatroomId,
        senderUserId: userId,
      },
      include: {
        senderUser: {
          select: {
            username: true,
          },
        },
      },
    })) as Message & { senderUser: { username: string } };

    ws.send(
      JSON.stringify({
        type: "feedback",
        message:
          "message sent (" +
          createdMessage.id +
          ", " +
          createdMessage.createdAt +
          ")",
      })
    );
    return createdMessage;
  } catch (err) {
    console.error(err);
    ws.send(
      JSON.stringify({
        type: "feedback",
        message: "message failed to send (" + err + ")",
      })
    );
  }
};

export const handleChatMessage = async (
  message: ChatMessage,
  ws: WebSocket
) => {
  console.log(message.content);
  const user = socketMap.getByValue(ws);

  if (!user) {
    console.error("uh oh socket not mapped to a user");
    return;
  }
  const createdMessage = await createMessage(user, message, ws);
  if (!createdMessage) {
    console.error("message creation failed");
    return;
  }
  sendChatMessage(createdMessage);
};
