import type { InfiniteData } from "@tanstack/react-query";
import { usePopoutStore } from "../../hooks/usePopoutStore";
import { useMessagesStore } from "../../hooks/useStores";
import type { Message, Reaction } from "../../types/REST-types/Message";
import { queryClient } from "../../utils/queryClient";

// Changes the chatroom's loaded message history (pop-outs and pinned
// previews) page by page
const updateHistory = (
  chatroomId: string,
  change: (page: Message[]) => Message[],
) =>
  queryClient.setQueriesData<InfiniteData<Message[]>>(
    { queryKey: ["messageHistory", chatroomId] },
    (data) => data && { ...data, pages: data.pages.map(change) },
  );

// An edited message replaces the old one wherever it's showing. Also used by
// the editor itself, so the change shows without waiting for the socket.
export const applyMessageEdit = (message: Message) => {
  useMessagesStore.getState().updateMessage(message);
  usePopoutStore.getState().updateLiveMessage(message);
  updateHistory(message.chatroomId, (page) =>
    page.map((m) => (m.id === message.id ? message : m)),
  );
};

// A deleted message is taken out wherever it's showing
export const applyMessageDelete = (chatroomId: string, messageId: string) => {
  useMessagesStore.getState().removeMessage(messageId);
  usePopoutStore.getState().removeLiveMessage(chatroomId, messageId);
  updateHistory(chatroomId, (page) => page.filter((m) => m.id !== messageId));
};

// A message's reactions change wherever it's showing. Also used by the
// reactor, so the change shows without waiting for the socket.
export const applyMessageReactions = (
  chatroomId: string,
  messageId: string,
  reactions: Reaction[],
) => {
  const change = (m: Message) => (m.id === messageId ? { ...m, reactions } : m);
  useMessagesStore.setState((state) => ({
    messages: state.messages.map(change),
  }));
  usePopoutStore.setState((state) => {
    const live = state.liveMessages[chatroomId];
    return live
      ? {
          liveMessages: {
            ...state.liveMessages,
            [chatroomId]: live.map(change),
          },
        }
      : state;
  });
  updateHistory(chatroomId, (page) => page.map(change));
};
