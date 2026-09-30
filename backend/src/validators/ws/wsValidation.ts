import z from "zod";
import { WSMessageTypes } from "../../types/ws-messages.js";

export const MAX_MESSAGE_LENGTH = 60;

export const AuthMessageSchema = z.object({
  type: z.literal(WSMessageTypes.Auth),
  token: z.string(),
});

export const ChatMessageSchema = z.object({
  type: z.literal(WSMessageTypes.Message),
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  chatroomId: z.string(),
});

export const UpdateActiveChatroomMessageSchema = z.object({
  type: z.literal(WSMessageTypes.UpdateActiveChatroom),
  chatroomId: z.string(),
});

export const TypingPresenceMessageSchema = z.object({
  type: z.literal(WSMessageTypes.TypingPresence),
  chatroomId: z.string(),
});

export const UpdateLastViewedAtMessageSchema = z.object({
  type: z.literal(WSMessageTypes.UpdateLastViewedAt),
  chatroomId: z.string(),
});

// the chatrooms a client has open besides its active one (chat pop-outs)
export const UpdateWatchedChatroomsMessageSchema = z.object({
  type: z.literal(WSMessageTypes.UpdateWatchedChatrooms),
  chatroomIds: z.array(z.string()).max(10),
});

export const WSMessageSchema = z.discriminatedUnion("type", [
  AuthMessageSchema,
  ChatMessageSchema,
  UpdateActiveChatroomMessageSchema,
  TypingPresenceMessageSchema,
  UpdateLastViewedAtMessageSchema,
  UpdateWatchedChatroomsMessageSchema,
]);
