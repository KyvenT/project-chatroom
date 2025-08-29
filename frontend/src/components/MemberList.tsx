import useAuthContext from "../hooks/useAuthContext";
import type { ChatroomMember } from "../types/ChatroomMember";
import { useParams } from "react-router";
import { useMemo } from "react";
import { BidirectionalGroupedMap } from "../lib/bidirectionGroupedMap";
import MemberStatusList from "./MemberStatusList";
import { useCustomQuery } from "../hooks/useCustomQuery";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import ProfileStatus from "./ProfileStatus";

const styles = css({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    borderLeft: `1px solid ${theme.colors.dark_grey}`,
    borderBottom: `1px solid ${theme.colors.dark_grey}`,
  });

const MemberList = () => {
  const { user, isLoggedIn } = useAuthContext();
  const { chatroomId } = useParams();
  const theme = useTheme();

  if (!isLoggedIn || !chatroomId) {
    return <p>Please log in to see the member list.</p>;
  }

  const { data } = useCustomQuery<ChatroomMember>(
    [user.token, chatroomId],
    "member",
    { chatroomId },
  );

  const memberStatusMap = useMemo(() => {
    const map = new BidirectionalGroupedMap<string, string>();
    data?.forEach((chatMember) =>
      map.set(chatMember.member.username, chatMember.member.status),
    );
    return map;
  }, [data]);
  console.log("members: " + data);

  return (
    <div css={[styles, colors(theme)]}>
      <div>
        <MemberStatusList memberStatusMap={memberStatusMap} status="ONLINE" />
        <MemberStatusList memberStatusMap={memberStatusMap} status="AWAY" />
        <MemberStatusList memberStatusMap={memberStatusMap} status="OFFLINE" />
      </div>
      <ProfileStatus status={memberStatusMap.getByKey(user.username)} />
    </div>
  );
};

export default MemberList;
