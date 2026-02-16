import {
  useQueries,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { customQuery } from "./useCustomQuery";
import { useAuthStore } from "./useStores";
import type { Message } from "../types/REST-types/Message";
import { API_URL } from "../env";

export const useFetchMessages = (
  chatroomId: string | undefined,
  getBefore: Date | null,
  limit: number,
) => {
  const user = useAuthStore((state) => state.user);

  return useQuery<Message[]>({
    queryKey: [chatroomId, user.userId, getBefore?.toISOString()],
    queryFn: () =>
      customQuery<Message[]>({
        fetchUrl: `${API_URL}/api/messages/${chatroomId}?getBefore=${getBefore?.toISOString()}&limit=${limit}`,
      }),
    enabled: !!getBefore,
    staleTime: Infinity,
    retryDelay: 1000,
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

  const data = useQueries<MessageQueries>({
    queries: chatroomIds.map((chatroomId) => ({
      queryKey: [chatroomId, user.userId, getBefore?.toISOString()],
      queryFn: () =>
        customQuery<Message[]>({
          fetchUrl: `${API_URL}/api/messages/${chatroomId}?getBefore=${getBefore?.toISOString()}&limit=${limit}`,
        }),
      enabled: !!getBefore,
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
