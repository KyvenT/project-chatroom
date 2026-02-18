import {
  useQueries,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { customQuery } from "./useCustomQuery";
import { useAuthStore, useChatroomsStore } from "./useStores";
import type { Message } from "../types/REST-types/Message";
import { API_URL } from "../env";

export const useFetchMessages = (
  chatroomId: string | undefined,
  getBefore: Date | null,
  limit: number,
) => {
  const user = useAuthStore((state) => state.user);
  const chatroom = useChatroomsStore((state) =>
    state.chatrooms.find((c) => c.chatroomId === chatroomId),
  );

  const enabled =
    chatroomId !== undefined &&
    chatroom !== undefined &&
    !!user.token &&
    !!getBefore;

  return useQuery<Message[]>({
    queryKey: [chatroomId, user.userId, getBefore?.toISOString()],
    queryFn: () =>
      customQuery<Message[]>({
        fetchUrl: `${API_URL}/api/messages/${chatroomId}?getBefore=${getBefore?.toISOString()}&limit=${limit}`,
      }),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retryDelay: 10000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        return false;
      }
      return failureCount < 3;
    },
  });
};

type MessageQueries = UseQueryOptions<Message[]>[];

export const useFetchMessagesMultiple = (
  chatroomIds: string[],
  getBefore: Date | null,
  limit: number,
) => {
  const user = useAuthStore((state) => state.user);

  let enabled = !!user.token && !!getBefore;

  chatroomIds.forEach((chatroomId) => {
    const chatroom = useChatroomsStore((state) =>
      state.chatrooms.find((c) => c.chatroomId === chatroomId),
    );

    if (!chatroomId || !chatroom) enabled = false;
  });

  const data = useQueries<MessageQueries>({
    queries: chatroomIds.map((chatroomId) => ({
      queryKey: [chatroomId, user.userId, getBefore?.toISOString()],
      queryFn: () =>
        customQuery<Message[]>({
          fetchUrl: `${API_URL}/api/messages/${chatroomId}?getBefore=${getBefore?.toISOString()}&limit=${limit}`,
        }),
      enabled,
      staleTime: Infinity,
      retryDelay: 1000,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message === "Unauthorized") {
          return false;
        }
        return failureCount < 3;
      },
    })),
  });
  return data;
};
