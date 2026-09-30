import { socketMap } from "../../lib/socketMaps.js";
import WebSocket from "ws";
import { AuthMessage } from "../../types/ws-messages.js";
import { verifyAccessToken } from "../../lib/accessToken.js";
import { socketSessions } from "../../lib/socketSessions.js";
import Prisma from "../../prisma.js";

const fail = (ws: WebSocket, error: string) =>
  ws.send(JSON.stringify({ type: "auth", success: false, error }));

export const authenticateSocket = async (
  message: AuthMessage,
  ws: WebSocket,
) => {
  const result = verifyAccessToken(message.token);

  if (!result.ok) return fail(ws, result.error);
  if (!result.sessionId) return fail(ws, "Invalid token");

  // the token may outlive its session by up to its expiry time
  const session = await Prisma.session.findUnique({
    where: { id: result.sessionId },
    select: { userId: true, revokedAt: true, expiresAt: true },
  });

  if (
    !session ||
    session.userId !== result.userId ||
    session.revokedAt !== null ||
    session.expiresAt < new Date()
  ) {
    return fail(ws, "Session ended");
  }

  console.log("websocket jwt verified: " + result.userId);
  socketMap.set(result.userId, ws);
  // closed if the session is logged out or revoked
  socketSessions.add(ws, result.sessionId);
  ws.send(JSON.stringify({ type: "auth", success: true }));
};
