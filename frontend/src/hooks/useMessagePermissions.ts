import { useCallback } from "react";
import type { Message } from "../types/REST-types/Message";
import {
  useActiveChatroomStore,
  useAuthStore,
  useChatroomsStore,
  useMembersStore,
} from "./useStores";

// What the signed-in user may do to a chatroom's messages: react to any, edit
// the text of their own, and delete their own or, as the chatroom's owner or
// an admin, anyone's. The server checks the same rules.
export const useMessagePermissions = (chatroomId: string | undefined) => {
  const userId = useAuthStore((state) => state.user.userId);
  const ownerId = useChatroomsStore(
    (state) =>
      state.chatrooms.find((c) => c.chatroomId === chatroomId)?.chatroom
        .ownerId,
  );
  // members (and so roles) are only loaded for the open chatroom
  const isActive = useActiveChatroomStore(
    (state) => state.activeChatroomId === chatroomId,
  );
  const role = useMembersStore((state) =>
    isActive
      ? state.members.find((m) => m.memberId === userId)?.role
      : undefined,
  );
  const moderates =
    (!!userId && ownerId === userId) || role === "OWNER" || role === "ADMIN";

  return useCallback(
    (message: Pick<Message, "senderUserId" | "attachment">) => {
      const isOwn = !!userId && message.senderUserId === userId;
      return {
        canReact: !!userId,
        canEdit: isOwn && !message.attachment,
        canDelete: isOwn || moderates,
      };
    },
    [userId, moderates],
  );
};
