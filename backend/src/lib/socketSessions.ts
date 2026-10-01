import type WebSocket from "ws";

// Close code telling the client its session ended (logged out or revoked)
export const SESSION_ENDED = 4003;

// Which login session each signed-in socket belongs to, so ending a session
// can disconnect its sockets
class SocketSessions {
  private bySession = new Map<string, Set<WebSocket>>();
  private byWs = new Map<WebSocket, string>();

  add(ws: WebSocket, sessionId: string) {
    this.remove(ws);
    const sockets = this.bySession.get(sessionId) ?? new Set<WebSocket>();
    sockets.add(ws);
    this.bySession.set(sessionId, sockets);
    this.byWs.set(ws, sessionId);
  }

  remove(ws: WebSocket) {
    const sessionId = this.byWs.get(ws);
    if (!sessionId) return;
    this.byWs.delete(ws);
    const sockets = this.bySession.get(sessionId);
    sockets?.delete(ws);
    if (sockets?.size === 0) this.bySession.delete(sessionId);
  }

  // a refresh replaces the session with a new one; its sockets carry on
  rename(oldSessionId: string, newSessionId: string) {
    const sockets = this.bySession.get(oldSessionId);
    if (!sockets) return;
    this.bySession.delete(oldSessionId);
    sockets.forEach((ws) => this.add(ws, newSessionId));
  }

  sessionOf(ws: WebSocket) {
    return this.byWs.get(ws);
  }

  // disconnect everything signed in with these sessions
  endSessions(sessionIds: Iterable<string>) {
    for (const sessionId of sessionIds) {
      this.bySession.get(sessionId)?.forEach((ws) => {
        this.remove(ws);
        ws.close(SESSION_ENDED, "Session ended");
      });
    }
  }
}

export const socketSessions = new SocketSessions();
