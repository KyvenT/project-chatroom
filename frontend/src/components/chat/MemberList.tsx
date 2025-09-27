import useAuthContext from "../../hooks/useAuthContext";
import type { ChatroomMember } from "../../types/REST-types/ChatroomMember";
import { useParams } from "react-router";
import { useEffect, useMemo } from "react";
import { BidirectionalGroupedMap } from "../../lib/bidirectionGroupedMap";
import MemberStatusList from "./MemberStatusList";
import { verifiedQuery } from "../../hooks/useCustomQuery";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import ProfileStatus, { type Status } from "./ProfileStatus";
import { useQuery } from "@tanstack/react-query";
import { useMembersStore } from "../../hooks/useStores";

const styles = css({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "15%",
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    borderLeft: `1px solid ${theme.colors.dark_grey}`,
    borderBottom: `1px solid ${theme.colors.dark_grey}`,
  });

const membersListStyles = css({
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
});

const MemberList = () => {
  const { user, isLoggedIn } = useAuthContext();
  const { chatroomId } = useParams();
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);
  const setMembers = useMembersStore((state) => state.setMembers);

  const { data } = useQuery<ChatroomMember[]>({
    queryKey: [user.token, chatroomId],
    queryFn: () =>
      verifiedQuery<ChatroomMember[]>({
        fetchUrl: "http://localhost:3000/api/members/" + chatroomId,
        user,
      }),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (!data) return;
    setMembers(data);
  }, [data]);

  const { onlineList, awayList, offlineList, status } = useMemo(() => {
    const memberStatusMap = new BidirectionalGroupedMap<string, Status>();
    members.forEach((chatMember) =>
      memberStatusMap.set(chatMember.member.username, chatMember.member.status),
    );

    const onlineList = [...(memberStatusMap?.getByValue("ONLINE") ?? [])];
    const awayList = [...(memberStatusMap?.getByValue("AWAY") ?? [])];
    const offlineList = [...(memberStatusMap?.getByValue("OFFLINE") ?? [])];
    const status = memberStatusMap?.getByKey(user.username);

    return { onlineList, awayList, offlineList, status };
  }, [members, user.username]);

  if (!isLoggedIn) {
    return <p>Please log in to see the member list.</p>;
  }

  return (
    <div css={[styles, colors(theme)]}>
      <div css={membersListStyles}>
        {onlineList.length !== 0 && (
          <MemberStatusList members={onlineList} status="ONLINE" />
        )}
        {awayList.length !== 0 && (
          <MemberStatusList members={awayList} status="AWAY" />
        )}
        {offlineList.length !== 0 && (
          <MemberStatusList members={offlineList} status="OFFLINE" />
        )}
      </div>
      <ProfileStatus status={status || "OFFLINE"} />
    </div>
  );
};

export default MemberList;
