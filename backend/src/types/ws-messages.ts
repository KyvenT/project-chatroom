import z from "zod";
import {
  AuthMessageSchema,
  ChatMessageSchema,
  TypingPresenceMessageSchema,
  UpdateActiveChatroomMessageSchema,
  UpdateLastViewedAtMessageSchema,
  UpdateWatchedChatroomsMessageSchema,
  WSMessageSchema,
} from "../validators/ws/wsValidation.js";

export enum WSMessageTypes {
  Auth = "auth",
  Message = "message",
  UpdateActiveChatroom = "update-active-chatroom",
  TypingPresence = "typing-presence",
  UpdateLastViewedAt = "update-last-viewed-at",
  UpdateWatchedChatrooms = "update-watched-chatrooms",
}

export type AuthMessage = z.infer<typeof AuthMessageSchema>;

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export type UpdateActiveChatroomMessage = z.infer<
  typeof UpdateActiveChatroomMessageSchema
>;

export type TypingPresenceMessage = z.infer<typeof TypingPresenceMessageSchema>;

export type UpdateLastViewedAtMessage = z.infer<
  typeof UpdateLastViewedAtMessageSchema
>;

export type UpdateWatchedChatroomsMessage = z.infer<
  typeof UpdateWatchedChatroomsMessageSchema
>;

export type WSMessage = z.infer<typeof WSMessageSchema>;
