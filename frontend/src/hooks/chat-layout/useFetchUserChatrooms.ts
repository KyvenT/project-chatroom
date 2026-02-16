import { useQuery } from "@tanstack/react-query";
import { isLoggedInSelector, useChatroomsStore } from "../useStores";
import type { Chatroom } from "../../types/REST-types/Chatroom";
import { customQuery } from "../useCustomQuery";
import { useEffect } from "react";
import { useAuthStore } from "../useStores";
import { API_URL } from "../../env";

export const useFetchUserChatrooms = () => {
  const setChatroomList = useChatroomsStore((state) => state.setChatroomList);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = isLoggedInSelector(useAuthStore());

  const { data: chatroomsData } = useQuery<Chatroom[], Error>({
    queryKey: ["chatrooms", user.userId],
    queryFn: () =>
      customQuery<Chatroom[]>({
        fetchUrl: `${API_URL}/api/chatrooms/me`,
      }),
    enabled: !!isLoggedIn,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (chatroomsData) setChatroomList(chatroomsData);
  }, [chatroomsData]);
};
