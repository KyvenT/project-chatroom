import useAuthContext from "../../hooks/useAuthContext";
import type { ChatroomMember } from "../../types/REST-types/ChatroomMember";
import { useParams } from "react-router";
import { useEffect } from "react";
import MemberStatusList from "./MemberStatusList";
import { verifiedQuery } from "../../hooks/useCustomQuery";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import ProfileStatus from "./ProfileStatus";
import { useQuery } from "@tanstack/react-query";
import { useMembersStore } from "../../hooks/useStores";
import { mq } from "../../styles/breakpoints";

const styles = css(
  mq({
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: ["100%", "100%", "25%", "15%"],
    fontSize: ["2rem", "1rem"],
    padding: "4px 2px",
  }),
);

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    borderLeft: `1px solid ${theme.colors.dark_grey}`,
    borderBottom: `1px solid ${theme.colors.dark_grey}`,
  });

const membersListStyles = css({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
});

const MembersPanel = () => {
  const { user } = useAuthContext();
  const { chatroomId } = useParams();
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);
  const setMembers = useMembersStore((state) => state.setMembers);

  const { data } = useQuery<ChatroomMember[]>({
    queryKey: [user.userId, chatroomId],
    queryFn: () =>
      verifiedQuery<ChatroomMember[]>({
        fetchUrl: "http://localhost:3000/api/members/" + chatroomId,
        user,
      }),
    enabled: !!user.userId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!data) return;
    setMembers(data);
  }, [data]);

  const status = members.find((member) => member.memberId === user.userId)
    ?.member.status;

  return (
    <div css={[styles, colors(theme)]}>
      <div css={membersListStyles}>
        <MemberStatusList status="ONLINE" />
        <MemberStatusList status="AWAY" />
        <MemberStatusList status="OFFLINE" />
      </div>
      <ProfileStatus status={status || "OFFLINE"} />
    </div>
  );
};

export default MembersPanel;
