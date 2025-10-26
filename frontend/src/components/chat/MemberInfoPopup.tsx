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

export type MemberInfoProps = {
  member: ChatroomMember;
};

const styles = (theme: Theme) =>
  css(
    mq({
      position: "absolute",
      right: 0,
      transform: "translate(-100%, 0)",
      border: `1px solid ${theme.colors.white}`,
      borderRadius: "6px",
      padding: "8px",
      color: theme.colors.white,
      backgroundColor: theme.colors.grey,
    }),
  );

export const MemberInfo = ({ member }: MemberInfoProps) => {
  const { chatroomId } = useParams();
  const theme = useTheme();
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
    <div css={styles(theme)}>
      <h3>{member.member.username}</h3>
      <p>{member.member.status}</p>
      <p>{data && new Date(data.joinedAt).toISOString()}</p>
    </div>
  );
};
