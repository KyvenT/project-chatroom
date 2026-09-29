import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { useState } from "react";

import { customQuery } from "../utils/customQuery";
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
    queryKey: ["messages", chatroomId, user.userId, getBefore?.toISOString()],
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

type MessagePage = { before: string; limit: number };

// Newest messages first, then older pages as fetchNextPage is called. Pages
// are fetched before the time the component mounted, so new messages that
// arrive afterwards don't shift the pages.
export const useFetchMessageHistory = (
  chatroomId: string,
  firstPageSize: number,
  pageSize: number,
) => {
  const user = useAuthStore((state) => state.user);
  const [firstBefore] = useState(() => new Date().toISOString());

  return useInfiniteQuery<
    Message[],
    Error,
    InfiniteData<Message[], MessagePage>,
    unknown[],
    MessagePage
  >({
    queryKey: ["messageHistory", chatroomId, user.userId, firstBefore],
    queryFn: ({ pageParam }) =>
      customQuery<Message[]>({
        fetchUrl: `${API_URL}/api/messages/${chatroomId}?getBefore=${pageParam.before}&limit=${pageParam.limit}`,
      }),
    initialPageParam: { before: firstBefore, limit: firstPageSize },
    // a short page means there's nothing older left to fetch
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < lastPageParam.limit
        ? undefined
        : {
            before: new Date(
              lastPage[lastPage.length - 1].createdAt,
            ).toISOString(),
            limit: pageSize,
          },
    enabled: !!user.token && !!chatroomId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retryDelay: 1000,
    retry: (failureCount, error) => {
      if (error.message === "Unauthorized") return false;
      return failureCount < 3;
    },
  });
};
