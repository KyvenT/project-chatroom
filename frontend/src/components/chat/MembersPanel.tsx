import useAuthContext from "../../hooks/useAuthContext";
import type { ChatroomMember } from "../../types/REST-types/ChatroomMember";
import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { verifiedQuery } from "../../hooks/useCustomQuery";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import ProfileStatus from "./ProfileStatus";
import { useQuery } from "@tanstack/react-query";
import { useMembersStore } from "../../hooks/useStores";
import { mq } from "../../styles/breakpoints";
import { MemberInfo } from "./MemberInfoPopup";
import Button from "../Button";

const styles = css(
  mq({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: ["100%", "100%", "25%", "15%"],
    fontSize: ["2rem", "1rem"],
    padding: "4px 2px",

    h3: {
      fontWeight: 500,
      fontSize: ".66rem",
      userSelect: "none",
    },

    ul: {
      padding: 0,
    },

    li: {
      listStyle: "none",
      borderRadius: "2px",
      margin: "4px",
      padding: "2px",
    },
  })
);

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    borderLeft: `1px solid ${theme.colors.dark_grey}`,
    borderBottom: `1px solid ${theme.colors.dark_grey}`,

    h3: {
      color: theme.colors.grey,
    },

    li: {
      color: theme.colors.white,
    },

    "li:hover": {
      backgroundColor: theme.colors.dark_grey,
    },
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
  const [clickedMember, setClickedMember] = useState<ChatroomMember | null>(
    null
  );

  const { data } = useQuery<ChatroomMember[]>({
    queryKey: [user.userId, chatroomId],
    queryFn: () =>
      verifiedQuery<ChatroomMember[]>({
        fetchUrl: "http://localhost:3000/api/members/" + chatroomId,
        user,
      }),
    enabled: !!user.userId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!data) return;
    setMembers(data);
  }, [data]);

  const onMemberClick = (member: ChatroomMember) => {
    setClickedMember(member);
  };

  const { statusLists, status } = useMemo(() => {
    const onlineList = members.filter(
      (member) => member.member.status === "ONLINE"
    );
    const awayList = members.filter(
      (member) => member.member.status === "AWAY"
    );
    const offlineList = members.filter(
      (member) => member.member.status === "OFFLINE"
    );
    const status = members.find((member) => member.memberId === user.userId)
      ?.member.status;

    return { statusLists: [onlineList, awayList, offlineList], status };
  }, [members]);

  return (
    <>
      <div css={[styles, colors(theme)]}>
        <div css={membersListStyles}>
          {statusLists.map((statusList) => (
            <>
              {statusList.length > 0 && (
                <div>
                  <h3>{statusList[0].member.status}</h3>
                  <ul>
                    {statusList.map((member) => (
                      <li key={member.memberId}>
                        <Button
                          variant="icon"
                          className="memberBtn"
                          onClick={() => onMemberClick(member)}
                        >
                          {member.member.username}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ))}
        </div>
        <ProfileStatus status={status || "OFFLINE"} />
        {clickedMember && <MemberInfo member={clickedMember} />}
      </div>
    </>
  );
};

export default MembersPanel;
