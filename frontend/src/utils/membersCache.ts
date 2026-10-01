import type { ChatroomMember } from "../types/REST-types/ChatroomMember";
import { useAuthStore } from "../hooks/useStores";
import { queryClient } from "./queryClient";

// where a chatroom's members are cached for the signed-in user
export const membersQueryKey = (chatroomId: string | undefined) => [
  "members",
  useAuthStore.getState().user.userId,
  chatroomId,
];

// Changes a chatroom's cached member list, if it's been loaded (e.g. by a
// pop-out's members panel)
export const updateCachedMembers = (
  chatroomId: string,
  change: (members: ChatroomMember[]) => ChatroomMember[],
) =>
  queryClient.setQueryData<ChatroomMember[]>(
    membersQueryKey(chatroomId),
    (members) => members && change(members),
  );
