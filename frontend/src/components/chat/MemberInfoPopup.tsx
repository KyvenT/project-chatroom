import { useQuery } from "@tanstack/react-query";
import type {
  ChatroomMember,
  ChatroomMemberDetails,
} from "../../types/REST-types/ChatroomMember";
import { verifiedQuery } from "../../hooks/useCustomQuery";
import useAuthContext from "../../hooks/useAuthContext";
import { useParams } from "react-router";

export type MemberInfoProps = {
  member: ChatroomMember;
};

export const MemberInfo = ({ member }: MemberInfoProps) => {
  const { chatroomId } = useParams();
  const { user } = useAuthContext();
  const { data } = useQuery<ChatroomMemberDetails>({
    queryKey: [member.memberId],
    queryFn: () =>
      verifiedQuery({
        fetchUrl: `http://localhost:3000/api/members/${chatroomId}/${member.memberId}`,
        user,
      }),
  });

  return (
    <div>
      <h3>{member.member.username}</h3>
      <p>{member.member.status}</p>
      <p>{data && new Date(data.joinedAt).toISOString()}</p>
    </div>
  );
};
