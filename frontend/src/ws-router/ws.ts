import { WS_URL } from "../env";
import { useAuthStore } from "../hooks/useStores";
import { useConnectionStore } from "../hooks/useConnectionStore";
import type { WSMessage } from "../types/outgoing-ws-messages";
import { queryClient } from "../utils/queryClient";
import { refreshAccessToken } from "../utils/refreshAccessToken";
import { wsMessageRouter } from "./router";

// the server closes a socket with this when its login session ends
export const SESSION_ENDED = 4003;
// reconnect delays double from 1s up to this
const MAX_RECONNECT_DELAY = 30 * 1000;

let ws: WebSocket | null = null;
let wsIsAuthenticated = false;
// closed by the app (signing out), so don't reconnect
let closingOnPurpose = false;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectAttempts = 0;
// one refresh-and-retry per connection, so a token that keeps failing
// can't cause a loop
let retriedAuth = false;
let messageQueue: WSMessage[] = [];

export const getWs = () => ws;

export const isWsAuthenticated = () => wsIsAuthenticated;

export const setWsAuthenticated = (authenticated: boolean) => {
  wsIsAuthenticated = authenticated;
};

const sendAuth = () => {
  const { token } = useAuthStore.getState().user;
  if (ws?.readyState === WebSocket.OPEN && token) {
    ws.send(JSON.stringify({ type: "auth", token }));
  }
};

export const closeWs = () => {
  closingOnPurpose = true;
  clearTimeout(reconnectTimer);
  reconnectAttempts = 0;
  // nothing queued for this user goes out on a later connection
  messageQueue = [];
  ws?.close();
  ws = null;
  wsIsAuthenticated = false;
};

// the session is over: sign out, which shows the sign-in prompt; signing
// in again starts a new connection
const signOut = () => {
  closeWs();
  queryClient.clear();
  useAuthStore.getState().handleLogOut();
};

const scheduleReconnect = () => {
  if (closingOnPurpose || !useAuthStore.getState().user.token) return;
  const delay = Math.min(1000 * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (!closingOnPurpose && !ws) startWSConnection();
  }, delay);
};

// The server refused the socket's token: it expired (they're short-lived)
// or its session ended. A refresh tells which.
const reauthenticate = async () => {
  const result = await refreshAccessToken();
  if (result.ok) {
    useAuthStore.getState().handleSignIn(result);
    sendAuth();
  } else if (result.rejected) {
    signOut();
  } else {
    // couldn't reach the server; try again later
    ws?.close();
  }
};

export const handleAuthResult = (success: boolean) => {
  setWsAuthenticated(success);
  if (!success) {
    if (retriedAuth) {
      ws?.close();
      return;
    }
    retriedAuth = true;
    void reauthenticate();
    return;
  }
  reconnectAttempts = 0;
  sendQueuedMessages();
  useConnectionStore.getState().connected();
};

export const startWSConnection = () => {
  if (ws) {
    console.log("WebSocket connection already exists");
    return;
  }

  closingOnPurpose = false;
  retriedAuth = false;
  clearTimeout(reconnectTimer);

  const socket = new WebSocket(WS_URL);
  ws = socket;

  socket.onopen = () => {
    console.log("WebSocket connection established");
    sendAuth();
  };
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("Message from server: ", message);
    wsMessageRouter(message);
  };
  socket.onerror = (error) => {
    console.error(`WebSocket error: ${error}`);
  };
  socket.onclose = (event) => {
    // a newer connection may already have replaced this one
    if (ws !== socket) return;
    ws = null;
    setWsAuthenticated(false);
    console.log("WebSocket connection closed", event.code);
    if (closingOnPurpose) return;

    if (event.code === SESSION_ENDED) {
      // logged out elsewhere or revoked; the refresh will fail and sign out
      void refreshAccessToken().then((result) => {
        if (result.ok) {
          useAuthStore.getState().handleSignIn(result);
          startWSConnection();
        } else if (result.rejected) {
          signOut();
        } else {
          scheduleReconnect();
        }
      });
      return;
    }

    // dropped (network, server restart, ...): reconnect
    scheduleReconnect();
  };
};

export const sendWSMessage = (message: WSMessage) => {
  if (!ws || ws.readyState === WebSocket.CONNECTING || !isWsAuthenticated()) {
    // sent once the connection is (re)established
    messageQueue.push(message);
    return;
  }

  if (ws.readyState !== WebSocket.OPEN) {
    messageQueue.push(message);
    return;
  }

  ws.send(JSON.stringify(message));
};

export const sendQueuedMessages = () => {
  if (ws?.readyState !== WebSocket.OPEN) return;

  const queued = messageQueue;
  messageQueue = [];
  queued.forEach((queuedMessage) => ws?.send(JSON.stringify(queuedMessage)));
};
