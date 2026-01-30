import { useQuery } from "@tanstack/react-query";
import { useChatroomsStore } from "../useStores";
import type { Chatroom } from "../../types/REST-types/Chatroom";
import { verifiedQuery } from "../useCustomQuery";
import { useEffect } from "react";
import useAuthContext from "../useAuthContext";
import { API_URL } from "../../env";

export const useFetchUserChatrooms = () => {
  const setChatroomList = useChatroomsStore((state) => state.setChatroomList);
  const { isLoggedIn, user } = useAuthContext();

  const { data: chatroomsData } = useQuery<Chatroom[], Error>({
    queryKey: ["chatrooms", user.userId],
    queryFn: () =>
      verifiedQuery<Chatroom[]>({
        fetchUrl: `${API_URL}/api/chatrooms/me`,
        user,
      }),
    enabled: !!isLoggedIn,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (chatroomsData) setChatroomList(chatroomsData);
  }, [chatroomsData]);
};
