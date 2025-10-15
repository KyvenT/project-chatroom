import {
  useQueries,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { verifiedQuery } from "./useCustomQuery";
import useAuthContext from "./useAuthContext";
import type { Message } from "../types/REST-types/Message";

export const useFetchMessages = (
  chatroomId: string | undefined,
  getBefore: Date | null,
  limit: number,
) => {
  const { user, isLoggedIn } = useAuthContext();

  const data = useQuery<Message[]>({
    queryKey: [chatroomId, isLoggedIn, getBefore?.toISOString()],
    queryFn: () =>
      verifiedQuery<Message[]>({
        fetchUrl: `http://localhost:3000/api/messages/${chatroomId}?getBefore=${getBefore?.toISOString()}&limit=${limit}`,
        user,
      }),
    enabled: !!getBefore,
    staleTime: Infinity,
  });
  return data;
};

type MessageQueries = UseQueryOptions<Message[]>[];

export const useFetchMessagesMultiple = (
  chatroomIds: string[],
  getBefore: Date | null,
  limit: number,
) => {
  const { user, isLoggedIn } = useAuthContext();

  const data = useQueries<MessageQueries>({
    queries: chatroomIds.map((chatroomId) => ({
      queryKey: [chatroomIds.length, isLoggedIn, getBefore?.toISOString()],
      queryFn: () =>
        verifiedQuery<Message[]>({
          fetchUrl: `http://localhost:3000/api/messages/${chatroomId}?getBefore=${getBefore?.toISOString()}&limit=${limit}`,
          user,
        }),
      enabled: !!getBefore,
      staleTime: Infinity,
    })),
  });
  return data;
};
