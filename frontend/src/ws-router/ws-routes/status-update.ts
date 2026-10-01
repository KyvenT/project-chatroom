import { useActiveChatroomStore, useMembersStore } from "../../hooks/useStores";
import type { StatusMessage } from "../../types/ws-messages";
import { updateCachedMembers } from "../../utils/membersCache";

export const handleStatusUpdate = (message: StatusMessage) => {
  const { member } = message;
  // pop-outs show members of chatrooms other than the page's
  updateCachedMembers(message.chatroomId, (members) =>
    members.map((m) =>
      m.memberId === member.memberId
        ? { ...m, member: { ...m.member, status: member.member.status } }
        : m,
    ),
  );

  const chatroomId = useActiveChatroomStore.getState().activeChatroomId;
  if (message.chatroomId !== chatroomId) return;
  useMembersStore.getState().updateMember(member);
};
