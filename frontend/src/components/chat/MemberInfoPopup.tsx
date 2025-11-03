import { useQuery } from "@tanstack/react-query";
import type {
  ChatroomMember,
  ChatroomMemberDetails,
} from "../../types/REST-types/ChatroomMember";
import { verifiedQuery } from "../../hooks/useCustomQuery";
import useAuthContext from "../../hooks/useAuthContext";
import { useParams } from "react-router";
import { css, useTheme } from "@emotion/react";
import { mq } from "../../styles/breakpoints";
import type { Theme } from "@emotion/react";
import { useMembersStore } from "../../hooks/useStores";
import Button from "../Button";

export type MemberInfoProps = {
  clickedMember: {
    member: ChatroomMember;
    button: HTMLButtonElement;
  };
};

const styles = (theme: Theme, button: HTMLButtonElement) =>
  css(
    mq({
      position: "absolute",
      top: button.getBoundingClientRect().top,
      left: button.getBoundingClientRect().left,
      transform: "translate(-100%, 0)",
      border: `1px solid ${theme.colors.white}`,
      borderRadius: "6px",
      padding: "8px",
      color: theme.colors.white,
      backgroundColor: theme.colors.grey,
    })
  );

export const MemberInfo = ({
  clickedMember: { member, button },
}: MemberInfoProps) => {
  const { chatroomId } = useParams();
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);
  const { user } = useAuthContext();
  const { data } = useQuery<ChatroomMemberDetails>({
    queryKey: [member.memberId],
    queryFn: () =>
      verifiedQuery({
        fetchUrl: `http://localhost:3000/api/members/${chatroomId}/${member.memberId}`,
        user,
      }),
  });

  const userRole = members.find((mem) => mem.memberId === user.userId)?.role;
  const canKick = userRole !== "MEMBER" && userRole !== member.role;

  return (
    <div css={styles(theme, button)}>
      <h3>{member.member.username}</h3>
      <p>{member.member.status}</p>
      <p>{data && new Date(data.joinedAt).toISOString()}</p>
      {canKick && <Button>Kick</Button>}
    </div>
  );
};
